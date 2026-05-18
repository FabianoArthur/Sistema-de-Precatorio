import { BrandWordmark } from '@/components/brand-mark';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { NotificacoesBell } from '@/features/notificacoes/bell';
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

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-border bg-card/60 backdrop-blur flex flex-col">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <BrandWordmark />
        </div>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-2xs font-semibold uppercase text-muted-foreground tracking-wider">
            Navegação
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                  active
                    ? 'bg-primary-soft text-primary-strong'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary"
                    aria-hidden
                  />
                )}
                <Icon
                  size={16}
                  className={cn(
                    'transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom area */}
        <div className="px-3 pt-3 pb-2 space-y-0.5 border-t border-border">
          <NotificacoesBell />
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>
        </div>

        {/* User */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card-muted/50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase">
              {user?.nome?.slice(0, 1) ?? '?'}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-sm font-medium truncate">{user?.nome ?? 'Convidado'}</div>
              <div className="text-2xs text-muted-foreground truncate">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sair"
              aria-label="Sair"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive-soft transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
