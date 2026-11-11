import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiRequest, setUnauthorizedHandler } from '@/lib/api';
import { clearSession, getStoredUser, getToken, saveReturning, saveSession } from '@/lib/storage';

export type Role = 'USER' | 'POLICE_OFFICER' | 'ADMIN';

export type AuthUser = {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
};

// What /api/auth/login and /api/auth/register return
type AuthResponse = AuthUser & { message: string; token: string };

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean; // true while the saved login is being restored
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await clearSession();
    } catch (e) {
      console.warn('[auth] could not clear the saved session:', e);
    } finally {
      setUser(null); // always leave the signed-in screens, whatever happened above
    }
  }, []);

  // Restore a saved login when the app opens
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const stored = await getStoredUser();
        if (token && stored) setUser(stored);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // If the backend ever says "401", the token is no longer valid
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const startSession = useCallback(async (data: AuthResponse) => {
    const { token, userId, fullName, email, role } = data;
    const sessionUser: AuthUser = { userId, fullName, email, role };
    await saveSession(token, sessionUser);
    // Remember this phone has been used, so the sign-in screen says "Welcome back" only to returning people
    saveReturning({ email, firstName: fullName.trim().split(/\s+/)[0] ?? '' }).catch(() => {});
    setUser(sessionUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
        auth: false,
      });
      await startSession(data);
    },
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: {
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          password: input.password,
          phoneNumber: input.phoneNumber?.trim() || undefined,
        },
        auth: false,
      });
      await startSession(data);
    },
    [startSession],
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
