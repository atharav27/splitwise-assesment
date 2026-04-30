import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../lib/toast';
import { expensesAPI, groupsAPI, usersAPI } from '../services/api';

type ExpenseFilters = {
  groupId?: string;
  category?: string;
};

type HookOptions = {
  enabled?: boolean;
  onSuccessNavigate?: (response: any) => void;
};

const getDataOrFallback = (response, fallback = null) => response?.data?.data ?? fallback;

const getListFromData = (response, preferredKey?: string) => {
  const data = getDataOrFallback(response, []);
  if (Array.isArray(data)) return data;
  if (preferredKey && Array.isArray(data?.[preferredKey])) return data[preferredKey];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.docs)) return data.docs;
  return [];
};

export const useExpensesListQuery = (filters: ExpenseFilters = {}) =>
  useQuery({
    queryKey: ['expenses', filters.groupId || 'all', filters.category || 'all'],
    queryFn: () => expensesAPI.getAll(filters).then((response) => getDataOrFallback(response, { expenses: [] })),
  });

export const useExpenseByIdQuery = (id: string | undefined, options: HookOptions = {}) =>
  useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesAPI.getById(id).then((response) => getDataOrFallback(response, null)),
    enabled: Boolean(id) && (options.enabled ?? true),
  });

export const useExpenseHistoryQuery = (id: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['expense', id, 'history'],
    queryFn: () => expensesAPI.getHistory(id).then((response) => getListFromData(response)),
    enabled: Boolean(id) && enabled,
  });

export const useGroupsForExpenseQuery = () =>
  useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((response) => getListFromData(response)),
  });

export const useUsersForExpenseQuery = () =>
  useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => usersAPI.getAll().then((response) => getListFromData(response, 'users')),
  });

export const useCreateExpenseMutation = (options: HookOptions = {}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload) => expensesAPI.create(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['group-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      showSuccessToast('Expense added successfully');

      const expenseId = response?.data?.data?._id;
      if (options.onSuccessNavigate) {
        options.onSuccessNavigate(response);
      } else if (expenseId) {
        navigate(`/expenses/${expenseId}`);
      }
    },
    onError: (error) => showErrorToast(error),
  });
};

export const useUpdateExpenseMutation = (id: string | undefined, options: HookOptions = {}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload) => expensesAPI.update(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      queryClient.invalidateQueries({ queryKey: ['expense', id, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['group-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      showSuccessToast('Expense updated successfully');

      if (options.onSuccessNavigate) {
        options.onSuccessNavigate(response);
      } else {
        navigate(`/expenses/${id}`);
      }
    },
    onError: (error) => showErrorToast(error),
  });
};

export const useDeleteExpenseMutation = (id: string | undefined, options: HookOptions = {}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => expensesAPI.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['group-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.removeQueries({ queryKey: ['expense', id] });
      queryClient.removeQueries({ queryKey: ['expense', id, 'history'] });
      showSuccessToast('Expense deleted');

      if (options.onSuccessNavigate) {
        options.onSuccessNavigate(response);
      } else {
        navigate('/expenses');
      }
    },
    onError: (error) => showErrorToast(error),
  });
};

export const unwrapExpenseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.expenses)) return payload.expenses;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.docs)) return payload.docs;
  return [];
};
