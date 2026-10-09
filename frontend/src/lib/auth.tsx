"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api";
import type { AuthResponse, Me, Role } from "./types";

interface AuthState {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Me>;
  register: (data: { name: string; email: string; password: string; role: Role }) => Promise<Me>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function homeFor(role: Role): string {
  return role === "PERSONAL" ? "/alunos" : "/hoje";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.get<Me>("/auth/me");
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMe = useCallback(async (): Promise<Me> => {
    const me = await api.get<Me>("/auth/me");
    setUser(me);
    return me;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>("/auth/login", { email, password }, { skipAuthRedirect: true });
      setToken(res.token);
      return loadMe();
    },
    [loadMe],
  );

  const register = useCallback(
    async (data: { name: string; email: string; password: string; role: Role }) => {
      const res = await api.post<AuthResponse>("/auth/register", data, { skipAuthRedirect: true });
      setToken(res.token);
      return loadMe();
    },
    [loadMe],
  );

  const refresh = useCallback(async () => {
    await loadMe();
  }, [loadMe]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
