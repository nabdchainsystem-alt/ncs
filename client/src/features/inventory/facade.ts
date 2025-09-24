import { safeApiGet } from '../../lib/api';
import type { InventoryItemDTO } from '../../lib/api';
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

const EMPTY_BAR: BarChartResponse = { categories: [], series: [] };
const EMPTY_PIE: PieDatum[] = [];
const EMPTY_RECENT: PaginatedResponse<RecentMovementRow> = { items: [], total: 0 };
const ZERO_INVENTORY_KPIS: InventoryKpis = { lowStock: 0, outOfStock: 0, inventoryValue: 0, totalItems: 0 };
const ZERO_CRITICAL_KPIS: CriticalKpis = { criticalItems: 0, criticalOOS: 0, criticalLow: 0, linkedRequests: 0 };
const ZERO_SLOW_EXCESS: SlowExcessKpis = { slowCount: 0, slowValue: 0, excessCount: 0, excessValue: 0 };
const ZERO_ACTIVITY_KPIS: ActivityKpis = { inboundToday: 0, outboundToday: 0, transfersToday: 0, movementValue: 0 };
const ZERO_UTILIZATION: UtilizationKpis = {
  totalCapacity: 0,
  usedCapacity: 0,
  freeCapacity: 0,
  utilizationPct: 0,
};
const EMPTY_ITEMS_RESPONSE = {
  items: [] as InventoryItemDTO[],
  total: 0,
  page: 1,
  pageSize: 0,
};

export async function getInventoryKpis(): Promise<InventoryKpis> {
  const data = await safeApiGet<InventoryKpis>('/api/inventory/kpis', ZERO_INVENTORY_KPIS);
  return {
    lowStock: ensureNumber(data?.lowStock),
    outOfStock: ensureNumber(data?.outOfStock),
    inventoryValue: ensureNumber(data?.inventoryValue),
    totalItems: ensureNumber(data?.totalItems),
  };
}

export async function getStockHealthPie(): Promise<PieDatum[]> {
  const data = await safeApiGet<PieDatum[]>('/api/inventory/analytics/stock-health', EMPTY_PIE);
  return sanitizePie(data);
}

export async function getItemsByWarehouseBar(): Promise<BarChartResponse> {
  const data = await safeApiGet<BarChartResponse>('/api/inventory/analytics/items-by-warehouse', EMPTY_BAR);
  return sanitizeBar(data);
}

export async function getValueByCategoryBar(): Promise<BarChartResponse> {
  const data = await safeApiGet<BarChartResponse>('/api/inventory/analytics/value-by-category', EMPTY_BAR);
  return sanitizeBar(data);
}

export async function getCriticalKpis(): Promise<CriticalKpis> {
  const data = await safeApiGet<CriticalKpis>('/api/inventory/analytics/critical-kpis', ZERO_CRITICAL_KPIS);
  return {
    criticalItems: ensureNumber(data?.criticalItems),
    criticalOOS: ensureNumber(data?.criticalOOS),
    criticalLow: ensureNumber(data?.criticalLow),
    linkedRequests: ensureNumber(data?.linkedRequests),
  };
}

export async function getCriticalByCategoryPie(): Promise<PieDatum[]> {
  const data = await safeApiGet<PieDatum[]>('/api/inventory/analytics/critical-by-category', EMPTY_PIE);
  return sanitizePie(data);
}

export async function getCriticalByWarehouseBar(): Promise<BarChartResponse> {
  const data = await safeApiGet<BarChartResponse>('/api/inventory/analytics/critical-by-warehouse', EMPTY_BAR);
  return sanitizeBar(data);
}

export async function getSlowExcessKpis(): Promise<SlowExcessKpis> {
  const data = await safeApiGet<SlowExcessKpis>('/api/inventory/analytics/slow-excess-kpis', ZERO_SLOW_EXCESS);
  return {
    slowCount: ensureNumber(data?.slowCount),
    slowValue: ensureNumber(data?.slowValue),
    excessCount: ensureNumber(data?.excessCount),
    excessValue: ensureNumber(data?.excessValue),
  };
}

export async function getExcessByCategoryPie(): Promise<PieDatum[]> {
  const data = await safeApiGet<PieDatum[]>('/api/inventory/analytics/excess-by-category', EMPTY_PIE);
  return sanitizePie(data);
}

export async function getTopSlowMovingBar(): Promise<BarChartResponse> {
  const data = await safeApiGet<BarChartResponse>('/api/inventory/analytics/top-slow-moving', EMPTY_BAR);
  return sanitizeBar(data);
}

export async function getActivityKpis(): Promise<ActivityKpis> {
  const data = await safeApiGet<ActivityKpis>('/api/inventory/activity/kpis', ZERO_ACTIVITY_KPIS);
  return {
    inboundToday: ensureNumber(data?.inboundToday),
    outboundToday: ensureNumber(data?.outboundToday),
    transfersToday: ensureNumber(data?.transfersToday),
    movementValue: ensureNumber(data?.movementValue),
  };
}

export async function getActivityByTypePie(): Promise<PieDatum[]> {
  const data = await safeApiGet<PieDatum[]>('/api/inventory/activity/by-type', EMPTY_PIE);
  return sanitizePie(data);
}

export async function getDailyMovementsBar(): Promise<BarChartResponse> {
  const data = await safeApiGet<BarChartResponse>('/api/inventory/activity/daily', EMPTY_BAR);
  return sanitizeBar(data);
}

export async function getRecentMovementsTable(params: RecentMovementsParams): Promise<PaginatedResponse<RecentMovementRow>> {
  const query = buildQuery(params);
  const data = await safeApiGet<PaginatedResponse<RecentMovementRow>>(`/api/inventory/activity/recent${query}`, EMPTY_RECENT);
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
}

export async function getUtilizationKpis(): Promise<UtilizationKpis> {
  const data = await safeApiGet<UtilizationKpis>('/api/inventory/utilization/kpis', ZERO_UTILIZATION);
  return {
    totalCapacity: ensureNumber(data?.totalCapacity),
    usedCapacity: ensureNumber(data?.usedCapacity),
    freeCapacity: ensureNumber(data?.freeCapacity),
    utilizationPct: ensureNumber(data?.utilizationPct),
  };
}

export async function getUtilizationSharePie(): Promise<PieDatum[]> {
  const data = await safeApiGet<PieDatum[]>('/api/inventory/utilization/share', EMPTY_PIE);
  return sanitizePie(data);
}

export async function getCapacityVsUsedBar(): Promise<BarChartResponse> {
  const data = await safeApiGet<BarChartResponse>('/api/inventory/utilization/capacity-vs-used', EMPTY_BAR);
  return sanitizeBar(data);
}

export async function getInventoryItemsFromOrders(params: InventoryItemsFromOrdersParams): Promise<PaginatedResponse<InventoryItemsFromOrdersRow>> {
  const queryParams: Record<string, unknown> = {
    page: params.page,
    pageSize: params.pageSize,
  };
  if (params.q) queryParams.search = params.q;
  if (params.status === 'low-stock') queryParams.lowStockOnly = true;
  if (params.status === 'out-of-stock') queryParams.status = 'out-of-stock';
  if (params.warehouse) queryParams.warehouse = params.warehouse;
  if (params.category) queryParams.category = params.category;

  const data = await safeApiGet<typeof EMPTY_ITEMS_RESPONSE>(`/api/inventory/items${buildQuery(queryParams)}`, EMPTY_ITEMS_RESPONSE);
  const rows = Array.isArray(data?.items) ? data.items : [];

  const mapped = rows.map((item) => {
    const qty = ensureNumber(item?.qtyOnHand);
    const reorder = ensureNumber(item?.reorderPoint);
    const status = qty <= 0 ? 'out-of-stock' : qty <= reorder ? 'low-stock' : 'in-stock';
    return {
      code: ensureString(item?.materialNo, 'N/A'),
      name: ensureString(item?.name, 'Unnamed Item'),
      category: ensureString(item?.category, 'Uncategorized'),
      warehouse: ensureString(item?.warehouse?.name ?? item?.warehouse?.code, 'Unassigned'),
      qty,
      reorder,
      value: 0,
      status,
      ageDays: null,
    } satisfies InventoryItemsFromOrdersRow;
  });

  const filtered = (() => {
    if (!params.status || params.status === 'all') return mapped;
    return mapped.filter((row) => row.status === params.status);
  })();

  const total = params.status === 'in-stock'
    ? filtered.length
    : ensureNumber(data?.total);

  return {
    items: filtered,
    total,
  };
}
