import { useQuery } from '@tanstack/react-query';
import { activityAPI, groupsAPI } from '../services/api';

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.activities)) return value.activities;
  return [];
};

const getDataOrFallback = (response: any, fallback: any = null) => response?.data?.data ?? fallback;

export const toListWithCursor = (payload: any) => {
  const items = toArray(payload);
  const nextCursor = payload?.nextCursor ?? null;
  return { items, nextCursor };
};

export const useActivityGroupsQuery = () =>
  useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((response) => toArray(getDataOrFallback(response, []))),
  });

export const useMyActivityQuery = (cursor: string | null) =>
  useQuery({
    queryKey: ['activity', 'mine', cursor],
    queryFn: () =>
      activityAPI
        .getMine({ cursor })
        .then((response) => toListWithCursor(getDataOrFallback(response, { activities: [], nextCursor: null }))),
  });

export const useGroupActivityQuery = (
  groupId: string,
  cursor: string | null,
  enabled = true
) =>
  useQuery({
    queryKey: ['activity', 'group', groupId, cursor],
    enabled: enabled && groupId !== 'all',
    retry: false,
    queryFn: () =>
      activityAPI
        .getByGroup(groupId, { cursor })
        .then((response) => toListWithCursor(getDataOrFallback(response, { activities: [], nextCursor: null }))),
  });
