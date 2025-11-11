import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../store';
import clsx from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { connected } = useStore();

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Connection indicator */}
      {!connected && (
        <div className="bg-yellow-600 text-white text-center py-2 px-4 text-sm">
          Connecting to server...
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 safe-bottom">
        <div className="flex justify-around">
          <NavItem to="/" icon="🏠" label="Home" />
          <NavItem to="/scenes" icon="🎬" label="Scenes" />
          <NavItem to="/control" icon="🎛️" label="Control" />
          <NavItem to="/fixtures" icon="💡" label="Fixtures" />
          <NavItem to="/settings" icon="⚙️" label="Settings" />
        </div>
      </nav>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex flex-col items-center justify-center py-2 px-4 min-w-[80px]',
          'transition-colors',
          isActive ? 'text-primary-400' : 'text-slate-400 hover:text-slate-200'
        )
      }
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs">{label}</span>
    </NavLink>
  );
}
