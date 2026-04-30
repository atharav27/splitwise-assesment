import { UserAvatar } from './UserAvatar';
import { cn } from '../../lib/utils';

export const UserAvatarGroup = ({ users = [], max = 4, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user) => (
        <UserAvatar
          key={user._id || user.id || user.email}
          user={user}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium text-xs',
            'bg-muted text-muted-foreground ring-2 ring-background',
            size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
