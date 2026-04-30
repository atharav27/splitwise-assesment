import { Skeleton } from '../../../components/ui/skeleton';

export const ActivityItemSkeleton = () => (
  <div className="flex gap-3 py-2">
    <Skeleton className="h-6 w-6 rounded-full mt-1" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-3 w-12 mt-1" />
  </div>
);

