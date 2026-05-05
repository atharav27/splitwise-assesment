import { CircleMinus, CirclePlus, Pencil, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import { UserAvatar } from '../../../components/shared';
import { formatCurrency, formatRelative } from '../../../lib/utils';

const actionIconMap = {
  'expense.created': CirclePlus,
  'expense.updated': Pencil,
  'expense.deleted': Trash2,
  'settlement.paid': CircleMinus,
  'group.created': Users,
  'member.added': UserPlus,
  'member.removed': UserMinus,
};

const getUserId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
};

const getActivityText = (item, currentUserId) => {
  const actorId = getUserId(item.actor) || getUserId(item.userId);
  const targetId = getUserId(item.target) || item.metadata?.userId || null;
  const actorName = item.actorName || item.actor?.name || item.userId?.name || 'Someone';
  const targetName = item.targetName || item.target?.name || item.metadata?.userName || 'user';
  const actor = actorId && currentUserId && actorId.toString() === currentUserId.toString() ? 'You' : actorName;
  const target = targetId && currentUserId && targetId.toString() === currentUserId.toString() ? 'you' : targetName;
  const metadata = item.metadata || {};
  const groupName = item.groupName || item.group?.name || item.groupId?.name;

  switch (item.action) {
    case 'expense.created':
      return { prefix: `${actor} added "${metadata.description || 'expense'}"`, amount: metadata.amount };
    case 'expense.updated':
      return { prefix: `${actor} updated "${metadata.description || 'expense'}"`, amount: metadata.amount };
    case 'expense.deleted':
      return { prefix: `${actor} deleted "${metadata.description || 'expense'}"` };
    case 'settlement.paid':
      return { prefix: `${actor} paid ${target}`, amount: metadata.amount };
    case 'group.created':
      return { prefix: `${actor} created "${metadata.name || groupName || 'group'}"` };
    case 'member.added':
      return { prefix: `${actor} added ${target} to "${groupName || metadata.name || 'group'}"` };
    case 'member.removed':
      return { prefix: `${actor} removed ${target} from "${groupName || metadata.name || 'group'}"` };
    default:
      return { prefix: `${actor} did an activity` };
  }
};

export const ActivityItem = ({ item, currentUserId, isLast = false }) => {
  const Icon = actionIconMap[item.action] || CirclePlus;
  const text = getActivityText(item, currentUserId);
  const timestamp = item.createdAt || item.timestamp;

  return (
    <div className="relative flex gap-3 pl-1">
      <div className="relative flex flex-col items-center">
        <span className="z-10 rounded-full border bg-background p-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        {!isLast ? <span className="hidden md:block absolute top-6 h-[calc(100%-10px)] w-px bg-border" /> : null}
      </div>

      <div className="flex flex-1 items-start justify-between gap-2 pb-4">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <UserAvatar
              user={item.actor || item.userId || { name: item.actorName || item.userId?.name || 'User' }}
              size="sm"
            />
            <div>
              <p className="text-sm">
                {text.prefix}
                {typeof text.amount === 'number' ? (
                  <span className="amount ml-1">({formatCurrency(text.amount, item.currency || 'INR')})</span>
                ) : null}
              </p>
              {(item.groupName || item.group?.name || item.groupId?.name) ? (
                <p className="text-xs text-muted-foreground">{item.groupName || item.group?.name || item.groupId?.name}</p>
              ) : null}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {timestamp ? formatRelative(timestamp) : ''}
        </p>
      </div>
    </div>
  );
};

