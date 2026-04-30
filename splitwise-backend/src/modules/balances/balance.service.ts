import AppError from '../../utils/AppError';
import { DUST_THRESHOLD } from '../../utils/constants';
import { round2 } from '../../utils/splitCalculator';
import * as groupRepo from '../groups/group.repository';
import * as balanceRepo from './balance.repository';

type PopulatedUser = {
  _id: { toString: () => string };
  name?: string;
  email?: string;
  avatar?: string | null;
};

type LedgerEntry = {
  fromUser: PopulatedUser;
  toUser: PopulatedUser;
  amount: number;
};

export const getGlobalBalances = async (userId: string) => {
  const entries = (await balanceRepo.findUserLedgerEntries(userId)) as LedgerEntry[];
  return buildBalanceList(entries, userId);
};

export const getGroupBalances = async (groupId: string, userId: string) => {
  const memberIds = await groupRepo.findActiveGroupMemberIds(groupId);
  if (!memberIds) throw new AppError('Group not found', 404);

  const isMember = memberIds.some((m) => m.toString() === userId.toString());
  if (!isMember) throw new AppError('Access denied — not a group member', 403);

  const entries = (await balanceRepo.findGroupLedgerEntries(groupId)) as LedgerEntry[];
  return buildGroupBalanceList(entries, memberIds, userId);
};

const buildBalanceList = (entries: LedgerEntry[], userId: string) => {
  const uid = userId.toString();

  return entries
    .map((entry) => {
      const fromId = entry.fromUser._id.toString();
      const amount = round2(entry.amount);

      if (fromId === uid) {
        return { user: entry.toUser, amount, direction: 'owe' as const };
      }
      return { user: entry.fromUser, amount, direction: 'owed' as const };
    })
    .filter((b) => b.amount > DUST_THRESHOLD);
};

const buildGroupBalanceList = (entries: LedgerEntry[], memberIds: string[], requesterId: string) => {
  const netMap: Record<string, number> = {};
  memberIds.forEach((id) => {
    netMap[id] = 0;
  });

  entries.forEach((entry) => {
    const from = entry.fromUser._id.toString();
    const to = entry.toUser._id.toString();
    const amount = round2(entry.amount);

    if (netMap[from] !== undefined) netMap[from] = round2(netMap[from] - amount);
    if (netMap[to] !== undefined) netMap[to] = round2(netMap[to] + amount);
  });

  const uid = requesterId.toString();
  return Object.entries(netMap)
    .filter(([id]) => id !== uid)
    .map(([id, net]) => {
      const absNet = round2(Math.abs(net));
      if (absNet <= DUST_THRESHOLD) return null;
      return {
        userId: id,
        amount: absNet,
        direction: net > 0 ? ('owed' as const) : ('owe' as const),
      };
    })
    .filter(Boolean);
};
