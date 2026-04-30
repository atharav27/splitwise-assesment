import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../lib/toast';
import { balancesAPI, expensesAPI, groupsAPI } from '../services/api';

const getDataOrFallback = (response, fallback = null) => response?.data?.data ?? fallback;
const getListOrFallback = (response) => {
  const data = getDataOrFallback(response, []);
  return Array.isArray(data) ? data : [];
};
const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.expenses)) return payload.expenses;
  return [];
};

export const useGroupsListQuery = () =>
  useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getAll().then(getListOrFallback),
  });

export const useGroupByIdQuery = (groupId) =>
  useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsAPI.getById(groupId).then((response) => getDataOrFallback(response, null)),
    enabled: Boolean(groupId),
    retry: false,
  });

export const useGroupExpensesQuery = (groupId, expenseLimit = 10) =>
  useQuery({
    queryKey: ['group-expenses', groupId, expenseLimit],
    queryFn: () => expensesAPI.getByGroup(groupId, { limit: expenseLimit }).then((res) => res.data?.data),
    enabled: Boolean(groupId),
  });

export const useGroupBalancesQuery = (groupId) =>
  useQuery({
    queryKey: ['group-balances', groupId],
    queryFn: () => balancesAPI.getByGroup(groupId).then((res) => getDataOrFallback(res, [])),
    enabled: Boolean(groupId),
  });

export { unwrapList };

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload) => groupsAPI.create(payload),
    onSuccess: (response) => {
      const groupId = response?.data?.data?._id;
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccessToast('Group created');
      navigate(groupId ? `/groups/${groupId}` : '/groups');
    },
    onError: (error) => showErrorToast(error),
  });
};

export const useAddGroupMemberMutation = (groupId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => groupsAPI.addMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccessToast('Member added to group');
    },
    onError: (error) => showErrorToast(error),
  });
};

export const useRemoveGroupMemberMutation = (groupId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => groupsAPI.removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccessToast('Member removed');
    },
    onError: (error) => showErrorToast(error),
  });
};

export const useDeleteGroupMutation = (groupId) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => groupsAPI.delete(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.removeQueries({ queryKey: ['group', groupId] });
      showSuccessToast('Group deleted');
      navigate('/groups');
    },
    onError: (error) => showErrorToast(error),
  });
};
