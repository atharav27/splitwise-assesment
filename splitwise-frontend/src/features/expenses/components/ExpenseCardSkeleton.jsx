import { Skeleton } from '../../../components/ui/skeleton';

export const ExpenseCardSkeleton = () => (
  <div className="rounded-lg border p-4 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-3 w-1/3" />
  </div>
);

