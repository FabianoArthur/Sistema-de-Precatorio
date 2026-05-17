import { apiClient } from '@/lib/api-client';
import type { LoginResponse } from '@preca/shared';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

type AuthUser = LoginResponse['user'];

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('preca:token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get<AuthUser>('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('preca:token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, senha });
    localStorage.setItem('preca:token', data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('preca:token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
