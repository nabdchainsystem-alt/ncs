import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/api';
import { adaptInventoryItems, type InventoryTableItem } from './items/adapters';

import {
  getActivityByTypePie,
  getActivityKpis,
  getCapacityVsUsedBar,
  getCriticalByCategoryPie,
  getCriticalByWarehouseBar,
  getCriticalKpis,
  getDailyMovementsBar,
  getExcessByCategoryPie,
  getInventoryItemsFromOrders,
  getInventoryKpis,
  getItemsByWarehouseBar,
  getRecentMovementsTable,
  getSlowExcessKpis,
  getStockHealthPie,
  getTopSlowMovingBar,
  getUtilizationKpis,
  getUtilizationSharePie,
  getValueByCategoryBar,
} from './facade';
import {
  type InventoryItemsFromOrdersParams,
  type InventoryItemsFromOrdersRow,
  type PaginatedResponse,
  type RecentMovementsParams,
  type RecentMovementRow,
} from './types';

const inventoryKeys = {
  kpis: ['inventory', 'kpis'] as const,
  stockHealth: ['inventory', 'stock-health'] as const,
  itemsByWarehouse: ['inventory', 'items-by-warehouse'] as const,
  valueByCategory: ['inventory', 'value-by-category'] as const,
  criticalKpis: ['inventory', 'critical-kpis'] as const,
  criticalByCategory: ['inventory', 'critical-by-category'] as const,
  criticalByWarehouse: ['inventory', 'critical-by-warehouse'] as const,
  slowExcessKpis: ['inventory', 'slow-excess-kpis'] as const,
  excessByCategory: ['inventory', 'excess-by-category'] as const,
  topSlowMoving: ['inventory', 'top-slow-moving'] as const,
  activityKpis: ['inventory', 'activity', 'kpis'] as const,
  activityByType: ['inventory', 'activity', 'by-type'] as const,
  dailyMovements: ['inventory', 'activity', 'daily'] as const,
  recentMovements: (params: RecentMovementsParams) => [
    'inventory',
    'activity',
    'recent',
    params.page,
    params.pageSize,
    params.type ?? '',
    params.warehouse ?? '',
    params.store ?? '',
    params.sortBy ?? 'date',
    params.sortDir ?? 'desc',
  ] as const,
  utilizationKpis: ['inventory', 'utilization', 'kpis'] as const,
  utilizationShare: ['inventory', 'utilization', 'share'] as const,
  capacityVsUsed: ['inventory', 'utilization', 'capacity-vs-used'] as const,
  itemsFromOrders: (params: InventoryItemsFromOrdersParams) => [
    'inventory',
    'orders-items',
    params.page,
    params.pageSize,
    params.status ?? '',
    params.warehouse ?? '',
    params.category ?? '',
    params.q ?? '',
  ] as const,
  allItems: ['inventory', 'items', 'all'] as const,
  allTableItems: ['inventory', 'items', 'all', 'table'] as const,
};

export function useInventoryKpis() {
  return useQuery({
    queryKey: inventoryKeys.kpis,
    queryFn: getInventoryKpis,
  });
}

export function useStockHealthPie() {
  return useQuery({
    queryKey: inventoryKeys.stockHealth,
    queryFn: getStockHealthPie,
  });
}

export function useItemsByWarehouseBar() {
  return useQuery({
    queryKey: inventoryKeys.itemsByWarehouse,
    queryFn: getItemsByWarehouseBar,
  });
}

export function useValueByCategoryBar() {
  return useQuery({
    queryKey: inventoryKeys.valueByCategory,
    queryFn: getValueByCategoryBar,
  });
}

export function useCriticalKpis() {
  return useQuery({
    queryKey: inventoryKeys.criticalKpis,
    queryFn: getCriticalKpis,
  });
}

export function useCriticalByCategoryPie() {
  return useQuery({
    queryKey: inventoryKeys.criticalByCategory,
    queryFn: getCriticalByCategoryPie,
  });
}

export function useCriticalByWarehouseBar() {
  return useQuery({
    queryKey: inventoryKeys.criticalByWarehouse,
    queryFn: getCriticalByWarehouseBar,
  });
}

export function useSlowExcessKpis() {
  return useQuery({
    queryKey: inventoryKeys.slowExcessKpis,
    queryFn: getSlowExcessKpis,
  });
}

export function useExcessByCategoryPie() {
  return useQuery({
    queryKey: inventoryKeys.excessByCategory,
    queryFn: getExcessByCategoryPie,
  });
}

export function useTopSlowMovingBar() {
  return useQuery({
    queryKey: inventoryKeys.topSlowMoving,
    queryFn: getTopSlowMovingBar,
  });
}

export function useInventoryActivityKpis() {
  return useQuery({
    queryKey: inventoryKeys.activityKpis,
    queryFn: getActivityKpis,
  });
}

export function useActivityByTypePie() {
  return useQuery({
    queryKey: inventoryKeys.activityByType,
    queryFn: getActivityByTypePie,
  });
}

export function useDailyMovementsBar() {
  return useQuery({
    queryKey: inventoryKeys.dailyMovements,
    queryFn: getDailyMovementsBar,
  });
}

export function useRecentMovements(params: RecentMovementsParams) {
  return useQuery<PaginatedResponse<RecentMovementRow>>({
    queryKey: inventoryKeys.recentMovements(params),
    queryFn: () => getRecentMovementsTable(params),
    placeholderData: (previous) => previous,
  });
}

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  category?: string | null;
  warehouse?: string | null;
  qty: number;
  unit?: string | null;
  valueSAR?: number | null;
  store?: string | null;
  storeId?: number | null;
};

function normalizeInventoryItem(raw: any): InventoryItem {
  const qtyValue = raw?.qty ?? raw?.qtyOnHand ?? raw?.quantity ?? 0;
  const warehouseName = typeof raw?.warehouse === 'string'
    ? raw.warehouse
    : raw?.warehouseLabel ?? raw?.warehouse?.name ?? raw?.warehouse?.code ?? null;
  const storeName = typeof raw?.store === 'string'
    ? raw.store
    : raw?.storeLabel ?? raw?.storeName ?? raw?.store?.name ?? raw?.store?.code ?? null;
  const storeId = Number(raw?.storeId);

  const fallbackId = raw?.id ?? raw?.itemCode ?? raw?.materialNo ?? raw?.code ?? `item-${Math.random().toString(36).slice(2)}`;
  const code = (raw?.itemCode ?? raw?.materialNo ?? raw?.code ?? fallbackId)?.toString() ?? '';
  return {
    id: String(fallbackId),
    code: String(code),
    name: String(raw?.itemDescription ?? raw?.name ?? raw?.materialNo ?? 'Unnamed item'),
    category: raw?.category ?? null,
    warehouse: warehouseName,
    qty: Number.isFinite(Number(qtyValue)) ? Number(qtyValue) : 0,
    unit: raw?.unit ?? null,
    valueSAR: raw?.valueSAR ?? raw?.valueSar ?? null,
    store: storeName,
    storeId: Number.isFinite(storeId) ? storeId : undefined,
  };
}

export function useAllInventoryItems() {
  return useQuery<InventoryItem[]>({
    queryKey: inventoryKeys.allItems,
    queryFn: async () => {
      try {
        const res = await apiClient.get<InventoryItem[]>('/api/inventory/items?all=1');
        if (Array.isArray(res.data)) {
          return res.data.map(normalizeInventoryItem);
        }
      } catch (error) {
        /* noop - fallback below */
      }

      const fallback = await apiClient.get<{ items?: any[] }>('/api/inventory/items?page=1&pageSize=5000');
      const rows = Array.isArray(fallback.data?.items) ? fallback.data?.items : [];
      return rows.map(normalizeInventoryItem);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useAllInventoryTableItems() {
  return useQuery<InventoryTableItem[]>({
    queryKey: inventoryKeys.allTableItems,
    queryFn: async () => {
      try {
        const primary = await apiClient.get<{ items?: unknown } | unknown[]>('/api/inventory/items?all=1');
        if (Array.isArray(primary.data)) {
          return adaptInventoryItems(primary.data as any[]);
        }
        if (primary.data && Array.isArray((primary.data as { items?: unknown }).items)) {
          return adaptInventoryItems(((primary.data as { items?: unknown }).items as any[]) ?? []);
        }
      } catch (error) {
        /* noop - fall through to fallback */
      }

      const fallback = await apiClient.get<{ items?: unknown[] }>('/api/inventory/items?page=1&pageSize=5000');
      const rows = Array.isArray(fallback.data?.items) ? fallback.data.items : [];
      return adaptInventoryItems(rows as any[]);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useUtilizationKpis() {
  return useQuery({
    queryKey: inventoryKeys.utilizationKpis,
    queryFn: getUtilizationKpis,
  });
}

export function useUtilizationSharePie() {
  return useQuery({
    queryKey: inventoryKeys.utilizationShare,
    queryFn: getUtilizationSharePie,
  });
}

export function useCapacityVsUsedBar() {
  return useQuery({
    queryKey: inventoryKeys.capacityVsUsed,
    queryFn: getCapacityVsUsedBar,
  });
}

export function useInventoryItemsFromOrders(params: InventoryItemsFromOrdersParams) {
  return useQuery<PaginatedResponse<InventoryItemsFromOrdersRow>>({
    queryKey: inventoryKeys.itemsFromOrders(params),
    queryFn: () => getInventoryItemsFromOrders(params),
    placeholderData: (previous) => previous,
  });
}
