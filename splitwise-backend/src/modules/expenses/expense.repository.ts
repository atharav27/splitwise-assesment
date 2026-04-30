import mongoose from 'mongoose';

const { Expense, Ledger } = require('../../models');

type Session = mongoose.ClientSession;

export const create = (data: Record<string, unknown>, session: Session) =>
  Expense.create([data], { session }).then((r: Array<Record<string, unknown>>) => r[0]);

export const findById = (id: string) =>
  Expense.findOne({ _id: id, isDeleted: false })
    .populate('paidBy', '_id name email')
    .populate('splitDetails.userId', '_id name email');

export const findByIdRaw = (id: string) => Expense.findOne({ _id: id, isDeleted: false });

export const findAll = ({ filter, page, limit }: { filter: Record<string, unknown>; page: number; limit: number }) =>
  Expense.find(filter)
    .populate('paidBy', '_id name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

export const countAll = (filter: Record<string, unknown>) => Expense.countDocuments(filter);

export const updateById = (id: string, update: Record<string, unknown>, session: Session) =>
  Expense.findByIdAndUpdate(id, update, { new: true, session });

export const upsertLedger = async ({
  payerId,
  participantId,
  groupId,
  delta,
  session,
}: {
  payerId: string;
  participantId: string;
  groupId: string | null;
  delta: number;
  session: Session;
}) => {
  if (payerId.toString() === participantId.toString()) return;

  const ids = [payerId.toString(), participantId.toString()].sort();
  const [from, to] = ids;
  const canonicalDelta = from === participantId.toString() ? delta : -delta;

  await Ledger.findOneAndUpdate(
    { fromUser: from, toUser: to, groupId: groupId || null },
    { $inc: { amount: canonicalDelta }, $set: { lastUpdatedAt: new Date() } },
    { upsert: true, new: true, session }
  );
};

export const reverseLedgerForExpense = async ({
  splitDetails,
  payerId,
  groupId,
  session,
}: {
  splitDetails: Array<{ userId: string; amount: number }>;
  payerId: string;
  groupId: string | null;
  session: Session;
}) => {
  for (const detail of splitDetails) {
    if (detail.userId.toString() === payerId.toString()) continue;
    await upsertLedger({
      payerId,
      participantId: detail.userId,
      groupId,
      delta: -detail.amount,
      session,
    });
  }
};
