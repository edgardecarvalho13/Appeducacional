/**
 * FAMP Academy — Auth Context (Supabase Integration)
 * Autenticação real via Supabase Auth + leitura da tabela profiles.
 * Fallback para dados mock quando Supabase não está configurado.
 *
 * Design: "Command Center" — Acesso controlado por perfil (RBAC)
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
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

// Supabase está sempre configurado (credenciais hardcoded como fallback)
const SUPABASE_CONFIGURED = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restaurar sessão ao montar
  useEffect(() => {
    if (SUPABASE_CONFIGURED) {
      restoreSupabaseSession();
    } else {
      restoreMockSession();
    }
  }, []);

  // Listener de mudanças de auth do Supabase
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          localStorage.removeItem(STORAGE_KEY);
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
        // SIGNED_IN é tratado pelo login() diretamente
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================
  // Supabase: restaurar sessão existente
  // ============================================================
  async function restoreSupabaseSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Tentar buscar perfil do banco
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          setState({ user: profile, isLoading: false, isAuthenticated: true });
          return;
        }
      }

      // Sem sessão ativa — tentar localStorage como cache
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const cached = JSON.parse(stored) as Profile;
          // Verificar se a sessão Supabase ainda é válida
          if (!session) {
            // Sessão expirou, limpar cache
            localStorage.removeItem(STORAGE_KEY);
            setState({ user: null, isLoading: false, isAuthenticated: false });
            return;
          }
          setState({ user: cached, isLoading: false, isAuthenticated: true });
        } catch {
          localStorage.removeItem(STORAGE_KEY);
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      } else {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } catch (err) {
      console.error('Erro ao restaurar sessão Supabase:', err);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }

  // ============================================================
  // Mock: restaurar sessão do localStorage
  // ============================================================
  function restoreMockSession() {
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
  }

  // ============================================================
  // Buscar perfil da tabela profiles
  // ============================================================
  async function fetchProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error.message);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      return null;
    }
  }

  // ============================================================
  // Login
  // ============================================================
  const login = useCallback(async (email: string, password: string) => {
    if (SUPABASE_CONFIGURED) {
      return loginWithSupabase(email, password);
    }
    return loginWithMock(email, password);
  }, []);

  // Login real via Supabase Auth
  async function loginWithSupabase(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Traduzir erros comuns do Supabase para português
        const errorMap: Record<string, string> = {
          'Invalid login credentials': 'E-mail ou senha incorretos.',
          'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
          'Too many requests': 'Muitas tentativas. Aguarde alguns minutos.',
        };
        const msg = errorMap[error.message] || error.message;
        return { success: false, error: msg };
      }

      if (data.user) {
        // Buscar perfil da tabela profiles
        const profile = await fetchProfile(data.user.id);

        if (!profile) {
          // Usuário existe no Auth mas não tem perfil — criar perfil básico
          return {
            success: false,
            error: 'Perfil não encontrado. Entre em contato com a coordenação.',
          };
        }

        if (!profile.is_active) {
          await supabase.auth.signOut();
          return { success: false, error: 'Conta desativada. Entre em contato com a coordenação.' };
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        setState({ user: profile, isLoading: false, isAuthenticated: true });
        return { success: true };
      }

      return { success: false, error: 'Erro desconhecido ao autenticar.' };
    } catch (err) {
      console.error('Erro no login Supabase:', err);
      return { success: false, error: 'Erro ao conectar com o servidor. Tente novamente.' };
    }
  }

  // Login mock (fallback quando Supabase não está configurado)
  async function loginWithMock(email: string, _password: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'E-mail não encontrado. Use um e-mail institucional @famp.edu.br' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Conta desativada. Entre em contato com a coordenação.' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setState({ user, isLoading: false, isAuthenticated: true });
    return { success: true };
  }

  // ============================================================
  // Logout
  // ============================================================
  const logout = useCallback(async () => {
    if (SUPABASE_CONFIGURED) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  // ============================================================
  // RBAC
  // ============================================================
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
