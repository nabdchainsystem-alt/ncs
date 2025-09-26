import axios from 'axios';

import { apiClient, safeApiGet } from '../../lib/api';
import type { InventoryStoreSnapshot } from '../inventory/types';

export type OverviewStatusKey = 'New' | 'Approved' | 'Rejected' | 'OnHold' | 'Closed';

export type OverviewStatusEntry = { name: OverviewStatusKey; value: number };
export type OverviewCountEntry = { name: string; value: number };
export type RequestsStatusDatum = { name: string; value: number };
export type RequestsByDeptBar = {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
};
export type OrdersStatusDatum = { name: string; value: number };
export type OrdersCategoryDatum = { name: string; value: number };
export type InventoryKpisSummary = {
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  totalItems: number;
  stores: InventoryStoreSnapshot[];
};
export type InventoryStockStatusDatum = { name: string; value: number };
export type InventoryWarehouseDatum = { name: string; value: number };
export type InventoryMovements = {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
};
export type VendorKpisSummary = {
  active: number;
  newThisMonth: number;
  avgTrustScore: number;
  totalSpend: number;
};
export type VendorMonthlySpend = {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
};
export type VendorTopSpendDatum = { name: string; value: number };
export type VendorStatusMixDatum = { name: string; value: number };

const EMPTY_VENDOR_BAR: VendorMonthlySpend = { categories: [], series: [] };

export type OverviewRequestsSummary = {
  total: number;
  statusCounts: OverviewStatusEntry[];
  byDepartment: OverviewCountEntry[];
  priorityCounts: OverviewCountEntry[];
};

export type OverviewOrdersSummary = {
  total: number;
  statusCounts: OverviewStatusEntry[];
  monthlyExpenses: Array<{ month: string; totalSar: number }>;
  byCategory: Array<{ category: string; totalSar: number }>;
  twelveMonthSpend: number;
};

export type OverviewInventoryKpis = {
  inStockQty: number;
  lowStockAlerts: number;
  outOfStockSkus: number;
  inventoryValueSar: number;
  stockStatus: InventoryStockStatusDatum[];
  stores?: InventoryStoreSnapshot[];
};

export type MonthlyStoreMovement = {
  store: string;
  inboundValue: number;
  outboundValue: number;
};

export type MonthlyStockMovements = {
  months: string[];
  inbound: number[];
  outbound: number[];
  inboundValue: number[];
  outboundValue: number[];
  stores: MonthlyStoreMovement[];
};

export type OverviewKpis = {
  requests: OverviewRequestsSummary;
  orders: OverviewOrdersSummary;
  inventory: OverviewInventoryKpis;
  vendors: { total: number; active: number; onHold: number; newThisMonth: number; totalSpend: number };
  fleet: { total: number; inOperation: number; underMaintenance: number; totalDistance: number };
};

export type OverviewCharts = { datasets: unknown[] };

export type OverviewOrdersByDept = {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
};

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

const toArray = <T>(value: any, mapper: (entry: [string, any]) => T): T[] => {
  if (Array.isArray(value)) return value as T[];
  return Object.entries(value ?? {}).map((entry) => mapper(entry as [string, any]));
};

const ZERO_OVERVIEW_INVENTORY: OverviewInventoryKpis = {
  inStockQty: 0,
  lowStockAlerts: 0,
  outOfStockSkus: 0,
  inventoryValueSar: 0,
  stockStatus: [],
  stores: [],
};

const EMPTY_MOVEMENTS: InventoryMovements = { categories: [], series: [] };
const ZERO_INVENTORY_SUMMARY: InventoryKpisSummary = {
  lowStock: 0,
  outOfStock: 0,
  inventoryValue: 0,
  totalItems: 0,
  stores: [],
};

function coerceOverviewKpis(dto: any): OverviewKpis {
  const requestsRaw = dto?.requests ?? {};
  const ordersRaw = dto?.orders ?? {};

  const requests = {
    total: Number(requestsRaw.total ?? 0),
    statusCounts: toArray(requestsRaw.statusCounts, ([name, value]) => ({ name, value }))
      .map((entry) => ({ name: entry.name as OverviewStatusKey, value: Number(entry.value ?? 0) })),
    byDepartment: toArray(requestsRaw.byDepartment, ([name, value]) => ({ name, value }))
      .map((entry) => ({ name: String(entry.name), value: Number(entry.value ?? 0) })),
    priorityCounts: toArray(requestsRaw.priorityCounts, ([name, value]) => ({ name, value }))
      .map((entry) => ({ name: String(entry.name), value: Number(entry.value ?? 0) })),
  } satisfies OverviewKpis['requests'];

  const monthlyExpenses = Array.isArray(ordersRaw.monthlyExpenses)
    ? ordersRaw.monthlyExpenses.map((entry: any) => ({
        month: String(entry?.month ?? ''),
        totalSar: Number(entry?.totalSar ?? 0),
      }))
    : [];

  const byCategory = Array.isArray(ordersRaw.byCategory)
    ? ordersRaw.byCategory.map((entry: any) => ({
        category: String(entry?.category ?? 'Unassigned'),
        totalSar: Number(entry?.totalSar ?? 0),
      }))
    : [];

  const orders = {
    total: Number(ordersRaw.total ?? 0),
    statusCounts: toArray(ordersRaw.statusCounts, ([name, value]) => ({ name, value }))
      .map((entry) => ({ name: entry.name as OverviewStatusKey, value: Number(entry.value ?? 0) })),
    monthlyExpenses,
    byCategory,
    twelveMonthSpend: Number(ordersRaw.twelveMonthSpend ?? 0),
  } satisfies OverviewKpis['orders'];

  return {
    requests,
    orders,
    inventory: {
      inStockQty: Number(dto?.inventory?.inStockQty ?? dto?.inventory?.totalItems ?? 0),
      lowStockAlerts: Number(dto?.inventory?.lowStockAlerts ?? dto?.inventory?.lowStock ?? 0),
      outOfStockSkus: Number(dto?.inventory?.outOfStockSkus ?? dto?.inventory?.outOfStock ?? 0),
      inventoryValueSar: Number(dto?.inventory?.inventoryValueSar ?? dto?.inventory?.inventoryValue ?? 0),
      stockStatus: Array.isArray(dto?.inventory?.stockStatus)
        ? dto.inventory.stockStatus.map((entry: any) => ({
            name: String(entry?.name ?? ''),
            value: Number(entry?.value ?? 0),
          }))
        : [],
      stores: Array.isArray(dto?.inventory?.stores)
        ? dto.inventory.stores.map((store: any) => ({
            storeId: typeof store?.storeId === 'number' ? store.storeId : null,
            store: String(store?.store ?? 'Unassigned'),
            qty: Number(store?.qty ?? 0),
            value: Number(store?.value ?? 0),
            items: Number(store?.items ?? 0),
            lowStock: Number(store?.lowStock ?? 0),
            outOfStock: Number(store?.outOfStock ?? 0),
          }))
        : [],
    },
    vendors: {
      total: Number(dto?.vendors?.total ?? 0),
      active: Number(dto?.vendors?.active ?? 0),
      onHold: Number(dto?.vendors?.onHold ?? 0),
      newThisMonth: Number(dto?.vendors?.newThisMonth ?? 0),
      totalSpend: Number(dto?.vendors?.totalSpend ?? 0),
    },
    fleet: {
      total: Number(dto?.fleet?.total ?? 0),
      inOperation: Number(dto?.fleet?.inOperation ?? 0),
      underMaintenance: Number(dto?.fleet?.underMaintenance ?? 0),
      totalDistance: Number(dto?.fleet?.totalDistance ?? 0),
    },
  };
}

export async function fetchOverviewKpis(): Promise<OverviewKpis> {
  try {
    const { data } = await apiClient.get<OverviewKpis>('/api/overview/kpis');
    return coerceOverviewKpis(data);
  } catch (error) {
    if (isNotFound(error)) {
      return coerceOverviewKpis({
        requests: { total: 0, statusCounts: [], byDepartment: [], priorityCounts: [] },
        orders: { total: 0, statusCounts: [], monthlyExpenses: [], byCategory: [], twelveMonthSpend: 0 },
        inventory: ZERO_OVERVIEW_INVENTORY,
        vendors: { total: 0, active: 0, onHold: 0, newThisMonth: 0, totalSpend: 0 },
        fleet: { total: 0, inOperation: 0, underMaintenance: 0, totalDistance: 0 },
      });
    }
    throw error;
  }
}

export async function fetchOverviewCharts(): Promise<OverviewCharts> {
  try {
    const { data } = await apiClient.get<OverviewCharts>('/api/overview/charts');
    return data ?? { datasets: [] };
  } catch (error) {
    if (isNotFound(error)) {
      return { datasets: [] };
    }
    throw error;
  }
}

export async function fetchOverviewOrdersByDept(): Promise<OverviewOrdersByDept> {
  const fallback: OverviewOrdersByDept = { categories: [], series: [{ name: 'Spend (SAR)', data: [] }] };
  try {
    const { data } = await apiClient.get<OverviewOrdersByDept>('/api/overview/orders-by-dept');
    if (!data || !Array.isArray(data?.categories) || !Array.isArray(data?.series)) {
      return fallback;
    }
    return {
      categories: data.categories,
      series: data.series.map((serie) => ({
        name: String(serie?.name ?? 'Spend (SAR)'),
        data: Array.isArray(serie?.data) ? serie.data.map((value) => Number(value ?? 0)) : [],
      })),
    };
  } catch (error) {
    if (isNotFound(error)) return fallback;
    throw error;
  }
}

export async function getOverviewInventoryKpis(): Promise<OverviewInventoryKpis> {
  try {
    const { data } = await apiClient.get<OverviewKpis>('/api/overview/kpis');
    const coerced = coerceOverviewKpis(data);
    return coerced.inventory ?? ZERO_OVERVIEW_INVENTORY;
  } catch (error) {
    if (isNotFound(error)) return ZERO_OVERVIEW_INVENTORY;
    throw error;
  }
}

export async function getMonthlyStockMovements(): Promise<MonthlyStockMovements> {
  try {
    const { data } = await apiClient.get<MonthlyStockMovements>('/api/overview/stock-movements/monthly');
    if (!data) {
      return { months: [], inbound: [], outbound: [], inboundValue: [], outboundValue: [], stores: [] };
    }
    return {
      months: Array.isArray(data.months) ? data.months.map((label) => String(label ?? '')) : [],
      inbound: Array.isArray(data.inbound) ? data.inbound.map((value) => Number(value ?? 0)) : [],
      outbound: Array.isArray(data.outbound) ? data.outbound.map((value) => Number(value ?? 0)) : [],
      inboundValue: Array.isArray(data.inboundValue) ? data.inboundValue.map((value) => Number(value ?? 0)) : [],
      outboundValue: Array.isArray(data.outboundValue) ? data.outboundValue.map((value) => Number(value ?? 0)) : [],
      stores: Array.isArray(data.stores)
        ? data.stores.map((entry) => ({
            store: String(entry?.store ?? 'Unassigned'),
            inboundValue: Number(entry?.inboundValue ?? 0),
            outboundValue: Number(entry?.outboundValue ?? 0),
          }))
        : [],
    };
  } catch (error) {
    if (isNotFound(error)) {
      return { months: [], inbound: [], outbound: [], inboundValue: [], outboundValue: [], stores: [] };
    }
    throw error;
  }
}

export async function getRequestsStatusPie(): Promise<RequestsStatusDatum[]> {
  try {
    const { data } = await apiClient.get<RequestsStatusDatum[]>('/api/requests/analytics/status');
    if (!Array.isArray(data)) return [];
    return data.map((entry) => ({
      name: String(entry?.name ?? ''),
      value: Number(entry?.value ?? 0),
    }));
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function getRequestsByDeptBar(): Promise<RequestsByDeptBar> {
  const fallback: RequestsByDeptBar = { categories: [], series: [{ name: 'Requests', data: [] }] };
  try {
    const { data } = await apiClient.get<RequestsByDeptBar>('/api/requests/analytics/by-dept');
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.series)) return fallback;
    return {
      categories: data.categories,
      series: data.series.map((serie) => ({
        name: String(serie?.name ?? 'Requests'),
        data: Array.isArray(serie?.data) ? serie.data.map((value) => Number(value ?? 0)) : [],
      })),
    };
  } catch (error) {
    if (isNotFound(error)) return fallback;
    throw error;
  }
}

export async function getOrdersStatusPie(): Promise<OrdersStatusDatum[]> {
  try {
    const { data } = await apiClient.get<OrdersStatusDatum[]>('/api/orders/analytics/status');
    if (!Array.isArray(data)) return [];
    return data.map((entry) => ({
      name: String(entry?.name ?? ''),
      value: Number(entry?.value ?? 0),
    }));
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function getOrdersCategoryPie(): Promise<OrdersCategoryDatum[]> {
  try {
    const { data } = await apiClient.get<OrdersCategoryDatum[]>('/api/orders/analytics/by-category');
    if (!Array.isArray(data)) return [];
    return data.map((entry) => ({
      name: String(entry?.name ?? ''),
      value: Number(entry?.value ?? 0),
    }));
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function getInventoryKpis(): Promise<InventoryKpisSummary> {
  const data = await safeApiGet<InventoryKpisSummary>('/api/inventory/kpis', ZERO_INVENTORY_SUMMARY);
  return {
    lowStock: Number(data?.lowStock ?? 0),
    outOfStock: Number(data?.outOfStock ?? 0),
    inventoryValue: Number(data?.inventoryValue ?? 0),
    totalItems: Number(data?.totalItems ?? 0),
    stores: Array.isArray(data?.stores)
      ? data.stores.map((store) => ({
          storeId: typeof store?.storeId === 'number' ? store.storeId : null,
          store: String(store?.store ?? 'Unassigned'),
          qty: Number(store?.qty ?? 0),
          value: Number(store?.value ?? 0),
          items: Number(store?.items ?? 0),
          lowStock: Number(store?.lowStock ?? 0),
          outOfStock: Number(store?.outOfStock ?? 0),
        }))
      : [],
  };
}

export async function getInventoryMovements(year?: number): Promise<InventoryMovements> {
  void year;
  const data = await safeApiGet<InventoryMovements>('/api/inventory/activity/daily', EMPTY_MOVEMENTS);
  if (!data) return { categories: [], series: [] };
  const categories = Array.isArray(data.categories) ? data.categories.map((label) => String(label ?? '')) : [];
  const series = Array.isArray(data.series)
    ? data.series.map((serie) => ({
        name: String(serie?.name ?? ''),
        data: Array.isArray(serie?.data) ? serie.data.map((value) => Number(value ?? 0)) : [],
      }))
    : [];
  return { categories, series };
}

export async function getInventoryStockStatus(): Promise<InventoryStockStatusDatum[]> {
  const data = await safeApiGet<InventoryStockStatusDatum[]>('/api/inventory/analytics/stock-health', []);
  if (!Array.isArray(data)) return [];
  return data.map((entry) => ({
    name: String(entry?.name ?? ''),
    value: Number(entry?.value ?? 0),
  }));
}

export async function getInventoryByWarehouse(kind: 'raw' | 'finished'): Promise<InventoryWarehouseDatum[]> {
  const data = await safeApiGet<InventoryWarehouseDatum[]>(`/api/inventory/analytics/by-warehouse?kind=${encodeURIComponent(kind)}`, []);
  if (!Array.isArray(data)) return [];
  return data.map((entry) => ({
    name: String(entry?.name ?? ''),
    value: Number(entry?.value ?? 0),
  }));
}

export async function getVendorKpis(): Promise<VendorKpisSummary> {
  const data = await safeApiGet<VendorKpisSummary>('/api/vendors/kpis', {
    active: 0,
    newThisMonth: 0,
    avgTrustScore: 0,
    totalSpend: 0,
  });
  return {
    active: Number(data?.active ?? 0),
    newThisMonth: Number(data?.newThisMonth ?? 0),
    avgTrustScore: Number(data?.avgTrustScore ?? 0),
    totalSpend: Number(data?.totalSpend ?? 0),
  };
}

export async function getVendorMonthlySpend(year?: number): Promise<VendorMonthlySpend> {
  const params = new URLSearchParams();
  if (year && Number.isFinite(year)) params.set('year', String(year));
  const path = `/api/vendors/analytics/monthly-spend${params.size ? `?${params.toString()}` : ''}`;
  const data = await safeApiGet<VendorMonthlySpend>(path, EMPTY_VENDOR_BAR);
  if (!data) return { categories: [], series: [] };
  const categories = Array.isArray(data.categories) ? data.categories.map((label) => String(label ?? '')) : [];
  const series = Array.isArray(data.series)
    ? data.series.map((serie) => ({
        name: String(serie?.name ?? 'Spend (SAR)'),
        data: Array.isArray(serie?.data) ? serie.data.map((value) => Number(value ?? 0)) : [],
      }))
    : [];
  return { categories, series };
}

export async function getVendorTopSpend(limit = 10): Promise<VendorTopSpendDatum[]> {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 50) : 10;
  const data = await safeApiGet<VendorTopSpendDatum[]>(`/api/vendors/analytics/top-spend?limit=${safeLimit}`, []);
  if (!Array.isArray(data)) return [];
  return data.map((entry) => ({
    name: String(entry?.name ?? ''),
    value: Number(entry?.value ?? 0),
  }));
}

export async function getVendorStatusMix(): Promise<VendorStatusMixDatum[]> {
  const data = await safeApiGet<VendorStatusMixDatum[]>('/api/vendors/analytics/status-mix', []);
  if (!Array.isArray(data)) return [];
  return data.map((entry) => ({
    name: String(entry?.name ?? ''),
    value: Number(entry?.value ?? 0),
  }));
}
