import mongoose from 'mongoose';
import { saveIdempotencyRecord } from '../../middlewares/idempotency.middleware';
import * as groupRepo from '../groups/group.repository';
import * as activityService from '../activity/activity.service';
import * as userRepo from '../users/user.repository';
import AppError from '../../utils/AppError';
import { buildPageMeta } from '../../utils/pagination';
import { calculateSplit, round2 } from '../../utils/splitCalculator';
import * as expenseRepo from './expense.repository';
import type { CreateExpenseInput, ExpensePaginationInput, UpdateExpenseInput } from './expense.validator';

type ExpenseDocLike = {
  _id: { toString: () => string };
  toObject: () => Record<string, unknown>;
  paidBy: string | { _id?: { toString: () => string }; toString: () => string };
  groupId: string | null | { toString: () => string };
  splitType: string;
  splitDetails: Array<{ userId: string | { toString: () => string }; amount?: number; percentage?: number }>;
  history?: unknown[];
};

export const createExpense = async (
  body: CreateExpenseInput,
  requesterId: string,
  idempotencyKey?: string
) => {
  const { description, amount, currency, paidBy, groupId, category, splitType, splitDetails } = body;

  const participantIds = [...new Set(splitDetails.map((d) => d.userId.toString()))];
  await assertUsersExist([...participantIds, paidBy.toString()]);
  if (groupId) await assertGroupMembers(groupId, [paidBy, ...participantIds]);

  const computedSplits = calculateSplit(splitType, round2(amount), splitDetails, participantIds, paidBy);

  const session = await mongoose.startSession();
  session.startTransaction();
  let expense: Record<string, unknown>;
  try {
    expense = await expenseRepo.create(
      {
        description,
        amount: round2(amount),
        currency,
        paidBy,
        groupId: groupId || null,
        category,
        splitType,
        splitDetails: computedSplits,
        idempotencyKey: idempotencyKey || undefined,
      },
      session
    );

    for (const detail of computedSplits) {
      if (detail.userId.toString() === paidBy.toString()) continue;
      await expenseRepo.upsertLedger({
        payerId: paidBy,
        participantId: detail.userId,
        groupId: groupId || null,
        delta: detail.amount,
        session,
      });
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  await saveIdempotencyRecord(
    idempotencyKey,
    { success: true, data: expense, message: 'Expense created' },
    201
  );
  activityService.logActivity(
    requesterId,
    'expense.created',
    'Expense',
    String((expense as { _id?: unknown })._id),
    groupId || null,
    { amount: round2(amount), description }
  );

  return expense;
};

export const getExpenses = async (query: ExpensePaginationInput, requesterId: string) => {
  const { page, limit, groupId, category } = query;
  const requesterGroupIds = await getRequesterGroupIds(requesterId);
  const baseVisibilityFilter: Record<string, unknown> = {
    $or: [
      { groupId: null, $or: [{ paidBy: requesterId }, { 'splitDetails.userId': requesterId }] },
      { groupId: { $in: requesterGroupIds } }, 
    ],
  };

  const filter: Record<string, unknown> = { isDeleted: false, ...baseVisibilityFilter };
  if (groupId) {
    if (!requesterGroupIds.includes(groupId.toString())) {
      return { expenses: [], pagination: buildPageMeta(0, page, limit) };
    }
    filter.groupId = groupId;
  }
  if (category) filter.category = category;

  const [expenses, total] = await Promise.all([
    expenseRepo.findAll({ filter, page, limit }),
    expenseRepo.countAll(filter),
  ]);

  return { expenses, pagination: buildPageMeta(total, page, limit) };
};

export const getExpenseById = async (id: string) => {
  const expense = await expenseRepo.findById(id);
  if (!expense) throw new AppError('Expense not found', 404);
  return expense;
};

export const getExpenseByIdForRequester = async (id: string, requesterId: string) => {
  const expense = await getExpenseById(id);
  await assertCanAccessExpense(expense as ExpenseDocLike, requesterId);
  return expense;
};

export const updateExpense = async (id: string, body: UpdateExpenseInput, requesterId: string) => {
  const existing = (await expenseRepo.findByIdRaw(id)) as ExpenseDocLike | null;
  if (!existing) throw new AppError('Expense not found', 404);
  assertCanModify(existing, requesterId);

  const merged = { ...existing.toObject(), ...body } as Record<string, any>;
  const { description, amount, currency, paidBy, groupId, category, splitType, splitDetails } = merged;

  const participantIds: string[] = [
    ...new Set((splitDetails as Array<{ userId: unknown }>).map((d) => String(d.userId))),
  ];
  await assertUsersExist([...participantIds, paidBy.toString()]);
  if (groupId) await assertGroupMembers(groupId.toString(), [paidBy.toString(), ...participantIds]);

  const computedSplits = calculateSplit(
    splitType,
    round2(amount),
    splitDetails,
    participantIds,
    paidBy.toString()
  );

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const snapshot = existing.toObject();
    const historyEntry = { updatedAt: new Date(), updatedBy: requesterId, snapshot };
    const historySlice = [...(existing.history || []), historyEntry].slice(-20);

    const existingPaidBy = toIdString(existing.paidBy);
    const existingGroupId = existing.groupId ? toIdString(existing.groupId) : null;
    const existingSplitDetails = existing.splitDetails.map((d) => ({
      userId: toIdString(d.userId),
      amount: Number(d.amount || 0),
    }));

    await expenseRepo.reverseLedgerForExpense({
      splitDetails: existingSplitDetails,
      payerId: existingPaidBy,
      groupId: existingGroupId,
      session,
    });

    for (const detail of computedSplits) {
      if (detail.userId.toString() === paidBy.toString()) continue;
      await expenseRepo.upsertLedger({
        payerId: paidBy.toString(),
        participantId: detail.userId,
        groupId: groupId ? groupId.toString() : null,
        delta: detail.amount,
        session,
      });
    }

    const updated = await expenseRepo.updateById(
      id,
      {
        description,
        amount: round2(amount),
        currency,
        paidBy,
        groupId: groupId || null,
        category,
        splitType,
        splitDetails: computedSplits,
        history: historySlice,
      },
      session
    );

    await session.commitTransaction();
    activityService.logActivity(requesterId, 'expense.updated', 'Expense', id, groupId ? groupId.toString() : null, {
      amount: round2(amount),
    });
    return updated;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const deleteExpense = async (id: string, requesterId: string) => {
  const existing = (await expenseRepo.findByIdRaw(id)) as ExpenseDocLike | null;
  if (!existing) throw new AppError('Expense not found', 404);
  assertCanModify(existing, requesterId);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existingPaidBy = toIdString(existing.paidBy);
    const existingGroupId = existing.groupId ? toIdString(existing.groupId) : null;
    const existingSplitDetails = existing.splitDetails.map((d) => ({
      userId: toIdString(d.userId),
      amount: Number(d.amount || 0),
    }));

    await expenseRepo.reverseLedgerForExpense({
      splitDetails: existingSplitDetails,
      payerId: existingPaidBy,
      groupId: existingGroupId,
      session,
    });

    await expenseRepo.updateById(id, { isDeleted: true, deletedAt: new Date() }, session);
    await session.commitTransaction();
    activityService.logActivity(
      requesterId,
      'expense.deleted',
      'Expense',
      id,
      existingGroupId,
      {}
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const assertCanModify = (expense: ExpenseDocLike, userId: string) => {
  if (toIdString(expense.paidBy) !== userId.toString()) {
    throw new AppError('Only the payer can modify this expense', 403);
  }
};

const assertCanAccessExpense = async (expense: ExpenseDocLike, requesterId: string) => {
  const requester = requesterId.toString();
  const expenseGroupId = expense.groupId ? toIdString(expense.groupId) : null;
  if (expenseGroupId) {
    const isMember = await groupRepo.isActiveGroupMember(expenseGroupId, requester);
    if (!isMember) throw new AppError('Access denied', 403);
    return;
  }

  const paidById = toIdString(expense.paidBy);
  if (paidById === requester) return;

  const isParticipant = expense.splitDetails.some((detail) => toIdString(detail.userId) === requester);
  if (!isParticipant) throw new AppError('Access denied', 403);
};

const getRequesterGroupIds = async (requesterId: string) => {
  const groups = (await groupRepo.findByMember(requesterId)) as Array<{ _id: { toString: () => string } }>;
  return groups.map((group) => group._id.toString());
};

const assertUsersExist = async (userIds: string[]) => {
  const foundIds = await userRepo.findActiveIds(userIds);
  const foundSet = new Set(foundIds.map((id) => id.toString()));
  const missing = userIds.filter((id) => !foundSet.has(id.toString()));
  if (missing.length) throw new AppError(`Users not found: ${missing.join(', ')}`, 400);
};

const assertGroupMembers = async (groupId: string, userIds: string[]) => {
  const memberIds = await groupRepo.findActiveGroupMemberIds(groupId);
  if (!memberIds) throw new AppError('Group not found', 404);
  const memberSet = new Set(memberIds.map((id) => id.toString()));
  const nonMembers = userIds.filter((id) => !memberSet.has(id.toString()));
  if (nonMembers.length) throw new AppError(`Users not in group: ${nonMembers.join(', ')}`, 403);
};

const toIdString = (value: string | { _id?: { toString: () => string }; toString: () => string }) =>
  typeof value === 'string' ? value : value._id?.toString() || value.toString();
