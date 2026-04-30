import { ChevronLeft, MoreVertical, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell, ConfirmDialog, EmptyState, SkeletonList, UserAvatarGroup } from '../../../components/shared';
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
import {
  useAddGroupMemberMutation,
  useDeleteGroupMutation,
  useGroupBalancesQuery,
  useGroupByIdQuery,
  useGroupExpensesQuery,
  useRemoveGroupMemberMutation,
  unwrapList,
} from '../../../hooks/useGroups';
import { BalanceRow } from '../../balances/components/BalanceRow';
import { ExpenseCard } from '../../expenses/components/ExpenseCard';
import { MemberChip } from '../components/MemberChip';
import { MemberSelector } from '../components/MemberSelector';
import { OptimizedPlanCard } from '../components/OptimizedPlanCard';

const validTabs = ['expenses', 'balances', 'members'];

const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

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

  const groupQuery = useGroupByIdQuery(id);

  const group = groupQuery.data;
  const members = useMemo(() => group?.members || [], [group?.members]);
  const creatorId = group?.createdBy?._id || group?.createdBy;
  const isAdmin = Boolean(user?._id && creatorId && user._id === creatorId);

  const groupExpenseQuery = useGroupExpensesQuery(id, expenseLimit);
  const balancesQuery = useGroupBalancesQuery(id);

  const deleteGroupMutation = useDeleteGroupMutation(id);
  const addMemberMutation = useAddGroupMemberMutation(id);
  const removeMemberMutation = useRemoveGroupMemberMutation(id);

  if (groupQuery.isError) {
    const status = groupQuery.error?.response?.status;
    if (status === 403 || status === 404) navigate('/groups');
  }

  const groupExpenses = unwrapList(groupExpenseQuery.data);
  const normalizedGroupBalances = useMemo(() => {
    const memberMap = new Map(members.map((member) => [member._id, member]));
    return (balancesQuery.data || []).map((entry) => {
      const member = memberMap.get(entry.userId);
      const matchedExpense = groupExpenses.find((expense) =>
        (expense.splitDetails || []).some((detail) => {
          const detailUserId = detail?.userId?._id || detail?.userId || detail?.user?._id;
          return detailUserId === entry.userId;
        })
      );
      return {
        ...entry,
        name: entry.name || member?.name || 'Unknown user',
        avatar: entry.avatar || member?.avatar || null,
        expenseName: matchedExpense?.description || '',
      };
    });
  }, [balancesQuery.data, members, groupExpenses]);
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
              <h1 className="text-xl font-semibold sm:text-2xl">{group.name}</h1>
              <div className="flex items-center gap-3">
                <UserAvatarGroup users={members} max={5} />
                <p className="text-xs text-muted-foreground sm:text-sm">
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
            <TabsList className="h-9 w-full sm:h-10">
              <TabsTrigger value="expenses" className="flex-1 text-xs sm:text-sm">Expenses</TabsTrigger>
              <TabsTrigger value="balances" className="flex-1 text-xs sm:text-sm">Balances</TabsTrigger>
              <TabsTrigger value="members" className="flex-1 text-xs sm:text-sm">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-3">
              <div className="flex justify-end">
                <Button className="w-full sm:w-auto" onClick={() => navigate(`/expenses/new?groupId=${id}`)}>Add Expense</Button>
              </div>
              {groupExpenseQuery.isLoading ? (
                <SkeletonList count={2} className="h-16 w-full" />
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
                <SkeletonList count={2} className="h-10 w-full" />
              ) : !balancesQuery.data?.length ? (
                <EmptyState icon="🎉" title="All settled up" description="No outstanding balances in this group." />
              ) : (
                <Card>
                  <CardContent className="p-3 space-y-1">
                    {normalizedGroupBalances.map((entry) => (
                      <BalanceRow key={`${entry.userId}-${entry.direction}-${entry.groupId || id}`} entry={entry} />
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
              if (!candidate) return;
              addMemberMutation.mutate(candidate, {
                onSuccess: () => {
                  setSelectedMembers([]);
                  setAddMemberOpen(false);
                },
              });
            }}
            loading={addMemberMutation.isPending}
          />
        </div>
      )}
    </AppShell>
  );
};

export default GroupDetailPage;

