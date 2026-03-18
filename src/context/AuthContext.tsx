import { createContext, useContext, useState, ReactNode } from 'react';
import client from '../api/client';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!sessionStorage.getItem('access_token'),
  );

  async function login(email: string, password: string) {
    const { data } = await client.post<{ data: { accessToken: string } }>(
      '/auth/login',
      { email, password },
    );
    sessionStorage.setItem('access_token', data.data.accessToken);
    setIsAuthenticated(true);
  }

  async function logout() {
    sessionStorage.removeItem('access_token');
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
