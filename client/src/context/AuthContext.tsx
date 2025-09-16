import React, { createContext, useContext, useMemo } from 'react';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: 'authenticated';
  refreshing: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  register: (input: { name: string; email: string; password: string; confirmPassword: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const defaultUser: AuthUser = {
  id: 1,
  email: 'demo@localhost',
  name: 'Demo User',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AuthContextValue>(
    () => ({
      user: defaultUser,
      status: 'authenticated',
      refreshing: false,
      async login() {
        return defaultUser;
      },
      async register() {
        return defaultUser;
      },
      async logout() {
        return;
      },
      async refresh() {
        return;
      },
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
