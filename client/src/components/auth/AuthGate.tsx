import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AuthLoader() {
  return (
    <div className="min-h-screen w-full grid place-items-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" aria-hidden="true" />
        <p className="text-sm font-medium">Securing your workspace…</p>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, refreshing } = useAuth();
  const location = useLocation();

  if (status === 'loading' || refreshing) {
    return <AuthLoader />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
