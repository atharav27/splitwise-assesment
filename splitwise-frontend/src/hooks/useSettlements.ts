import { useQuery } from '@tanstack/react-query';
import { groupsAPI, settlementsAPI } from '../services/api';

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.settlements)) return value.settlements;
  if (Array.isArray(value?.transactions)) return value.transactions;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const getDataOrFallback = (response: any, fallback: any = null) => response?.data?.data ?? fallback;
const toObject = (value: any) => (value && typeof value === 'object' ? value : null);

export const toListWithCursor = (payload: any) => {
  const items = toArray(payload);
  const nextCursor = payload?.nextCursor ?? null;
  return { items, nextCursor };
};

export const getOptimizedTransactions = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getTxParty = (tx: any, side: 'from' | 'to') => {
  const preferred = toObject(tx?.[`${side}User`]);
  const fallback = toObject(tx?.[side]);
  const obj = preferred || fallback;
  const raw = tx?.[`${side}User`] ?? tx?.[side];
  const id = obj?._id || obj?.id || (typeof raw === 'string' ? raw : null);
  const name = obj?.name || (typeof raw === 'string' ? raw : 'user');
  return { id, name };
};

export const useSettlementGroupsQuery = () =>
  useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((response) => toArray(getDataOrFallback(response, []))),
  });

export const useMySettlementsQuery = (cursor: string | null) =>
  useQuery({
    queryKey: ['settlements', 'all', cursor],
    queryFn: () =>
      settlementsAPI
        .getAll({ cursor })
        .then((response) => toListWithCursor(getDataOrFallback(response, { settlements: [], nextCursor: null }))),
  });

export const useGroupSettlementsQuery = (
  groupId: string,
  cursor: string | null,
  enabled = true
) =>
  useQuery({
    queryKey: ['settlements', 'group', groupId, cursor],
    enabled: enabled && groupId !== 'all',
    retry: false,
    queryFn: () =>
      settlementsAPI
        .getByGroup(groupId, { cursor })
        .then((response) => toListWithCursor(getDataOrFallback(response, { settlements: [], nextCursor: null }))),
  });

export const useOptimizedSettlementsQuery = (groupId: string, enabled = true) =>
  useQuery({
    queryKey: ['settlements', 'optimized', groupId],
    enabled: enabled && groupId !== 'all',
    retry: false,
    queryFn: () => settlementsAPI.getOptimized(groupId).then((response) => getDataOrFallback(response, [])),
  });
