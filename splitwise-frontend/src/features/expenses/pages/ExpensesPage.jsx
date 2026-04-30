import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell, EmptyState, PageHeader, SkeletonList } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useExpensesListQuery, useGroupsForExpenseQuery, unwrapExpenseList } from '../../../hooks/useExpense';
import { ExpenseCard } from '../components/ExpenseCard';

const categories = ['all', 'food', 'travel', 'utilities', 'entertainment', 'other'];

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: groups = [] } = useGroupsForExpenseQuery();

  const params = {};
  if (selectedCategory !== 'all') params.category = selectedCategory;
  if (selectedGroup !== 'all') params.groupId = selectedGroup;
  const { data: expensesData, isLoading, isError, refetch } = useExpensesListQuery(params);

  const expenses = useMemo(() => unwrapExpenseList(expensesData), [expensesData]);

  return (
    <AppShell>
      <PageHeader
        title="Expenses"
        action={<Button onClick={() => navigate('/expenses/new')}>Add Expense</Button>}
      />

      <div className="mb-4 space-y-3">
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group._id} value={group._id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="h-9 capitalize px-3"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="text-sm text-muted-foreground">
          Something went wrong.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <SkeletonList count={3} className="h-28 w-full" containerClassName="space-y-3" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No expenses found"
          description="Add an expense to start tracking splits."
          action={<Button onClick={() => navigate('/expenses/new')}>Add Expense</Button>}
        />
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard key={expense._id} expense={expense} variant="full" />
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default ExpensesPage;
