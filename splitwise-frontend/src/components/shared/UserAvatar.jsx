import { cn, getInitials } from '../../lib/utils';

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

const getColor = (name = '') => {
  if (!name) return COLORS[0];
  return COLORS[name.charCodeAt(0) % COLORS.length];
};

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const UserAvatar = ({ user, size = 'md', className }) => {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        sizeClasses[size],
        getColor(user?.name),
        className
      )}
    >
      {getInitials(user?.name)}
    </div>
  );
};
