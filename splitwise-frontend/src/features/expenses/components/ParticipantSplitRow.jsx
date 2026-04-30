import { UserAvatar } from '../../../components/shared';
import { Input } from '../../../components/ui/input';
import { formatCurrency } from '../../../lib/utils';

export const ParticipantSplitRow = ({
  user,
  splitType,
  amount,
  percentage,
  onAmountChange,
  onPercentageChange,
  onRemove,
  canRemove = true,
  currency = 'INR',
}) => {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border p-2">
      <div className="flex min-w-0 items-center gap-2">
        <UserAvatar user={user} size="sm" />
        <p className="truncate text-sm">{user?.name || user?.email}</p>
      </div>

      {splitType === 'equal' ? (
        <p className="text-sm text-muted-foreground">{formatCurrency(amount || 0, currency)}</p>
      ) : null}

      {splitType === 'unequal' ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            className="w-28"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">{(percentage || 0).toFixed(1)}%</span>
        </div>
      ) : null}

      {splitType === 'percentage' ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="w-24"
            value={percentage}
            onChange={(e) => onPercentageChange(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">{formatCurrency(amount || 0, currency)}</span>
        </div>
      ) : null}

      {canRemove ? (
        <button type="button" onClick={onRemove} className="text-xs text-destructive">
          Remove
        </button>
      ) : (
        <span />
      )}
    </div>
  );
};

