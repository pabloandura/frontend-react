import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import client from '../api/client';
import { tokenStore, refreshTokenStore } from '../api/token';

interface AuthContextValue {
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // True while we attempt to restore a session from a stored refresh token
  const [initializing, setInitializing] = useState(!!refreshTokenStore.get());

  useEffect(() => {
    const stored = refreshTokenStore.get();
    if (!stored) {
      setInitializing(false);
      return;
    }
    // Eagerly exchange the stored refresh token so the first API call
    // doesn't have to recover from a 401 before it can succeed
    axios
      .post<{ data: { accessToken: string; refreshToken: string } }>(
        '/api/auth/refresh',
        { refreshToken: stored },
      )
      .then(({ data }) => {
        tokenStore.set(data.data.accessToken);
        refreshTokenStore.set(data.data.refreshToken);
        setIsAuthenticated(true);
      })
      .catch(() => {
        refreshTokenStore.clear();
      })
      .finally(() => setInitializing(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await client.post<{
      data: { accessToken: string; refreshToken: string };
    }>('/auth/login', { email, password });

    tokenStore.set(data.data.accessToken);
    refreshTokenStore.set(data.data.refreshToken);
    setIsAuthenticated(true);
  }

  async function logout() {
    const refreshToken = refreshTokenStore.get();
    try {
      if (refreshToken) {
        // Server-side: invalidate the refresh token (requires valid access token;
        // if expired the Axios interceptor will refresh first, then retry)
        await client.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Best-effort — always clear client state regardless
    } finally {
      tokenStore.clear();
      refreshTokenStore.clear();
      setIsAuthenticated(false);
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
