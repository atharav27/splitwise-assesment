import {
  Activity,
  CirclePlus,
  Handshake,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/balances", label: "Balances", icon: Wallet },
  { to: "/settlements", label: "Settlements", icon: Handshake },
  { to: "/activity", label: "Activity", icon: Activity },
];

export const BottomNav = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80",
        className,
      )}
    >
      <div className="absolute left-1/2 -top-6 z-10 -translate-x-1/2">
        <button
          type="button"
          onClick={() => navigate("/expenses/new")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-card"
        >
          <CirclePlus className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto grid h-20 max-w-md grid-cols-5 items-center px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex w-full flex-col items-center justify-center text-[11px] ",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
