import { ArrowRightLeft } from 'lucide-react';
import { AmountDisplay, UserAvatar } from '../../../components/shared';
import { formatDate, formatRelative } from '../../../lib/utils';

export const SettlementCard = ({ settlement, currentUserId }) => {
  const fromUser = settlement.fromUser || {};
  const toUser = settlement.toUser || {};
  const isYouPaid = (fromUser._id || fromUser) === currentUserId;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 rounded-full bg-muted p-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserAvatar user={isYouPaid ? toUser : fromUser} size="sm" />
              <p className="truncate text-sm font-medium">
                {isYouPaid
                  ? `You paid ${toUser.name || 'user'}`
                  : `${fromUser.name || 'Someone'} paid you`}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {settlement.note ? `"${settlement.note}"` : 'No note'} · {formatDate(settlement.createdAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <AmountDisplay amount={settlement.amount || 0} direction="neutral" />
          <p className="text-xs text-muted-foreground">{formatRelative(settlement.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

