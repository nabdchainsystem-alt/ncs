import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export class AuthApiError extends Error {
  field?: string;
  code?: string;
  status?: number;

  constructor(init: { message: string; field?: string; code?: string; status?: number }) {
    super(init.message);
    this.field = init.field;
    this.code = init.code;
    this.status = init.status;
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  refreshing: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  register: (input: { name: string; email: string; password: string; confirmPassword: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseError(res: Response): never {
  throw new AuthApiError({
    message: 'Request failed',
    status: res.status,
  });
}

async function toJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError({
      message: data?.message || 'Request failed',
      field: data?.field,
      code: data?.code,
      status: res.status,
    });
  }
  return data;
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) parseError(res);
  const data = await res.json();
  return data?.user ?? null;
}

async function prefetchOrders() {
  try {
    const res = await fetch(`${API_URL}/api/requests`, {
      credentials: 'include',
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data?.items)) {
      try {
        localStorage.setItem('ncs_requests_v1', JSON.stringify(data.items));
      } catch {
        // ignore cache errors
      }
    }
  } catch {
    // ignore prefetch issues
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const info = await fetchMe();
      if (info) {
        setUser(info);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (err) {
      console.error('[auth] failed to refresh session', err);
      setUser(null);
      setStatus('unauthenticated');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((err) => {
      console.error('[auth] initial refresh failed', err);
    });
  }, [refresh]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await toJson(res);
    const nextUser = data?.user as AuthUser;
    setUser(nextUser);
    setStatus('authenticated');
    prefetchOrders();
    return nextUser;
  }, []);

  const register = useCallback(async ({ name, email, password, confirmPassword }: { name: string; email: string; password: string; confirmPassword: string }) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    const data = await toJson(res);
    const nextUser = data?.user as AuthUser;
    setUser(nextUser);
    setStatus('authenticated');
    prefetchOrders();
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      try {
        localStorage.removeItem('ncs_requests_v1');
      } catch {
        // ignore
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    refreshing,
    login,
    register,
    logout,
    refresh,
  }), [user, status, refreshing, login, register, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
