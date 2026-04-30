import { DUST_THRESHOLD } from '../../utils/constants';

const { Ledger } = require('../../models');

export const findUserLedgerEntries = (userId: string) =>
  Ledger.find({
    $or: [{ fromUser: userId }, { toUser: userId }],
    amount: { $gt: DUST_THRESHOLD },
  })
    .populate('fromUser', '_id name email avatar')
    .populate('toUser', '_id name email avatar');

export const findGroupLedgerEntries = (groupId: string) =>
  Ledger.find({
    groupId,
    amount: { $gt: DUST_THRESHOLD },
  })
    .populate('fromUser', '_id name email avatar')
    .populate('toUser', '_id name email avatar');
