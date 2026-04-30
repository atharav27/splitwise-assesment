import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell, EmptyState, PageHeader } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { expensesAPI, groupsAPI } from '../../../services/api';
import { ExpenseCard } from '../components/ExpenseCard';

const categories = ['all', 'food', 'travel', 'utilities', 'entertainment', 'other'];

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.expenses)) return value.expenses;
  return [];
};

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: groups = [] } = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((res) => toArray(res.data?.data)),
  });

  const { data: expensesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['expenses', selectedGroup, selectedCategory],
    queryFn: () => {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedGroup !== 'all') params.groupId = selectedGroup;
      return expensesAPI.getAll(params).then((res) => res.data?.data);
    },
  });

  const expenses = useMemo(() => toArray(expensesData), [expensesData]);

  return (
    <AppShell>
      <PageHeader
        title="Expenses"
        action={<Button onClick={() => navigate('/expenses/new')}>Add Expense</Button>}
      />

      <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-48 shrink-0">
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

        {categories.map((category) => (
          <Button
            key={category}
            type="button"
            variant={selectedCategory === category ? 'default' : 'outline'}
            className="capitalize shrink-0"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {isError ? (
        <div className="text-sm text-muted-foreground">
          Something went wrong.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
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
