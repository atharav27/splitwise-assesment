import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppShell, AmountDisplay, EmptyState } from '../components/shared';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../context/AuthContext';
import { BalanceRow } from '../features/balances/components/BalanceRow';
import { ExpenseCard } from '../features/expenses/components/ExpenseCard';
import { GroupCard } from '../features/groups/components/GroupCard';
import { balancesAPI, expensesAPI, groupsAPI, settlementsAPI } from '../services/api';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const SectionHeader = ({ title, actionLabel, onAction }) => (
  <div className="flex items-center justify-between">
    <h2 className="font-semibold">{title}</h2>
    <button type="button" className="text-sm text-primary" onClick={onAction}>
      {actionLabel} →
    </button>
  </div>
);

const SkeletonList = ({ count, className, containerClassName = 'space-y-2' }) => (
  <div className={containerClassName}>
    {Array.from({ length: count }).map((_, idx) => (
      <Skeleton key={idx} className={className} />
    ))}
  </div>
);

const QuickStatCard = ({ value, label, onClick }) => (
  <Card className="cursor-pointer" onClick={onClick}>
    <CardContent className="p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['balances', 'global'],
    queryFn: () => balancesAPI.getGlobal().then((res) => res.data?.data || []),
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((res) => res.data?.data || []),
  });

  const { data: recentExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: () => expensesAPI.getAll({ limit: 5 }).then((res) => res.data?.data || []),
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses', 'month-count'],
    queryFn: () => expensesAPI.getAll({ limit: 100 }).then((res) => res.data?.data || []),
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements', 'all'],
    queryFn: () => settlementsAPI.getAll().then((res) => res.data?.data || []),
  });

  const netOwed = balances
    .filter((item) => item.direction === 'owed')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netOwe = balances
    .filter((item) => item.direction === 'owe')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const net = netOwed - netOwe;
  const owedCount = balances.filter((item) => item.direction === 'owed' && Number(item.amount) > 0).length;
  const oweCount = balances.filter((item) => item.direction === 'owe' && Number(item.amount) > 0).length;

  const now = new Date();
  const monthlyCount = allExpenses.filter((expense) => {
    const date = new Date(expense.date || expense.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const pendingSettlements = settlements.length || balances.filter((item) => Number(item.amount) > 0).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {balancesLoading ? (
          <Skeleton className="h-36 w-full rounded-xl" />
        ) : (
          <Card>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
              </p>
              {net > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">Overall you are owed</p>
                  <AmountDisplay amount={net} direction="owed" size="xl" />
                </>
              ) : null}
              {net < 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">Overall you owe</p>
                  <AmountDisplay amount={Math.abs(net)} direction="owe" size="xl" />
                </>
              ) : null}
              {net === 0 ? (
                <p className="text-lg font-semibold bg-linear-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  You&apos;re all settled up 🎉
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700">
                  {owedCount} people owe you
                </span>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs text-rose-700">
                  You owe {oweCount} people
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-3">
          {groupsLoading || expensesLoading ? (
            <SkeletonList count={3} className="h-20 w-full" containerClassName="contents" />
          ) : (
            <>
              <QuickStatCard value={groups.length} label="Active Groups" onClick={() => navigate('/groups')} />
              <QuickStatCard value={monthlyCount} label="Expenses this month" onClick={() => navigate('/expenses')} />
              <QuickStatCard value={pendingSettlements} label="Pending settlements" onClick={() => navigate('/settlements')} />
            </>
          )}
        </div>

        <section className="space-y-3">
          <SectionHeader title="Your Groups" actionLabel="View all" onAction={() => navigate('/groups')} />
          {groupsLoading ? (
            <SkeletonList count={2} className="h-24 w-full" containerClassName="grid grid-cols-1 gap-3 md:grid-cols-2" />
          ) : groups.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No groups yet"
              description="Create your first group to start splitting expenses."
              action={null}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {groups.slice(0, 4).map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader title="Recent Expenses" actionLabel="View all" onAction={() => navigate('/expenses')} />
          {expensesLoading ? (
            <SkeletonList count={3} className="h-16 w-full" />
          ) : recentExpenses.length === 0 ? (
            <EmptyState
              icon="🧾"
              title="No expenses yet"
              description="Expenses you add will appear here."
              action={null}
            />
          ) : (
            <div className="divide-y rounded-lg border px-3">
              {recentExpenses.slice(0, 5).map((expense) => (
                <ExpenseCard key={expense._id} expense={expense} variant="compact" />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader title="Who owes you / You owe" actionLabel="See all" onAction={() => navigate('/balances')} />
          {balancesLoading ? (
            <SkeletonList count={3} className="h-10 w-full" />
          ) : balances.length === 0 || balances.every((item) => Number(item.amount || 0) === 0) ? (
            <EmptyState
              icon="🎉"
              title="All settled up"
              description="You have no outstanding balances right now."
              action={null}
            />
          ) : (
            <Card>
              <CardContent className="p-3">
                {balances.slice(0, 3).map((entry) => (
                  <BalanceRow
                    key={entry.userId || entry._id || `${entry.name}-${entry.direction}`}
                    entry={entry}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Dashboard;
