import { AmountDisplay, UserAvatar } from '../../../components/shared';
import { Button } from '../../../components/ui/button';

export const BalanceSummaryCard = ({ entry, onSettleClick }) => {
  const isOwe = entry.direction === 'owe';

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={{ name: entry.name, avatar: entry.avatar }} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{entry.name}</p>
            <p className="truncate text-xs text-muted-foreground">{entry.email || ''}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{isOwe ? 'You owe' : 'Owes you'}</p>
          <AmountDisplay amount={entry.amount || 0} direction={entry.direction} size="md" />
        </div>
      </div>

      {isOwe ? (
        <div className="mt-3">
          <Button type="button" size="sm" onClick={() => onSettleClick(entry)}>
            Settle Up
          </Button>
        </div>
      ) : null}
    </div>
  );
};

