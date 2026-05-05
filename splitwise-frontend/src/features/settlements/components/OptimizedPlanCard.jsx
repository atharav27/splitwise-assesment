import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { getOptimizedTransactions } from '../../../hooks/useSettlements';
import { TransactionRow } from './TransactionRow';

export const OptimizedPlanCard = ({ data, isLoading }) => {
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
        <CardTitle>Suggested scope breakdown ({optimizedCount} transactions)</CardTitle>
        <CardDescription>
          This is informational for the selected group. Settle from All Balances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {optimized.map((tx, idx) => (
          <TransactionRow key={`${tx.from}-${tx.to}-${idx}`} tx={tx} />
        ))}
        {baselineCount > optimizedCount ? (
          <p className="text-xs text-muted-foreground">
            Optimization reduces estimated transfers from {baselineCount} to {optimizedCount}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

