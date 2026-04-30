import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FormInputField, FormSelectField } from '../../../components/form-fields';
import { AppShell, PageHeader } from '../../../components/shared';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Form } from '../../../components/ui/form';
import { useAuth } from '../../../context/AuthContext';
import { expenseFormSchema } from '../../../schemas';
import {
  useCreateExpenseMutation,
  useExpenseByIdQuery,
  useGroupsForExpenseQuery,
  useUpdateExpenseMutation,
  useUsersForExpenseQuery,
} from '../../../hooks/useExpense';
import { ParticipantSelector } from '../components/ParticipantSelector';
import { ParticipantSplitRow } from '../components/ParticipantSplitRow';
import { SplitTotalsFooter } from '../components/SplitTotalsFooter';
import { SplitTypeSelector } from '../components/SplitTypeSelector';

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const recalcEqual = (participantIds, amount) => {
  const total = Number(amount || 0);
  const count = participantIds.length || 1;
  const share = round2(total / count);
  return participantIds.map((userId, idx) => {
    if (idx === participantIds.length - 1) {
      const assigned = round2(share * (count - 1));
      return { userId, amount: round2(total - assigned), percentage: round2(((total - assigned) / total) * 100) || 0 };
    }
    return { userId, amount: share, percentage: round2((share / total) * 100) || 0 };
  });
};

const categoryOptions = ['food', 'travel', 'utilities', 'entertainment', 'other'];
const currencyOptions = ['INR', 'USD', 'EUR', 'GBP'];
const toGroupIdValue = (group) => {
  if (!group) return 'none';
  if (typeof group === 'string') return group;
  if (group?._id) return group._id;
  return 'none';
};

const CreateEditExpensePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [apiError, setApiError] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [participantIds, setParticipantIds] = useState([]);
  const [splitDetails, setSplitDetails] = useState([]);

  const form = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      currency: 'INR',
      category: 'food',
      groupId: searchParams.get('groupId') || 'none',
      paidBy: user?._id || '',
    },
  });

  const groupsQuery = useGroupsForExpenseQuery();
  const usersQuery = useUsersForExpenseQuery();
  const expenseQuery = useExpenseByIdQuery(id, { enabled: isEdit });
  const createExpenseMutation = useCreateExpenseMutation({
    onSuccessNavigate: (response) => {
      const expenseId = response?.data?.data?._id;
      if (expenseId) navigate(`/expenses/${expenseId}`);
    },
  });
  const updateExpenseMutation = useUpdateExpenseMutation(id, {
    onSuccessNavigate: () => navigate(`/expenses/${id}`),
  });

  const watchedAmount = useWatch({ control: form.control, name: 'amount' });
  const watchedCurrency = useWatch({ control: form.control, name: 'currency' });
  const selectedGroupId = useWatch({ control: form.control, name: 'groupId' });
  const amount = Number(watchedAmount || 0);
  const hasValidExpenseAmount = amount > 0;
  const isCustomSplitType = splitType === 'unequal' || splitType === 'percentage';
  const customSplitLocked = isCustomSplitType && !hasValidExpenseAmount;
  const groups = useMemo(() => groupsQuery.data || [], [groupsQuery.data]);
  const users = useMemo(() => usersQuery.data || [], [usersQuery.data]);
  const selectedGroup = groups.find((group) => group._id === selectedGroupId);
  const initialExpenseGroupId = useMemo(() => toGroupIdValue(expenseQuery.data?.groupId), [expenseQuery.data?.groupId]);
  const groupMembers = useMemo(() => selectedGroup?.members || [], [selectedGroup]);

  const participantPool = useMemo(() => {
    if (selectedGroupId && selectedGroupId !== 'none') return groupMembers;
    return users;
  }, [selectedGroupId, groupMembers, users]);

  const paidByOptions = useMemo(() => {
    if (selectedGroupId && selectedGroupId !== 'none') {
      return groupMembers.map((member) => ({ value: member._id, label: member.name }));
    }
    const selected = users.filter((member) => participantIds.includes(member._id));
    const combined = [user, ...selected].filter(Boolean);
    const uniq = Array.from(new Map(combined.map((item) => [item._id, item])).values());
    return uniq.map((member) => ({ value: member._id, label: member.name || member.email }));
  }, [selectedGroupId, groupMembers, users, participantIds, user]);

  useEffect(() => {
    if (!paidByOptions.find((option) => option.value === form.getValues('paidBy')) && paidByOptions[0]) {
      form.setValue('paidBy', paidByOptions[0].value);
    }
  }, [paidByOptions, form]);

  useEffect(() => {
    if (splitType === 'equal') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSplitDetails(recalcEqual(participantIds, amount));
    }
  }, [participantIds, amount, splitType]);

  useEffect(() => {
    if (!isEdit || !expenseQuery.data) return;
    const expense = expenseQuery.data;
    form.reset({
      description: expense.description || '',
      amount: String(expense.amount || ''),
      currency: expense.currency || 'INR',
      category: expense.category || 'food',
      groupId: toGroupIdValue(expense.groupId),
      paidBy: expense.paidBy?._id || expense.paidBy || '',
    });

    const incomingSplitDetails = (expense.splitDetails || []).map((item) => {
      const amountValue = Number(item.amount || 0);
      return {
        userId: item.userId?._id || item.userId,
        amount: amountValue,
        percentage: item.percentage ?? (expense.amount ? round2((amountValue / expense.amount) * 100) : 0),
      };
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticipantIds(incomingSplitDetails.map((item) => item.userId));
    setSplitDetails(incomingSplitDetails);
    setSplitType(expense.splitType || 'equal');
  }, [expenseQuery.data, form, isEdit]);

  const sumAmount = splitDetails.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const sumPercentage = splitDetails.reduce((sum, item) => sum + Number(item.percentage || 0), 0);
  const canSubmitSplit =
    !customSplitLocked && splitType === 'equal'
      ? participantIds.length > 0
      : splitType === 'unequal'
        ? hasValidExpenseAmount && Math.abs(sumAmount - amount) < 0.01
        : hasValidExpenseAmount && Math.abs(sumPercentage - 100) < 0.01;

  const handleSplitTypeChange = (nextSplitType) => {
    if ((nextSplitType === 'unequal' || nextSplitType === 'percentage') && !hasValidExpenseAmount) {
      setApiError('Enter total expense amount before using Unequal or Percentage split.');
      return;
    }
    setApiError('');
    setSplitType(nextSplitType);
  };

  const onSubmit = (values) => {
    if (!canSubmitSplit) return;
    setApiError('');
    const resolvedGroupId =
      values.groupId === 'none'
        ? null
        : values.groupId || (isEdit && initialExpenseGroupId !== 'none' ? initialExpenseGroupId : null);
    const payload = {
      description: values.description,
      amount: Number(values.amount),
      currency: values.currency,
      category: values.category,
      groupId: resolvedGroupId,
      paidBy: values.paidBy,
      splitType,
      participants: participantIds,
      splitDetails,
    };

    const mutation = isEdit ? updateExpenseMutation : createExpenseMutation;
    mutation.mutate(payload, {
      onError: () => {
        setApiError('Unable to save expense. Please try again.');
      },
    });
  };

  const updateUnequalAmount = (userId, inputValue) => {
    if (!hasValidExpenseAmount) return;
    const nextAmount = round2(Number(inputValue || 0));
    const next = splitDetails.map((item) => item.userId === userId ? { ...item, amount: nextAmount } : item);
    const total = next.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    setSplitDetails(next.map((item) => ({
      ...item,
      percentage: total > 0 ? round2((item.amount / total) * 100) : 0,
    })));
  };

  const updatePercentage = (userId, inputValue) => {
    if (!hasValidExpenseAmount) return;
    const nextPercent = round2(Number(inputValue || 0));
    const next = splitDetails.map((item) => item.userId === userId ? { ...item, percentage: nextPercent } : item);
    setSplitDetails(next.map((item) => ({
      ...item,
      amount: round2((amount * Number(item.percentage || 0)) / 100),
    })));
  };

  const removeParticipant = (userId) => {
    const nextIds = participantIds.filter((idValue) => idValue !== userId);
    setParticipantIds(nextIds);
    if (splitType === 'equal') {
      setSplitDetails(recalcEqual(nextIds, amount));
    } else {
      setSplitDetails(splitDetails.filter((item) => item.userId !== userId));
    }
  };

  return (
    <AppShell>
      <PageHeader title={isEdit ? 'Edit Expense' : 'Create Expense'} />

      <Card className="mx-auto w-full max-w-[560px]">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormInputField
                control={form.control}
                name="description"
                label="Description"
                placeholder="Dinner at Mainland China"
                disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormInputField
                  control={form.control}
                  name="amount"
                  label="Amount"
                  type="number"
                  placeholder="600.00"
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                />
                <FormSelectField
                  control={form.control}
                  name="currency"
                  label="Currency"
                  options={currencyOptions}
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                />
              </div>
              <FormSelectField
                control={form.control}
                name="category"
                label="Category"
                options={categoryOptions}
                disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
              />
              <FormSelectField
                control={form.control}
                name="groupId"
                label="Group (optional)"
                options={[{ value: 'none', label: 'No Group' }, ...groups.map((group) => ({ value: group._id, label: group.name }))]}
                disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
              />
              <FormSelectField
                control={form.control}
                name="paidBy"
                label="Paid by"
                options={paidByOptions}
                disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">Split Type</p>
                <SplitTypeSelector
                  value={splitType}
                  onChange={handleSplitTypeChange}
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Participants</p>
                <ParticipantSelector
                  users={participantPool}
                  selectedIds={participantIds}
                  onChange={(ids) => {
                    setParticipantIds(ids);
                    if (splitType === 'equal') setSplitDetails(recalcEqual(ids, amount));
                    else {
                      setSplitDetails(ids.map((idValue) => {
                        const existing = splitDetails.find((item) => item.userId === idValue);
                        return existing || { userId: idValue, amount: 0, percentage: 0 };
                      }));
                    }
                  }}
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                />

                <div className="space-y-2">
                  {splitDetails.map((detail) => {
                    const participant = participantPool.find((u) => u._id === detail.userId) || users.find((u) => u._id === detail.userId);
                    if (!participant) return null;
                    return (
                      <ParticipantSplitRow
                        key={detail.userId}
                        user={participant}
                        splitType={splitType}
                        amount={detail.amount}
                        percentage={detail.percentage}
                        currency={watchedCurrency}
                        onAmountChange={(value) => updateUnequalAmount(detail.userId, value)}
                        onPercentageChange={(value) => updatePercentage(detail.userId, value)}
                        onRemove={() => removeParticipant(detail.userId)}
                        canRemove={participantIds.length > 1}
                        inputsDisabled={customSplitLocked || createExpenseMutation.isPending || updateExpenseMutation.isPending}
                      />
                    );
                  })}
                </div>

                <SplitTotalsFooter
                  splitType={splitType}
                  totalAmount={amount}
                  sumAmount={sumAmount}
                  sumPercentage={sumPercentage}
                />
              </div>

              {apiError ? (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              ) : null}

              {customSplitLocked ? (
                <Alert>
                  <AlertDescription>
                    Enter the total expense amount first to edit Unequal or Percentage split values.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={(createExpenseMutation.isPending || updateExpenseMutation.isPending) || !canSubmitSplit}
              >
                {isEdit ? 'Update Expense' : 'Save Expense'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default CreateEditExpensePage;

