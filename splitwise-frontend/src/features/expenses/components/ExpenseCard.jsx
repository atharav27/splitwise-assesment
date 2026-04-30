import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AmountDisplay, ConfirmDialog } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency, formatRelative } from '../../../lib/utils';
import { showErrorToast, showSuccessToast } from '../../../lib/toast';
import { expensesAPI } from '../../../services/api';

const categoryIcon = {
  food: '🍕',
  travel: '✈️',
  entertainment: '🎬',
  utilities: '💡',
  other: '📌',
};

export const ExpenseCard = ({ expense, variant = 'compact' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const yourShare = (expense.splitDetails || []).find(
    (item) => item.userId === user?._id || item.user?._id === user?._id || item.userId?._id === user?._id
  )?.amount || 0;
  const paidById = expense.paidBy?._id || expense.paidBy;
  const canManage = Boolean(user?._id && paidById && user._id === paidById);

  const deleteMutation = useMutation({
    mutationFn: () => expensesAPI.delete(expense._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'recent'] });
      showSuccessToast('Expense deleted');
      if (window.location.pathname.includes(`/expenses/${expense._id}`)) {
        navigate('/expenses');
      }
    },
    onError: (error) => showErrorToast(error),
  });

  if (variant === 'full') {
    return (
      <>
        <Card className="transition-colors hover:bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                onClick={() => navigate(`/expenses/${expense._id}`)}
              >
                <div className="text-xl leading-none">{categoryIcon[expense.category] || '📌'}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{expense.description || 'Expense'}</p>
                    <AmountDisplay amount={expense.amount || 0} size="lg" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {expense.groupId?.name ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {expense.groupId.name}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground capitalize">
                      {expense.splitType || 'equal'} split
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Paid by {expense.paidBy?.name || 'Unknown'} · {formatRelative(expense.date || expense.createdAt)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your share: {formatCurrency(yourShare, expense.currency || 'INR')}
                  </p>
                </div>
              </button>

              {canManage ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/expenses/${expense._id}/edit`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete expense"
          description="Are you sure you want to delete this expense?"
          onConfirm={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
        />
      </>
    );
  }

  return (
    <Card
      className="cursor-pointer border-0 shadow-none"
      onClick={() => navigate(`/expenses/${expense._id}`)}
    >
      <CardContent className="p-0 py-3">
        <div className="flex items-start gap-3">
          <div className="text-xl leading-none">{categoryIcon[expense.category] || '💰'}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{expense.description || 'Expense'}</p>
                <p className="text-xs text-muted-foreground">
                  Paid by {expense.paidBy?.name || 'Unknown'} · {(expense.participants || []).length} participants
                </p>
              </div>
              <div className="text-right">
                <AmountDisplay amount={expense.amount || 0} size="md" />
                <p className="text-xs text-muted-foreground">{formatRelative(expense.date || expense.createdAt)}</p>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your share: {formatCurrency(yourShare, expense.currency || 'INR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
