import React from 'react';
import { toast } from 'react-hot-toast';

import { checkApiHealth, type ApiHealthResult } from '../lib/api';

const HEALTH_TOAST_ID = 'backend-health';
const DEFAULT_POLL_INTERVAL = 30000; // 30s

type ApiHealthContextValue = {
  healthy: boolean;
  checking: boolean;
  lastCheckedAt: number | null;
  lastResult: ApiHealthResult | null;
  refresh: () => Promise<ApiHealthResult>;
  disableWrites: boolean;
};

const ApiHealthContext = React.createContext<ApiHealthContextValue | undefined>(undefined);

export const ApiHealthProvider: React.FC<{ children: React.ReactNode; pollIntervalMs?: number }> = ({
  children,
  pollIntervalMs = DEFAULT_POLL_INTERVAL,
}) => {
  const [healthy, setHealthy] = React.useState(true);
  const [checking, setChecking] = React.useState(false);
  const [lastCheckedAt, setLastCheckedAt] = React.useState<number | null>(null);
  const [lastResult, setLastResult] = React.useState<ApiHealthResult | null>(null);

  const refresh = React.useCallback(async () => {
    setChecking(true);
    try {
      const result = await checkApiHealth();
      setHealthy(result.healthy);
      setLastResult(result);
      setLastCheckedAt(Date.now());
      return result;
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => {
    refresh().catch(() => {
      // refresh already reports via state/ toast effect below
    });
  }, [refresh]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const id = window.setInterval(() => {
      refresh().catch(() => {
        // handled via state
      });
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [pollIntervalMs, refresh]);

  React.useEffect(() => {
    if (!healthy) {
      const message = lastResult?.message ?? 'Backend unavailable';
      toast.error(message, { id: HEALTH_TOAST_ID, duration: Number.POSITIVE_INFINITY });
    } else {
      toast.dismiss(HEALTH_TOAST_ID);
    }
  }, [healthy, lastResult?.message]);

  const value = React.useMemo<ApiHealthContextValue>(
    () => ({
      healthy,
      checking,
      lastCheckedAt,
      lastResult,
      refresh,
      disableWrites: !healthy,
    }),
    [healthy, checking, lastCheckedAt, lastResult, refresh],
  );

  return <ApiHealthContext.Provider value={value}>{children}</ApiHealthContext.Provider>;
};

export function useApiHealth(): ApiHealthContextValue {
  const context = React.useContext(ApiHealthContext);
  if (!context) {
    throw new Error('useApiHealth must be used within an ApiHealthProvider');
  }
  return context;
}
