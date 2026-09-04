import { createContext, useContext, useEffect, useState } from 'react';
import { api, AuthUser } from './api';

interface AuthState {
  user: AuthUser | null;
  needsSetup: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await api.auth.me();
      setUser(res.user || null);
      setNeedsSetup(!!res.needsSetup);
    } catch {
      // A failed auth check (network blip, backend hiccup) must fail closed to "not authenticated"
      // rather than leaving the app stuck on the loading screen forever — this was an unhandled
      // rejection before, since `refresh()` is fired from useEffect with no .catch attached.
      setUser(null);
      setNeedsSetup(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(username: string, password: string) {
    const res = await api.auth.login(username, password);
    setUser(res.user);
    setNeedsSetup(false);
  }

  async function setup(username: string, password: string) {
    const res = await api.auth.setup(username, password);
    setUser(res.user);
    setNeedsSetup(false);
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, needsSetup, loading, refresh, login, setup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
