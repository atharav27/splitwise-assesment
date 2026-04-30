import { Activity, ArrowLeftRight, LayoutDashboard, Receipt, Users, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from './UserAvatar';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/balances', label: 'Balances', icon: Wallet },
  { to: '/settlements', label: 'Settlements', icon: ArrowLeftRight },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export const Sidebar = ({ className }) => {
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 w-[var(--sidebar-width)] border-r bg-card p-4',
        'flex-col justify-between',
        className
      )}
    >
      <div>
        <div className="mb-6 px-2">
          <h2 className="text-lg font-semibold">Splitwise</h2>
        </div>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="flex items-center gap-3 px-2">
          <UserAvatar user={user} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name || 'Guest'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
