import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AmountDisplay, UserAvatar } from '../../../components/shared';

export const BalanceRow = ({ entry }) => {
  const isOwed = entry.direction === 'owed';

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar user={{ name: entry.name, avatar: entry.avatar }} size="sm" />
        <p className="truncate text-sm font-medium">{entry.name}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {isOwed ? 'owes you' : 'you owe'}
        </span>
        <AmountDisplay
          amount={entry.amount || 0}
          direction={entry.direction}
          size="sm"
        />
        {isOwed ? (
          <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <ArrowLeft className="h-3.5 w-3.5 text-red-500" />
        )}
      </div>
    </div>
  );
};
