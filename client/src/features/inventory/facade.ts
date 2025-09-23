import axios from 'axios';

import { apiClient } from '../../lib/api';
import {
  type ActivityKpis,
  type BarChartResponse,
  type CriticalKpis,
  type InventoryItemsFromOrdersParams,
  type InventoryItemsFromOrdersRow,
  type InventoryKpis,
  type PaginatedResponse,
  type PieDatum,
  type RecentMovementRow,
  type RecentMovementsParams,
  type SlowExcessKpis,
  type UtilizationKpis,
} from './types';

function ensureNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function ensureString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function sanitizePie(data: unknown): PieDatum[] {
  if (!Array.isArray(data)) return [];
  return data.map((entry) => ({
    name: ensureString((entry as PieDatum)?.name, 'Unknown'),
    value: ensureNumber((entry as PieDatum)?.value),
  }));
}

function sanitizeBar(data: unknown): BarChartResponse {
  const categories = Array.isArray((data as BarChartResponse)?.categories)
    ? ((data as BarChartResponse).categories ?? []).map((item) => ensureString(item))
    : [];
  const rawSeries = Array.isArray((data as BarChartResponse)?.series)
    ? (data as BarChartResponse).series
    : [];
  const series = rawSeries.map((seriesEntry) => ({
    name: ensureString(seriesEntry?.name, 'Series'),
    data: Array.isArray(seriesEntry?.data)
      ? seriesEntry.data.map((value: unknown) => ensureNumber(value))
      : [],
  }));
  return { categories, series };
}

function buildQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    const stringValue = typeof value === 'string' ? value : String(value);
    searchParams.append(key, stringValue);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getInventoryKpis(): Promise<InventoryKpis> {
  const { data } = await apiClient.get<InventoryKpis>('/api/inventory/kpis');
  return {
    lowStock: ensureNumber(data?.lowStock),
    outOfStock: ensureNumber(data?.outOfStock),
    inventoryValue: ensureNumber(data?.inventoryValue),
    totalItems: ensureNumber(data?.totalItems),
  };
}

export async function getStockHealthPie(): Promise<PieDatum[]> {
  const { data } = await apiClient.get<PieDatum[]>('/api/inventory/analytics/stock-health');
  return sanitizePie(data);
}

export async function getItemsByWarehouseBar(): Promise<BarChartResponse> {
  const { data } = await apiClient.get<BarChartResponse>('/api/inventory/analytics/items-by-warehouse');
  return sanitizeBar(data);
}

export async function getValueByCategoryBar(): Promise<BarChartResponse> {
  const { data } = await apiClient.get<BarChartResponse>('/api/inventory/analytics/value-by-category');
  return sanitizeBar(data);
}

export async function getCriticalKpis(): Promise<CriticalKpis> {
  const { data } = await apiClient.get<CriticalKpis>('/api/inventory/analytics/critical-kpis');
  return {
    criticalItems: ensureNumber(data?.criticalItems),
    criticalOOS: ensureNumber(data?.criticalOOS),
    criticalLow: ensureNumber(data?.criticalLow),
    linkedRequests: ensureNumber(data?.linkedRequests),
  };
}

export async function getCriticalByCategoryPie(): Promise<PieDatum[]> {
  const { data } = await apiClient.get<PieDatum[]>('/api/inventory/analytics/critical-by-category');
  return sanitizePie(data);
}

export async function getCriticalByWarehouseBar(): Promise<BarChartResponse> {
  const { data } = await apiClient.get<BarChartResponse>('/api/inventory/analytics/critical-by-warehouse');
  return sanitizeBar(data);
}

export async function getSlowExcessKpis(): Promise<SlowExcessKpis> {
  const { data } = await apiClient.get<SlowExcessKpis>('/api/inventory/analytics/slow-excess-kpis');
  return {
    slowCount: ensureNumber(data?.slowCount),
    slowValue: ensureNumber(data?.slowValue),
    excessCount: ensureNumber(data?.excessCount),
    excessValue: ensureNumber(data?.excessValue),
  };
}

export async function getExcessByCategoryPie(): Promise<PieDatum[]> {
  const { data } = await apiClient.get<PieDatum[]>('/api/inventory/analytics/excess-by-category');
  return sanitizePie(data);
}

export async function getTopSlowMovingBar(): Promise<BarChartResponse> {
  const { data } = await apiClient.get<BarChartResponse>('/api/inventory/analytics/top-slow-moving');
  return sanitizeBar(data);
}

export async function getActivityKpis(): Promise<ActivityKpis> {
  const { data } = await apiClient.get<ActivityKpis>('/api/inventory/activity/kpis');
  return {
    inboundToday: ensureNumber(data?.inboundToday),
    outboundToday: ensureNumber(data?.outboundToday),
    transfersToday: ensureNumber(data?.transfersToday),
    movementValue: ensureNumber(data?.movementValue),
  };
}

export async function getActivityByTypePie(): Promise<PieDatum[]> {
  const { data } = await apiClient.get<PieDatum[]>('/api/inventory/activity/by-type');
  return sanitizePie(data);
}

export async function getDailyMovementsBar(): Promise<BarChartResponse> {
  const { data } = await apiClient.get<BarChartResponse>('/api/inventory/activity/daily');
  return sanitizeBar(data);
}

export async function getRecentMovementsTable(params: RecentMovementsParams): Promise<PaginatedResponse<RecentMovementRow>> {
  const query = buildQuery(params);
  try {
    const { data } = await apiClient.get<PaginatedResponse<RecentMovementRow>>(`/api/inventory/activity/recent${query}`);
    return {
      items: Array.isArray(data?.items) ? data.items.map((row) => ({
        date: ensureString(row?.date),
        item: ensureString(row?.item, 'Unknown Item'),
        warehouse: ensureString(row?.warehouse, 'Unassigned'),
        type: ensureString(row?.type, 'Other'),
        qty: ensureNumber(row?.qty),
        value: ensureNumber(row?.value),
      })) : [],
      total: ensureNumber(data?.total),
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { items: [], total: 0 };
    }
    throw error;
  }
}

export async function getUtilizationKpis(): Promise<UtilizationKpis> {
  const { data } = await apiClient.get<UtilizationKpis>('/api/inventory/utilization/kpis');
  return {
    totalCapacity: ensureNumber(data?.totalCapacity),
    usedCapacity: ensureNumber(data?.usedCapacity),
    freeCapacity: ensureNumber(data?.freeCapacity),
    utilizationPct: ensureNumber(data?.utilizationPct),
  };
}

export async function getUtilizationSharePie(): Promise<PieDatum[]> {
  const { data } = await apiClient.get<PieDatum[]>('/api/inventory/utilization/share');
  return sanitizePie(data);
}

export async function getCapacityVsUsedBar(): Promise<BarChartResponse> {
  const { data } = await apiClient.get<BarChartResponse>('/api/inventory/utilization/capacity-vs-used');
  return sanitizeBar(data);
}

export async function getInventoryItemsFromOrders(params: InventoryItemsFromOrdersParams): Promise<PaginatedResponse<InventoryItemsFromOrdersRow>> {
  const query = buildQuery(params);
  const { data } = await apiClient.get<PaginatedResponse<InventoryItemsFromOrdersRow>>(`/api/inventory/items-from-orders${query}`);
  return {
    items: Array.isArray(data?.items) ? data.items.map((row) => ({
      code: ensureString(row?.code, 'N/A'),
      name: ensureString(row?.name, 'Unnamed Item'),
      category: ensureString(row?.category, 'Uncategorized'),
      warehouse: ensureString(row?.warehouse, 'Unassigned'),
      qty: ensureNumber(row?.qty),
      reorder: ensureNumber(row?.reorder),
      value: ensureNumber(row?.value),
      status: ensureString(row?.status, 'Unknown'),
      ageDays: typeof row?.ageDays === 'number' && Number.isFinite(row.ageDays) ? row.ageDays : null,
    })) : [],
    total: ensureNumber(data?.total),
  };
}
