/**
 * FAMP Academy — Auth Context
 * Simula autenticação com Supabase para desenvolvimento frontend.
 * Quando integrar Supabase, substituir a lógica mock pela SDK real.
 *
 * Design: "Command Center" — Acesso controlado por perfil (RBAC)
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile, UserRole } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mock-data';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'famp_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restaurar sessão do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as Profile;
        setState({ user, isLoading: false, isAuthenticated: true });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));

    // Busca usuário mock pelo email
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'E-mail não encontrado. Use um e-mail institucional @famp.edu.br' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Conta desativada. Entre em contato com a coordenação.' };
    }

    // Salvar no localStorage e atualizar estado
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setState({ user, isLoading: false, isAuthenticated: true });

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!state.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
