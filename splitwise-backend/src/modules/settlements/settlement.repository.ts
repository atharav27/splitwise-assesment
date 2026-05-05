import mongoose from 'mongoose';
import { DUST_THRESHOLD } from '../../utils/constants';

const { Settlement, Ledger } = require('../../models');

type Session = mongoose.ClientSession;

export const create = (data: Record<string, unknown>, session: Session) =>
  Settlement.create([data], { session }).then((r: Array<Record<string, unknown>>) => r[0]);

export const decrementLedger = async ({
  fromUserId,
  toUserId,
  groupId,
  amount,
  session,
}: {
  fromUserId: string;
  toUserId: string;
  groupId: string | null;
  amount: number;
  session: Session;
}) => {
  const ids = [fromUserId.toString(), toUserId.toString()].sort();
  const [canonFrom, canonTo] = ids;
  const delta = canonFrom === fromUserId.toString() ? -amount : amount;

  return Ledger.findOneAndUpdate(
    { fromUser: canonFrom, toUser: canonTo, groupId: groupId || null },
    { $inc: { amount: delta }, $set: { lastUpdatedAt: new Date() } },
    { new: true, session }
  );
};

export const getLedgerEntry = ({
  fromUserId,
  toUserId,
  groupId,
}: {
  fromUserId: string;
  toUserId: string;
  groupId: string | null;
}) => {
  const ids = [fromUserId.toString(), toUserId.toString()].sort();
  const [canonFrom, canonTo] = ids;
  return Ledger.findOne({ fromUser: canonFrom, toUser: canonTo, groupId: groupId || null });
};

export const getAllLedgerRowsForPair = (fromUserId: string, toUserId: string) => {
  const ids = [fromUserId.toString(), toUserId.toString()].sort();
  const [canonFrom, canonTo] = ids;
  return Ledger.find({
    fromUser: canonFrom,
    toUser: canonTo,
    $or: [{ amount: { $gt: DUST_THRESHOLD } }, { amount: { $lt: -DUST_THRESHOLD } }],
  }).sort({ lastUpdatedAt: 1, groupId: 1, _id: 1 });
};

export const getLedgerByGroup = (groupId: string) =>
  Ledger.find({ groupId, amount: { $gt: DUST_THRESHOLD } });

export const findByUser = (userId: string, cursor: string | undefined, limit: number) => {
  const filter: Record<string, unknown> = {
    $or: [{ fromUser: userId }, { toUser: userId }],
  };
  if (cursor) filter._id = { $lt: cursor };

  return Settlement.find(filter)
    .populate('fromUser', '_id name email')
    .populate('toUser', '_id name email')
    .sort({ _id: -1 })
    .limit(limit + 1);
};

export const findByGroup = (groupId: string, cursor: string | undefined, limit: number) => {
  const filter: Record<string, unknown> = { groupId };
  if (cursor) filter._id = { $lt: cursor };

  return Settlement.find(filter)
    .populate('fromUser', '_id name email')
    .populate('toUser', '_id name email')
    .sort({ _id: -1 })
    .limit(limit + 1);
};
