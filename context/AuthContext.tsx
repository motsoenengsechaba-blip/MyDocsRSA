import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiRequest, setUnauthorizedHandler } from "@/lib/api";
import {
  clearSession,
  getStoredUser,
  getToken,
  saveReturning,
  saveSession,
} from "@/lib/storage";

export type Role = "USER" | "POLICE_OFFICER" | "ADMIN";

export type AuthUser = {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
};

type AuthResponse = AuthUser & {
  message: string;
  token: string;
};

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

type RegisteredUser = Pick<AuthUser, "fullName" | "email">;

type AuthContextValue = {
  user: AuthUser | null;
  registeredUser: RegisteredUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await clearSession();
    } catch (e) {
      console.warn("[auth] could not clear the saved session:", e);
    } finally {
      setRegisteredUser(null);
      setUser(null);
    }
  }, []);

  // Restore an existing session when the app opens.
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const stored = await getStoredUser();

        if (token && stored) {
          setUser(stored);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const startSession = useCallback(async (data: AuthResponse) => {
    const { token, userId, fullName, email, role } = data;
    const sessionUser: AuthUser = { userId, fullName, email, role };

    await saveSession(token, sessionUser);

    saveReturning({
      email,
      firstName: fullName.trim().split(/\s+/)[0] ?? "",
    }).catch(() => {});

    setRegisteredUser(null);
    setUser(sessionUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
        },
        auth: false,
      });

      await startSession(data);
    },
    [startSession],
  );

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiRequest<RegisteredUser>("/api/auth/register", {
      method: "POST",
      body: {
        fullName: input.fullName.trim(),
        email: input.email.trim(),
        password: input.password,
        phoneNumber: input.phoneNumber?.trim() || undefined,
      },
      auth: false,
    });

    // The login screen uses these details for the post-registration greeting.
    setRegisteredUser({
      fullName: data.fullName,
      email: data.email,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, registeredUser, loading, login, register, logout }),
    [user, registeredUser, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return ctx;
}
