import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export const AppShell = ({ children }) => (
  <div className="min-h-screen bg-background flex">
    <Sidebar className="hidden md:flex" />
    <main className="flex-1 min-w-0 pb-20 md:pb-0 md:pl-[var(--sidebar-width)]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </div>
    </main>
    <BottomNav className="md:hidden" />
  </div>
);
