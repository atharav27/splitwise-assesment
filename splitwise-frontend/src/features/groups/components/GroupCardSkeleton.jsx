import { Skeleton } from '../../../components/ui/skeleton';

export const GroupCardSkeleton = () => (
  <div className="rounded-lg border p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-12" />
    </div>
    <Skeleton className="h-7 w-28 rounded-full" />
    <Skeleton className="h-3 w-1/3" />
  </div>
);

