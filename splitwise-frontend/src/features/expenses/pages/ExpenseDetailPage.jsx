import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AmountDisplay, AppShell, ConfirmDialog, UserAvatar } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { showErrorToast, showSuccessToast } from '../../../lib/toast';
import { expensesAPI } from '../../../services/api';

const categoryIcon = {
  food: '🍕',
  travel: '✈️',
  utilities: '💡',
  entertainment: '🎬',
  other: '📌',
};

const snapshotSummary = (snapshot = {}) => [
  ['Description', snapshot.description],
  ['Amount', snapshot.amount ? formatCurrency(snapshot.amount, snapshot.currency || 'INR') : '-'],
  ['Category', snapshot.category || '-'],
  ['Split Type', snapshot.splitType || '-'],
  ['Paid By', snapshot.paidBy?.name || snapshot.paidBy || '-'],
  ['Participants', Array.isArray(snapshot.splitDetails) ? snapshot.splitDetails.length : 0],
];

const ExpenseDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({});

  const expenseQuery = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesAPI.getById(id).then((res) => res.data?.data),
    enabled: Boolean(id),
  });

  const historyQuery = useQuery({
    queryKey: ['expense', id, 'history'],
    queryFn: () => expensesAPI.getHistory(id).then((res) => res.data?.data || []),
    enabled: Boolean(id) && openHistory,
  });

  const deleteMutation = useMutation({
    mutationFn: () => expensesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showSuccessToast('Expense deleted');
      navigate('/expenses');
    },
    onError: (error) => showErrorToast(error),
  });

  const expense = expenseQuery.data;
  const canManage = useMemo(() => {
    const paidById = expense?.paidBy?._id || expense?.paidBy;
    return Boolean(user?._id && paidById && user._id === paidById);
  }, [expense, user]);

  if (expenseQuery.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-56 w-full" />
      </AppShell>
    );
  }

  if (!expense) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Expense not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/expenses')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {canManage ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/expenses/${id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          ) : null}
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl">{categoryIcon[expense.category] || '📌'}</p>
                <h1 className="text-xl font-semibold">{expense.description}</h1>
              </div>
              <AmountDisplay amount={expense.amount || 0} size="xl" direction="neutral" />
            </div>

            <p className="text-sm text-muted-foreground capitalize">
              Category: {expense.category} · {expense.groupId?.name || 'No group'} · {formatDate(expense.date || expense.createdAt)}
            </p>

            <div>
              <p className="text-sm font-medium mb-2">Paid by</p>
              <div className="flex items-center gap-2">
                <UserAvatar user={expense.paidBy || { name: 'Unknown' }} size="sm" />
                <p className="text-sm">{expense.paidBy?.name || 'Unknown'} {canManage ? '(you)' : ''}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                Split {expense.splitType || 'equally'} among {(expense.splitDetails || []).length} people
              </p>
              <div className="space-y-2 rounded-md border p-3">
                {(expense.splitDetails || []).map((item, idx) => (
                  <div key={item.userId?._id || item.userId || idx} className="flex items-center justify-between text-sm">
                    <span>{item.userId?.name || item.user?.name || item.userId || `Participant ${idx + 1}`}</span>
                    <span>{formatCurrency(item.amount || 0, expense.currency || 'INR')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium"
                onClick={() => setOpenHistory((prev) => !prev)}
              >
                {openHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Edit History ({historyQuery.data?.length || 0} versions)
              </button>

              {openHistory ? (
                <div className="mt-3 space-y-2">
                  {historyQuery.isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : !historyQuery.data?.length ? (
                    <p className="text-xs text-muted-foreground">No history available.</p>
                  ) : (
                    historyQuery.data.map((entry, idx) => (
                      <div key={`${entry.updatedAt}-${idx}`} className="rounded-md border p-3">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between text-left"
                          onClick={() => setExpandedHistory((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                        >
                          <span className="text-sm">
                            {formatDate(entry.updatedAt)} · Updated by {entry.updatedBy || 'Unknown'}
                          </span>
                          {expandedHistory[idx] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>

                        {expandedHistory[idx] ? (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {snapshotSummary(entry.snapshot).map(([label, value]) => (
                              <p key={label}>
                                <span className="font-medium text-foreground">{label}:</span> {String(value)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete expense"
          description="This will permanently remove the expense."
          onConfirm={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
        />
      </div>
    </AppShell>
  );
};

export default ExpenseDetailPage;

