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
  groupId?: { toString: () => string } | string | null;
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
  return buildGroupBalanceList(entries, memberIds, userId, groupId);
};

type BreakdownLine = {
  groupId: string | null;
  amount: number;
  direction: 'owe' | 'owed';
};

const buildBalanceList = (entries: LedgerEntry[], userId: string) => {
  const uid = userId.toString();

  type Agg = {
    net: number;
    user: PopulatedUser;
    breakdown: BreakdownLine[];
  };

  const byOther = new Map<string, Agg>();

  for (const entry of entries) {
    const fromId = entry.fromUser._id.toString();
    const amount = round2(entry.amount);
    const isFromMe = fromId === uid;
    const mySignedAmount = isFromMe ? amount : -amount;
    const other = isFromMe ? entry.toUser : entry.fromUser;
    const otherId = other._id.toString();

    const groupIdVal = entry.groupId
      ? typeof entry.groupId === 'string'
        ? entry.groupId
        : entry.groupId.toString()
      : null;

    const direction: 'owe' | 'owed' = mySignedAmount > 0 ? 'owe' : 'owed';
    const lineAmount = round2(Math.abs(mySignedAmount));

    let agg = byOther.get(otherId);
    if (!agg) {
      agg = { net: 0, user: other, breakdown: [] };
      byOther.set(otherId, agg);
    }
    agg.net = round2(agg.net + mySignedAmount);
    agg.breakdown.push({
      groupId: groupIdVal,
      amount: lineAmount,
      direction,
    });
  }

  return [...byOther.values()]
    .map((agg) => {
      const netAmount = round2(Math.abs(agg.net));
      return {
        user: agg.user,
        netAmount,
        amount: netAmount,
        direction: agg.net > 0 ? ('owe' as const) : ('owed' as const),
        breakdown: agg.breakdown,
      };
    })
    .filter((b) => b.netAmount > DUST_THRESHOLD);
};

const buildGroupBalanceList = (entries: LedgerEntry[], memberIds: string[], requesterId: string, groupId: string) => {
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
        groupId,
      };
    })
    .filter(Boolean);
};
