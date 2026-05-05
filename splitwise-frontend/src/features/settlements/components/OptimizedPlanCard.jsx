import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { getOptimizedTransactions } from '../../../hooks/useSettlements';
import { TransactionRow } from './TransactionRow';

export const OptimizedPlanCard = ({ data, isLoading, onRecordPayment, selectedEntry }) => {
  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const optimized = getOptimizedTransactions(data);
  if (!optimized.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Optimized plan</CardTitle>
          <CardDescription>Everyone is settled in this group.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const optimizedCount = optimized.length;
  const originalOutstandingCount = Number(data?.originalOutstandingCount || data?.outstandingCount || 0);
  const baselineCount = Math.max(optimizedCount + 1, originalOutstandingCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settle in {optimizedCount} transactions (optimal)</CardTitle>
        <CardDescription>vs {baselineCount} transactions without optimization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {optimized.map((tx, idx) => (
          <TransactionRow key={`${tx.from}-${tx.to}-${idx}`} tx={tx} />
        ))}

        <Button className="w-full" onClick={onRecordPayment} disabled={!selectedEntry}>
          Record a Payment
        </Button>
      </CardContent>
    </Card>
  );
};

