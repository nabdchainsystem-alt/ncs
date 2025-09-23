import { useQuery } from '@tanstack/react-query';

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
