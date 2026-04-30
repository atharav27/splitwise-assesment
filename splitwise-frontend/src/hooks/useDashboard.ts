import { useQuery } from '@tanstack/react-query';
import { balancesAPI, expensesAPI, groupsAPI, settlementsAPI } from '../services/api';

const getDataOrFallback = (response) => response?.data?.data || [];
const getListFromData = (response, key) => {
  const data = getDataOrFallback(response);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  return [];
};
const normalizeBalanceEntry = (entry) => {
  const user = entry?.user || null;
  return {
    ...entry,
    userId: entry?.userId || user?._id || null,
    name: entry?.name || user?.name || 'Unknown user',
    email: entry?.email || user?.email || '',
    avatar: entry?.avatar || user?.avatar || null,
  };
};

export const useGlobalBalances = () =>
  useQuery({
    queryKey: ['balances', 'global'],
    queryFn: () =>
      balancesAPI
        .getGlobal()
        .then((response) => getDataOrFallback(response))
        .then((list) => (Array.isArray(list) ? list.map(normalizeBalanceEntry) : [])),
  });

export const useDashboardGroups = () =>
  useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then(getDataOrFallback),
  });

export const useRecentExpenses = () =>
  useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: () => expensesAPI.getAll({ limit: 5 }).then((response) => getListFromData(response, 'expenses')),
  });

export const useDashboardMonthlyExpenses = () =>
  useQuery({
    queryKey: ['expenses', 'month-count'],
    queryFn: () => expensesAPI.getAll({ limit: 100 }).then((response) => getListFromData(response, 'expenses')),
  });

export const useDashboardSettlements = () =>
  useQuery({
    queryKey: ['settlements', 'all'],
    queryFn: () => settlementsAPI.getAll().then((response) => getListFromData(response, 'settlements')),
  });
