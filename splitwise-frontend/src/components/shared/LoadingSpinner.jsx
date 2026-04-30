import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const LoadingSpinner = ({ size = 'lg', className }) => {
  if (size === 'sm') {
    return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
  }

  return (
    <div className={cn('flex min-h-[40vh] items-center justify-center', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};
