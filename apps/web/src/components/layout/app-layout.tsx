import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';
import { Building2, Handshake, LayoutDashboard, LogOut, Moon, ScrollText, Sun } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/precatorios', label: 'Precatórios', icon: ScrollText },
  { to: '/compradores', label: 'Compradores', icon: Building2 },
  { to: '/parceiros', label: 'Parceiros', icon: Handshake },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-border font-semibold">
          Preca
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border space-y-1">
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
            Sair ({user?.nome})
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
