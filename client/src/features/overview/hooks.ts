import { useQuery } from '@tanstack/react-query';

import {
  fetchOverviewCharts,
  fetchOverviewKpis,
  fetchOverviewOrdersByDept,
  getOverviewInventoryKpis,
  getMonthlyStockMovements,
  getRequestsStatusPie,
  getRequestsByDeptBar,
  getOrdersStatusPie,
  getOrdersCategoryPie,
  getInventoryKpis,
  getInventoryMovements,
  getInventoryStockStatus,
  getInventoryByWarehouse,
  getVendorKpis,
  getVendorMonthlySpend,
  getVendorTopSpend,
  getVendorStatusMix,
  type OverviewOrdersByDept,
  type OverviewStatusEntry,
  type RequestsStatusDatum,
  type RequestsByDeptBar,
  type OrdersStatusDatum,
  type OrdersCategoryDatum,
  type OverviewInventoryKpis,
  type MonthlyStockMovements,
  type InventoryKpisSummary,
  type InventoryMovements,
  type InventoryStockStatusDatum,
  type InventoryWarehouseDatum,
  type VendorKpisSummary,
  type VendorMonthlySpend,
  type VendorTopSpendDatum,
  type VendorStatusMixDatum,
} from './facade';
import { fetchLiveWeather, weatherKey, type LiveWeatherSnapshot } from './weather';

const overviewKeys = {
  kpis: ['overview', 'kpis'] as const,
  charts: ['overview', 'charts'] as const,
  ordersByDept: ['overview', 'orders-by-dept'] as const,
};

const requestAnalyticsKeys = {
  status: ['requests', 'analytics', 'status'] as const,
  byDept: ['requests', 'analytics', 'by-dept'] as const,
};

const orderAnalyticsKeys = {
  status: ['orders', 'analytics', 'status'] as const,
  category: ['orders', 'analytics', 'category'] as const,
};

const inventoryKeys = {
  kpis: ['inventory', 'analytics', 'kpis'] as const,
  overviewKpis: ['overview', 'inventory', 'kpis'] as const,
  movements: ['inventory', 'activity', 'daily'] as const,
  monthlyMovements: ['overview', 'inventory', 'movements', 'monthly'] as const,
  stockStatus: ['inventory', 'analytics', 'stock-health'] as const,
  byWarehouse: (kind: 'raw' | 'finished') => ['inventory', 'analytics', 'by-warehouse', kind] as const,
};

const vendorKeys = {
  kpis: ['vendors', 'analytics', 'kpis-overview'] as const,
  monthlySpend: (year: number) => ['vendors', 'analytics', 'monthly-spend', year] as const,
  topSpend: (limit: number) => ['vendors', 'analytics', 'top-spend', limit] as const,
  statusMix: ['vendors', 'analytics', 'status-mix'] as const,
};

const dailyBriefKeys = {
  weather: (latitude: number, longitude: number) => weatherKey(latitude, longitude),
};

const DEFAULT_STATUS: OverviewStatusEntry[] = [
  { name: 'New', value: 0 },
  { name: 'Approved', value: 0 },
  { name: 'Rejected', value: 0 },
  { name: 'OnHold', value: 0 },
  { name: 'Closed', value: 0 },
];

const EMPTY_REQUESTS = {
  total: 0,
  statusCounts: DEFAULT_STATUS,
  byDepartment: [] as { name: string; value: number }[],
  priorityCounts: [] as { name: string; value: number }[],
};

const EMPTY_ORDERS = {
  total: 0,
  statusCounts: DEFAULT_STATUS,
  monthlyExpenses: [] as Array<{ month: string; totalSar: number }> ,
  byCategory: [] as Array<{ category: string; totalSar: number }> ,
  twelveMonthSpend: 0,
};

export function useOverviewKpis() {
  const query = useQuery({
    queryKey: overviewKeys.kpis,
    queryFn: fetchOverviewKpis,
  });

  return {
    data: query.data ?? {
      requests: EMPTY_REQUESTS,
      orders: EMPTY_ORDERS,
      inventory: { lowStock: 0, outOfStock: 0, inventoryValue: 0, totalItems: 0, stores: [] },
      vendors: { total: 0, active: 0, onHold: 0, newThisMonth: 0, totalSpend: 0 },
      fleet: { total: 0, inOperation: 0, underMaintenance: 0, totalDistance: 0 },
    },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useOverviewCharts() {
  const query = useQuery({
    queryKey: overviewKeys.charts,
    queryFn: fetchOverviewCharts,
  });

  return {
    data: query.data ?? { datasets: [] },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useOverviewOrdersByDept() {
  return useQuery<OverviewOrdersByDept>({
    queryKey: overviewKeys.ordersByDept,
    queryFn: fetchOverviewOrdersByDept,
  });
}

export function useRequestsStatusPie() {
  const query = useQuery<RequestsStatusDatum[]>({
    queryKey: requestAnalyticsKeys.status,
    queryFn: getRequestsStatusPie,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useRequestsByDeptBar() {
  const query = useQuery<RequestsByDeptBar>({
    queryKey: requestAnalyticsKeys.byDept,
    queryFn: getRequestsByDeptBar,
  });

  return {
    data: query.data ?? { categories: [], series: [{ name: 'Requests', data: [] }] },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useOrdersStatusPie() {
  const query = useQuery<OrdersStatusDatum[]>({
    queryKey: orderAnalyticsKeys.status,
    queryFn: getOrdersStatusPie,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useOrdersCategoryPie() {
  const query = useQuery<OrdersCategoryDatum[]>({
    queryKey: orderAnalyticsKeys.category,
    queryFn: getOrdersCategoryPie,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useLiveWeather(params: {
  latitude?: number | null;
  longitude?: number | null;
  enabled?: boolean;
}) {
  const { latitude, longitude, enabled = true } = params;
  const lat = typeof latitude === 'number' ? latitude : 0;
  const lon = typeof longitude === 'number' ? longitude : 0;
  const shouldEnable = enabled && typeof latitude === 'number' && typeof longitude === 'number';

  const query = useQuery<LiveWeatherSnapshot, Error, LiveWeatherSnapshot, ReturnType<typeof weatherKey>>({
    queryKey: dailyBriefKeys.weather(lat, lon),
    queryFn: fetchLiveWeather,
    enabled: shouldEnable,
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 10,
    retry: 2,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useInventoryKpis() {
  const query = useQuery<InventoryKpisSummary>({
    queryKey: inventoryKeys.kpis,
    queryFn: getInventoryKpis,
  });

  return {
    data: query.data ?? { lowStock: 0, outOfStock: 0, inventoryValue: 0, totalItems: 0, stores: [] },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useOverviewInventoryKpis() {
  const query = useQuery<OverviewInventoryKpis>({
    queryKey: inventoryKeys.overviewKpis,
    queryFn: getOverviewInventoryKpis,
  });

  return {
    data: query.data ?? {
      inStockQty: 0,
      lowStockAlerts: 0,
      outOfStockSkus: 0,
      inventoryValueSar: 0,
      stockStatus: [],
      stores: [],
    },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useMonthlyStockMovements() {
  const query = useQuery<MonthlyStockMovements>({
    queryKey: inventoryKeys.monthlyMovements,
    queryFn: getMonthlyStockMovements,
  });

  return {
    data: query.data ?? { months: [], inbound: [], outbound: [], inboundValue: [], outboundValue: [], stores: [] },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useInventoryMovements(year?: number) {
  void year;
  const query = useQuery<InventoryMovements>({
    queryKey: inventoryKeys.movements,
    queryFn: () => getInventoryMovements(),
  });

  return {
    data: query.data ?? { categories: [], series: [] },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useInventoryStockStatus() {
  const query = useQuery<InventoryStockStatusDatum[]>({
    queryKey: inventoryKeys.stockStatus,
    queryFn: getInventoryStockStatus,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useInventoryByWarehouse(kind: 'raw' | 'finished') {
  const query = useQuery<InventoryWarehouseDatum[]>({
    queryKey: inventoryKeys.byWarehouse(kind),
    queryFn: () => getInventoryByWarehouse(kind),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useVendorKpis() {
  const query = useQuery<VendorKpisSummary>({
    queryKey: vendorKeys.kpis,
    queryFn: getVendorKpis,
  });

  return {
    data: query.data ?? { active: 0, newThisMonth: 0, avgTrustScore: 0, totalSpend: 0 },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useVendorMonthlySpend(year?: number) {
  const targetYear = Number.isFinite(year) ? Number(year) : new Date().getFullYear();
  const query = useQuery<VendorMonthlySpend>({
    queryKey: vendorKeys.monthlySpend(targetYear),
    queryFn: () => getVendorMonthlySpend(targetYear),
  });

  return {
    data: query.data ?? { categories: [], series: [] },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useVendorTopSpend(limit = 10) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 50) : 10;
  const query = useQuery<VendorTopSpendDatum[]>({
    queryKey: vendorKeys.topSpend(safeLimit),
    queryFn: () => getVendorTopSpend(safeLimit),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useVendorStatusMix() {
  const query = useQuery<VendorStatusMixDatum[]>({
    queryKey: vendorKeys.statusMix,
    queryFn: getVendorStatusMix,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
