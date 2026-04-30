import { Skeleton } from '../../../components/ui/skeleton';

export const BalanceRowSkeleton = () => (
  <div className="flex items-center justify-between rounded-md border p-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <Skeleton className="h-4 w-20" />
  </div>
);

