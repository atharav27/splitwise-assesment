import { DUST_THRESHOLD } from '../../utils/constants';

const { Ledger } = require('../../models');

export const findUserLedgerEntries = (userId: string) =>
  Ledger.find({
    $and: [
      { $or: [{ fromUser: userId }, { toUser: userId }] },
      {
        $or: [{ amount: { $gt: DUST_THRESHOLD } }, { amount: { $lt: -DUST_THRESHOLD } }],
      },
    ],
  })
    .populate('fromUser', '_id name email avatar')
    .populate('toUser', '_id name email avatar');

export const findGroupLedgerEntries = (groupId: string) =>
  Ledger.find({
    groupId,
    $or: [{ amount: { $gt: DUST_THRESHOLD } }, { amount: { $lt: -DUST_THRESHOLD } }],
  })
    .populate('fromUser', '_id name email avatar')
    .populate('toUser', '_id name email avatar');
