import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MoreVertical, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell, ConfirmDialog, EmptyState, UserAvatarGroup } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Skeleton } from '../../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useAuth } from '../../../context/AuthContext';
import { showErrorToast, showSuccessToast } from '../../../lib/toast';
import { BalanceRow } from '../../balances/components/BalanceRow';
import { ExpenseCard } from '../../expenses/components/ExpenseCard';
import { balancesAPI, expensesAPI, groupsAPI } from '../../../services/api';
import { MemberChip } from '../components/MemberChip';
import { MemberSelector } from '../components/MemberSelector';
import { OptimizedPlanCard } from '../components/OptimizedPlanCard';

const validTabs = ['expenses', 'balances', 'members'];

const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.expenses)) return payload.expenses;
  return [];
};

const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = validTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'expenses';
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [expenseLimit, setExpenseLimit] = useState(10);

  const onTabChange = (tab) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.set('tab', tab);
    return next;
  });

  const groupQuery = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.getById(id).then((res) => res.data?.data),
    enabled: Boolean(id),
    retry: false,
  });

  const group = groupQuery.data;
  const members = group?.members || [];
  const creatorId = group?.createdBy?._id || group?.createdBy;
  const isAdmin = Boolean(user?._id && creatorId && user._id === creatorId);

  const groupExpenseQuery = useQuery({
    queryKey: ['group-expenses', id, expenseLimit],
    queryFn: () => expensesAPI.getByGroup(id, { limit: expenseLimit }).then((res) => res.data?.data),
    enabled: Boolean(id),
  });

  const balancesQuery = useQuery({
    queryKey: ['group-balances', id],
    queryFn: () => balancesAPI.getByGroup(id).then((res) => res.data?.data || []),
    enabled: Boolean(id),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => groupsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccessToast('Group deleted');
      navigate('/groups');
    },
    onError: (error) => showErrorToast(error),
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId) => groupsAPI.addMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setSelectedMembers([]);
      setAddMemberOpen(false);
      showSuccessToast('Member added to group');
    },
    onError: (error) => showErrorToast(error),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => groupsAPI.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      showSuccessToast('Member removed');
    },
    onError: (error) => showErrorToast(error),
  });

  if (groupQuery.isError) {
    const status = groupQuery.error?.response?.status;
    if (status === 403 || status === 404) navigate('/groups');
  }

  const groupExpenses = unwrapList(groupExpenseQuery.data);
  const hasMoreExpenses = useMemo(() => {
    const total = groupExpenseQuery.data?.total || groupExpenseQuery.data?.count || groupExpenseQuery.data?.totalDocs;
    return typeof total === 'number' ? groupExpenses.length < total : groupExpenses.length >= expenseLimit;
  }, [groupExpenseQuery.data, groupExpenses.length, expenseLimit]);

  return (
    <AppShell>
      {groupQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !group ? (
        <EmptyState icon="👥" title="Group not found" description="This group does not exist or is not accessible." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Button variant="ghost" className="px-0" onClick={() => navigate('/groups')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold">{group.name}</h1>
              <div className="flex items-center gap-3">
                <UserAvatarGroup users={members} max={5} />
                <p className="text-sm text-muted-foreground">
                  {members.length} members · {group.currency || 'INR'}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAddMemberOpen(true)}>Add Member</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
                    Delete Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <Tabs value={currentTab} onValueChange={onTabChange}>
            <TabsList>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-3">
              <div className="flex justify-end">
                <Button onClick={() => navigate(`/expenses/new?groupId=${id}`)}>Add Expense</Button>
              </div>
              {groupExpenseQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : groupExpenses.length === 0 ? (
                <EmptyState icon="🧾" title="No expenses yet" description="Add your first expense for this group." />
              ) : (
                <>
                  <div className="space-y-1">
                    {groupExpenses.map((expense) => (
                      <ExpenseCard key={expense._id} expense={expense} variant="compact" />
                    ))}
                  </div>
                  {hasMoreExpenses ? (
                    <Button variant="outline" className="w-full" onClick={() => setExpenseLimit((prev) => prev + 10)}>
                      Load more
                    </Button>
                  ) : null}
                </>
              )}
            </TabsContent>

            <TabsContent value="balances" className="space-y-3">
              {balancesQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !balancesQuery.data?.length ? (
                <EmptyState icon="🎉" title="All settled up" description="No outstanding balances in this group." />
              ) : (
                <Card>
                  <CardContent className="p-3 space-y-1">
                    {balancesQuery.data.map((entry) => (
                      <BalanceRow key={`${entry.userId}-${entry.direction}`} entry={entry} />
                    ))}
                  </CardContent>
                </Card>
              )}

              <OptimizedPlanCard groupId={id} />
            </TabsContent>

            <TabsContent value="members" className="space-y-3">
              <div className="space-y-2">
                {members.map((member) => (
                  <MemberChip
                    key={member._id}
                    member={member}
                    isAdmin={member._id === creatorId}
                    canRemove={isAdmin && member._id !== creatorId && member._id !== user?._id}
                    onRemove={() => removeMemberMutation.mutate(member._id)}
                    loading={removeMemberMutation.isPending}
                  />
                ))}
              </div>
              {isAdmin ? (
                <Button variant="outline" className="w-full" onClick={() => setAddMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              ) : null}
            </TabsContent>
          </Tabs>

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete group"
            description="This action cannot be undone."
            onConfirm={() => deleteGroupMutation.mutate()}
            loading={deleteGroupMutation.isPending}
          />

          <ConfirmDialog
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
            title="Add member"
            description={(
              <div className="mt-2">
                <MemberSelector
                  selectedIds={selectedMembers}
                  onChange={setSelectedMembers}
                  creatorId={creatorId}
                  creatorLabel={group.createdBy?.name || 'You'}
                />
              </div>
            )}
            onConfirm={() => {
              if (!selectedMembers.length) return;
              const candidate = selectedMembers.find((memberId) => !members.some((m) => m._id === memberId));
              if (candidate) addMemberMutation.mutate(candidate);
            }}
            loading={addMemberMutation.isPending}
          />
        </div>
      )}
    </AppShell>
  );
};

export default GroupDetailPage;

