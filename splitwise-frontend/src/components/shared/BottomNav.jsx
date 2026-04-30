import { Activity, CirclePlus, LayoutDashboard, Users, Wallet } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/balances', label: 'Balances', icon: Wallet },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export const BottomNav = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur', className)}>
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        {navItems.slice(0, 2).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('flex flex-col items-center text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => navigate('/expenses/new')}
          className="mb-6 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
        >
          <CirclePlus className="h-4 w-4" />
          Add
        </button>

        {navItems.slice(2).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('flex flex-col items-center text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
