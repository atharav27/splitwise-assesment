import mongoose from 'mongoose';
import AppError from '../../utils/AppError';
import { DUST_THRESHOLD } from '../../utils/constants';
import { paginateCursor } from '../../utils/pagination';
import { signedDebtFromUserToUser } from '../../utils/ledgerNetting';
import { round2 } from '../../utils/splitCalculator';
import { optimizeSettlements } from '../../utils/settlementOptimizer';
import * as activityService from '../activity/activity.service';
import * as groupRepo from '../groups/group.repository';
import * as userRepo from '../users/user.repository';
import * as settlementRepo from './settlement.repository';
import type { PayInput, SettlementPaginationInput } from './settlement.validator';

type LedgerDocLike = {
  amount: number;
};

type LedgerRow = {
  _id: { toString: () => string };
  amount: number;
  groupId: string | { toString: () => string } | null;
};

const toGroupIdString = (groupId: LedgerRow['groupId']): string | null => {
  if (groupId == null) return null;
  if (typeof groupId === 'string') return groupId;
  return groupId.toString();
};

const payOverall = async (params: {
  fromUser: string;
  toUser: string;
  amount: number;
  note: string;
  requesterId: string;
}) => {
  const { fromUser, toUser, amount, note, requesterId } = params;

  const rows = (await settlementRepo.getAllLedgerRowsForPair(fromUser, toUser)) as LedgerRow[];
  if (!rows.length) throw new AppError('No outstanding debt found between these users', 400);

  let totalNet = 0;
  for (const row of rows) {
    totalNet = round2(totalNet + signedDebtFromUserToUser(fromUser, toUser, row.amount));
  }
  if (totalNet <= DUST_THRESHOLD) {
    throw new AppError('No outstanding debt — this user does not owe the other', 400);
  }
  if (amount > round2(totalNet)) {
    throw new AppError(
      `Settlement amount (${amount}) exceeds outstanding debt (${round2(totalNet)})`,
      400
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const settlement = await settlementRepo.create(
      {
        fromUser,
        toUser,
        groupId: null,
        amount,
        note,
        createdBy: requesterId,
      },
      session
    );

    let remaining = amount;
    for (const row of rows) {
      if (remaining <= DUST_THRESHOLD) break;
      const owed = signedDebtFromUserToUser(fromUser, toUser, row.amount);
      if (owed <= DUST_THRESHOLD) continue;
      const take = round2(Math.min(remaining, owed));
      await settlementRepo.decrementLedger({
        fromUserId: fromUser,
        toUserId: toUser,
        groupId: toGroupIdString(row.groupId),
        amount: take,
        session,
      });
      remaining = round2(remaining - take);
    }

    if (remaining > DUST_THRESHOLD) {
      throw new AppError('Settlement allocation failed', 500);
    }

    await session.commitTransaction();
    const targetUser = await userRepo.findById(toUser.toString());
    activityService.logActivity(
      requesterId,
      'settlement.paid',
      'Settlement',
      settlement._id.toString(),
      null,
      {
        amount,
        userId: toUser.toString(),
        userName: targetUser?.name || targetUser?.email || 'user',
        overall: true,
      }
    );
    return settlement;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const pay = async (payload: PayInput, requesterId: string) => {
  const { fromUser, toUser, amount, groupId, note, overall } = payload;
  if (requesterId.toString() !== fromUser.toString()) {
    throw new AppError('Access denied — you can only settle your own dues', 403);
  }
  if (fromUser === toUser) throw new AppError('Cannot settle with yourself', 400);

  const roundedAmount = round2(amount);

  if (overall) {
    return payOverall({
      fromUser,
      toUser,
      amount: roundedAmount,
      note,
      requesterId,
    });
  }

  const ledgerEntry = (await settlementRepo.getLedgerEntry({
    fromUserId: fromUser,
    toUserId: toUser,
    groupId: groupId || null,
  })) as LedgerDocLike | null;

  if (!ledgerEntry || ledgerEntry.amount <= DUST_THRESHOLD) {
    throw new AppError('No outstanding debt found between these users', 400);
  }

  const ids = [fromUser.toString(), toUser.toString()].sort();
  const canonFrom = ids[0];
  const isCanonical = canonFrom === fromUser.toString();
  const owedAmount = isCanonical ? ledgerEntry.amount : -ledgerEntry.amount;

  if (owedAmount <= DUST_THRESHOLD) {
    throw new AppError('No outstanding debt — this user does not owe the other', 400);
  }

  if (roundedAmount > round2(owedAmount)) {
    throw new AppError(
      `Settlement amount (${roundedAmount}) exceeds outstanding debt (${round2(owedAmount)})`,
      400
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const settlement = await settlementRepo.create(
      {
        fromUser,
        toUser,
        groupId: groupId || null,
        amount: roundedAmount,
        note,
        createdBy: requesterId,
      },
      session
    );

    await settlementRepo.decrementLedger({
      fromUserId: fromUser,
      toUserId: toUser,
      groupId: groupId || null,
      amount: roundedAmount,
      session,
    });

    await session.commitTransaction();
    const targetUser = await userRepo.findById(toUser.toString());
    activityService.logActivity(
      requesterId,
      'settlement.paid',
      'Settlement',
      settlement._id.toString(),
      groupId || null,
      {
        amount: roundedAmount,
        userId: toUser.toString(),
        userName: targetUser?.name || targetUser?.email || 'user',
      }
    );
    return settlement;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const getOptimizedSettlements = async (groupId: string, requesterId: string) => {
  const isMember = await groupRepo.isActiveGroupMember(groupId, requesterId);
  if (isMember === null) throw new AppError('Group not found', 404);
  if (!isMember) throw new AppError('Access denied — not a group member', 403);

  const ledgerEntries = await settlementRepo.getLedgerByGroup(groupId);
  if (!ledgerEntries.length) return { transactions: [], count: 0 };

  const userIds = [
    ...new Set<string>(
      ledgerEntries.flatMap((e: { fromUser: { toString: () => string }; toUser: { toString: () => string } }) => [
        e.fromUser.toString(),
        e.toUser.toString(),
      ])
    ),
  ];
  const users = await userRepo.findByIds(userIds);
  const userMap = Object.fromEntries(
    users.map((u: { _id: { toString: () => string } }) => [u._id.toString(), u])
  );

  const transactions = optimizeSettlements(ledgerEntries, userMap);
  return { transactions, count: transactions.length };
};

export const getMySettlements = async (userId: string, query: SettlementPaginationInput) => {
  const raw = await settlementRepo.findByUser(userId, query.cursor, query.limit);
  const { data, nextCursor } = paginateCursor(raw as Array<{ _id: { toString: () => string } }>, query.limit);
  return { settlements: data, nextCursor };
};

export const getGroupSettlements = async (
  groupId: string,
  userId: string,
  query: SettlementPaginationInput
) => {
  const isMember = await groupRepo.isActiveGroupMember(groupId, userId);
  if (isMember === null) throw new AppError('Group not found', 404);
  if (!isMember) throw new AppError('Access denied', 403);

  const raw = await settlementRepo.findByGroup(groupId, query.cursor, query.limit);
  const { data, nextCursor } = paginateCursor(raw as Array<{ _id: { toString: () => string } }>, query.limit);
  return { settlements: data, nextCursor };
};
