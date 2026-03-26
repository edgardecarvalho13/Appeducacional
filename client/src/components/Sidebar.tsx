/**
 * FAMP Academy — Sidebar Component
 * Design: "Command Center" — Sidebar compacta (56px → 220px)
 * Ícones com tooltips, indicadores de status, perfil do usuário.
 */

import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  FileQuestion,
  Bot,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  Users,
  Stethoscope,
  Building2,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: string[];
  status?: 'active' | 'coming_soon';
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'planner', label: 'FAMP Planner', icon: Calendar, href: '/planner', status: 'active' },
  { id: 'quest', label: 'FAMP Quest', icon: FileQuestion, href: '/quest', status: 'active' },
  { id: 'tutor', label: 'FAMP Tutor IA', icon: Bot, href: '/tutor', status: 'active' },
  { id: 'library', label: 'FAMP Library', icon: BookOpen, href: '/library', status: 'active' },
  { id: 'caderno', label: 'Caderno de Erros', icon: AlertTriangle, href: '/caderno-erros', status: 'active' },
  { id: 'desempenho', label: 'Desempenho', icon: BarChart3, href: '/desempenho', status: 'active' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, href: '/flashcards', status: 'coming_soon' },
  { id: 'enamed', label: 'ENAMED', icon: Stethoscope, href: '/enamed', status: 'coming_soon' },
  { id: 'internato', label: 'Internato', icon: Building2, href: '/internato', status: 'coming_soon' },
];

const ADMIN_ITEMS: NavItem[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics', roles: ['coordenacao', 'admin'] },
  { id: 'turmas', label: 'Turmas', icon: Users, href: '/turmas', roles: ['coordenacao', 'admin', 'professor'] },
  { id: 'avisos', label: 'Avisos', icon: Bell, href: '/avisos', roles: ['coordenacao', 'admin'] },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [location] = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.status === 'coming_soon') {
      e.preventDefault();
      toast.info('Em breve! Este módulo está em desenvolvimento.');
    }
  };

  const visibleAdminItems = ADMIN_ITEMS.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role as any));
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      aluno: 'Aluno',
      professor: 'Professor',
      coordenacao: 'Coordenação',
      admin: 'Administrador',
    };
    return labels[role] || role;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-out shrink-0',
        expanded ? 'w-[220px]' : 'w-[56px]'
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-3 gap-2 shrink-0">
        <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-primary" />
        </div>
        {expanded && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>
              FAMP Academy
            </h1>
          </div>
        )}
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
          const Icon = item.icon;

          const linkContent = (
            <Link
              href={item.href}
              onClick={(e) => handleNavClick(item, e)}
              className={cn(
                'flex items-center gap-2.5 px-2 h-9 rounded-md text-sm transition-all duration-150 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                item.status === 'coming_soon' && 'opacity-50'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
              )}
              <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
              {expanded && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.status === 'coming_soon' && (
                    <span className="text-[9px] font-mono uppercase text-muted-foreground bg-muted px-1 py-0.5 rounded">
                      Em breve
                    </span>
                  )}
                </>
              )}
            </Link>
          );

          if (!expanded) {
            return (
              <Tooltip key={item.id} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                  {item.badge && <span className="ml-1 text-primary">({item.badge})</span>}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.id}>{linkContent}</div>;
        })}

        {/* Admin section */}
        {visibleAdminItems.length > 0 && (
          <>
            <Separator className="my-2 opacity-30" />
            {expanded && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Gestão
              </p>
            )}
            {visibleAdminItems.map(item => {
              const isActive = location.startsWith(item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    'flex items-center gap-2.5 px-2 h-9 rounded-md text-sm transition-all duration-150 relative',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
                  )}
                  <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                  {expanded && <span className="truncate">{item.label}</span>}
                </Link>
              );

              if (!expanded) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.id}>{linkContent}</div>;
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0">
        <Separator className="opacity-30" />

        {/* User profile */}
        {user && (
          <div className={cn('px-2 py-2', expanded ? 'flex items-center gap-2' : 'flex flex-col items-center gap-1')}>
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                {getInitials(user.full_name)}
              </span>
            </div>
            {expanded && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium truncate">{user.full_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {getRoleLabel(user.role)}
                  {user.periodo && ` · ${user.periodo}º período`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={cn('px-2 pb-2 flex', expanded ? 'gap-1' : 'flex-col gap-1')}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="flex-1 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side={expanded ? 'top' : 'right'} className="text-xs">
              {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => toast.info('Configurações em breve!')}
                className="flex-1 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side={expanded ? 'top' : 'right'} className="text-xs">Configurações</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex-1 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side={expanded ? 'top' : 'right'} className="text-xs">Sair</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex-1 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                {expanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side={expanded ? 'top' : 'right'} className="text-xs">
              {expanded ? 'Recolher' : 'Expandir'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
