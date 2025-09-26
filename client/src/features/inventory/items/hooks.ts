import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchInventoryItems, type InventoryItemsRequest, type InventoryItemsResult } from './api';
import { type InventoryItemStatus } from './adapters';

export type InventoryItemsTableParams = {
  pageIndex: number;
  pageSize: number;
  search?: string;
  status?: InventoryItemStatus | 'all';
  category?: string;
  sortBy?: InventoryItemsRequest['sortBy'];
  sortDir?: InventoryItemsRequest['sortDir'];
};

export type InventoryItemsTableQuery = ReturnType<typeof useInventoryItemsTable>;

function sanitizePageIndex(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : Math.trunc(value);
}

function sanitizePageSize(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 25;
  return Math.trunc(value);
}

export const inventoryItemsTableKey = (params: InventoryItemsTableParams) => [
  'inventory',
  'items',
  'table',
  sanitizePageIndex(params.pageIndex),
  sanitizePageSize(params.pageSize),
  params.search?.trim() ?? '',
  params.status ?? 'all',
  params.category?.trim() ?? '',
  params.sortBy ?? '',
  params.sortDir ?? '',
] as const;

export function useInventoryItemsTable(params: InventoryItemsTableParams) {
  const pageIndex = sanitizePageIndex(params.pageIndex);
  const pageSize = sanitizePageSize(params.pageSize);

  return useQuery<InventoryItemsResult>({
    queryKey: inventoryItemsTableKey({ ...params, pageIndex, pageSize }),
    queryFn: () => fetchInventoryItems({
      search: params.search?.trim(),
      status: params.status,
      category: params.category,
      page: pageIndex + 1,
      pageSize,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    }),
    placeholderData: keepPreviousData,
  });
}
