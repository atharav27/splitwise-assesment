import { Skeleton } from '../ui/skeleton';

export const SkeletonList = ({ count, className, containerClassName = 'space-y-2' }) => (
  <div className={containerClassName}>
    {Array.from({ length: count }).map((_, idx) => (
      <Skeleton key={idx} className={className} />
    ))}
  </div>
);

