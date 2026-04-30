import { ArrowRight } from 'lucide-react';
import { AmountDisplay, UserAvatar } from '../../../components/shared';

export const TransactionRow = ({ tx }) => {
  const fromName = tx.from?.name || tx.from || tx.fromUser?.name || tx.fromUser || 'From';
  const toName = tx.to?.name || tx.to || tx.toUser?.name || tx.toUser || 'To';
  const fromUser = tx.fromUser || tx.from || { name: fromName };
  const toUser = tx.toUser || tx.to || { name: toName };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-2">
      <div className="flex items-center gap-2 min-w-0">
        <UserAvatar user={typeof fromUser === 'object' ? fromUser : { name: fromName }} size="sm" />
        <span className="truncate text-sm">{fromName}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        <UserAvatar user={typeof toUser === 'object' ? toUser : { name: toName }} size="sm" />
        <span className="truncate text-sm">{toName}</span>
      </div>
      <AmountDisplay amount={tx.amount || 0} direction="neutral" size="sm" />
    </div>
  );
};

