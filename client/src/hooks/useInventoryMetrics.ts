import { useEffect, useState } from 'react';

export type KPI = {
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  totalItems: number;
};

export type PieDatum = { name: string; value: number };

export type InventoryMetrics = {
  kpis: KPI;
  pies: { stockHealth: PieDatum[]; perWarehouse: PieDatum[] };
};

export type InventoryMetricsFilters = {
  status?: string;
  search?: string;
  category?: string;
};

export function useInventoryMetrics(filters: InventoryMetricsFilters = {}) {
  const [data, setData] = useState<InventoryMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const filtersKey = JSON.stringify({
    status: filters.status ?? 'all',
    search: filters.search ?? '',
    category: filters.category ?? '',
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const params = new URLSearchParams();
    const parsed = JSON.parse(filtersKey) as { status: string; search: string; category: string };
    if (parsed.search) {
      params.set('search', parsed.search);
    }
    if (parsed.status && parsed.status !== 'all') {
      params.set('status', parsed.status);
    }
    if (parsed.category) {
      params.set('category', parsed.category);
    }
    const queryString = params.toString();
    const url = `/api/inventory/metrics${queryString ? `?${queryString}` : ''}`;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as InventoryMetrics;
        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load metrics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [filtersKey]);

  return { data, loading, error };
}

export default useInventoryMetrics;
