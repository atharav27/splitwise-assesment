import { useQuery } from '@tanstack/react-query';
import { balancesAPI, groupsAPI } from '../services/api';

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.balances)) return value.balances;
  return [];
};

const getDataOrFallback = (response: any) => response?.data?.data;
const normalizeBalanceEntry = (entry: any, fallbackUser: any = null) => {
  const user = entry?.user || fallbackUser || null;
  return {
    ...entry,
    userId: entry?.userId || user?._id || null,
    name: entry?.name || user?.name || 'Unknown user',
    email: entry?.email || user?.email || '',
    avatar: entry?.avatar || user?.avatar || null,
    groupId: entry?.groupId ?? null,
    amount: entry?.netAmount ?? entry?.amount ?? 0,
    breakdown: Array.isArray(entry?.breakdown) ? entry.breakdown : [],
  };
};

export const useGlobalBalancesQuery = () =>
  useQuery({
    queryKey: ['balances', 'global'],
    queryFn: () =>
      balancesAPI
        .getGlobal()
        .then((response) => toArray(getDataOrFallback(response)).map((entry) => normalizeBalanceEntry(entry))),
  });

export const useBalanceGroupsQuery = () =>
  useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((response) => toArray(getDataOrFallback(response))),
  });

export const useGroupedBalancesQuery = (
  groups: Array<{ _id: string; members?: Array<{ _id: string; name?: string; email?: string; avatar?: string }> }> = []
) =>
  useQuery({
    queryKey: ['balances', 'grouped', groups.map((group) => group._id).join(',')],
    enabled: Boolean(groups.length),
    queryFn: async () => {
      const pairs = await Promise.all(
        groups.map(async (group) => {
          const memberMap = new Map((group?.members || []).map((member: any) => [member?._id, member]));
          const balances = await balancesAPI
            .getByGroup(group._id)
            .then((response) =>
              toArray(getDataOrFallback(response)).map((entry) =>
                normalizeBalanceEntry(entry, memberMap.get(entry?.userId))
              )
            );
          return { group, balances };
        })
      );
      return pairs;
    },
  });
