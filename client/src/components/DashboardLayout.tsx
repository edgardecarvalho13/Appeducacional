/**
 * FAMP Academy — Dashboard Layout
 * Design: "Command Center" — Layout com sidebar + conteúdo principal.
 * Inclui header fino com breadcrumb e status bar.
 */

import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import { Bell, Search, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-12 shrink-0 border-b border-border flex items-center justify-between px-5">
          <div>
            {title && (
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h2>
                {subtitle && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{subtitle}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Search */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toast.info('Busca global em breve!')}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Buscar</TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toast.info('Notificações em breve!')}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Notificações</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Status Bar (Command Center style) */}
        <footer className="h-6 shrink-0 border-t border-border bg-sidebar flex items-center px-4 text-[10px] font-mono text-muted-foreground gap-4">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-green-500" />
            <span>Conectado</span>
          </div>
          <span className="text-border">|</span>
          <span>{user?.role === 'aluno' ? `${user.periodo}º Período` : user?.role?.toUpperCase()}</span>
          <span className="text-border">|</span>
          <span>v1.0.0-mvp</span>
          <div className="flex-1" />
          <span>FAMP Academy</span>
        </footer>
      </div>
    </div>
  );
}
