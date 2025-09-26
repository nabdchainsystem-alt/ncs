import { STRICT_API_ONLY } from '../../../config/flags';
import { apiClient } from '../../../lib/api';
import { adaptInventoryItems, type InventoryItemStatus, type InventoryItemUnit, type InventoryTableItem } from './adapters';
import { type InventoryWarehouse } from '../../../lib/api';

export type InventoryItemsRequest = {
  search?: string;
  status?: InventoryItemStatus | 'all' | '' | null;
  category?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: 'code' | 'name' | 'qty' | 'lowQty';
  sortDir?: 'asc' | 'desc';
};

export type InventoryItemsResult = {
  items: InventoryTableItem[];
  total: number;
  page: number;
  pageSize: number;
};

type InventoryItemsApiResponse = {
  items?: unknown;
  total?: unknown;
  page?: unknown;
  pageSize?: unknown;
};

export type BulkUpdateInventoryItemsPayload = {
  ids: number[];
  patch: {
    unit?: InventoryItemUnit;
    lowQty?: number;
    category?: string;
  };
};

export type BulkUpdateInventoryItemsResponse = {
  updated: number;
};

export type MoveInventoryItemsPayload = {
  ids: number[];
  toWarehouse: string;
};

export type MoveInventoryItemsResponse = {
  moved: number;
};

export type DeleteInventoryItemsPayload = {
  ids: number[];
};

export type DeleteInventoryItemsResponse = {
  deleted: string[];
  failed?: Array<{ id: string; reason: string }>;
};

const DEFAULT_PAGE_SIZE = 25;
const EMPTY_RESULT: InventoryItemsResult = { items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };

function ensureNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function ensurePositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.trunc(value);
  return rounded > 0 ? rounded : fallback;
}

function sanitizeResponse(
  data: InventoryItemsApiResponse | null | undefined,
  fallbackPage: number,
  fallbackPageSize: number,
): InventoryItemsResult {
  const items = adaptInventoryItems(Array.isArray(data?.items) ? (data?.items as any[]) : []);
  const total = Math.max(0, ensureNumber(data?.total, items.length));
  const page = ensurePositiveInt(ensureNumber(data?.page, fallbackPage), fallbackPage);
  const pageSize = ensurePositiveInt(ensureNumber(data?.pageSize, fallbackPageSize), fallbackPageSize);
  return { items, total, page, pageSize };
}

function buildQuery(params: InventoryItemsRequest): {
  query: Record<string, string | number>;
  page: number;
  pageSize: number;
} {
  const query: Record<string, string | number> = {};
  const search = typeof params.search === 'string' ? params.search.trim() : '';
  if (search) query.search = search;

  const status = typeof params.status === 'string' ? params.status.trim().toLowerCase() : '';
  if (status && status !== 'all') {
    query.status = status;
  }

  const category = typeof params.category === 'string' ? params.category.trim() : '';
  if (category) {
    query.category = category;
  }

  const page = ensurePositiveInt(Number(params.page ?? 1), 1);
  const pageSize = ensurePositiveInt(Number(params.pageSize ?? DEFAULT_PAGE_SIZE), DEFAULT_PAGE_SIZE);
  query.page = page;
  query.pageSize = pageSize;

  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortDir) query.sortDir = params.sortDir;

  return { query, page, pageSize };
}

export async function fetchInventoryItems(params: InventoryItemsRequest = {}): Promise<InventoryItemsResult> {
  try {
    const { query, page, pageSize } = buildQuery(params);
    const { data } = await apiClient.get<InventoryItemsApiResponse>('/api/inventory/items', {
      params: query,
    });
    return sanitizeResponse(data, page, pageSize);
  } catch (error) {
    if (STRICT_API_ONLY) {
      return EMPTY_RESULT;
    }
    throw error;
  }
}

function sanitizeBulkCount(value: unknown, fallback: number): number {
  const num = ensureNumber(value, fallback);
  return num >= 0 ? num : fallback;
}

export async function bulkUpdateInventoryItems(payload: BulkUpdateInventoryItemsPayload): Promise<BulkUpdateInventoryItemsResponse> {
  try {
    const { data } = await apiClient.patch<BulkUpdateInventoryItemsResponse>('/api/inventory/items/bulk', payload);
    return { updated: sanitizeBulkCount(data?.updated, payload.ids.length) };
  } catch (error) {
    if (STRICT_API_ONLY) {
      return { updated: 0 };
    }
    throw error;
  }
}

export async function moveInventoryItems(payload: MoveInventoryItemsPayload): Promise<MoveInventoryItemsResponse> {
  try {
    const { data } = await apiClient.post<MoveInventoryItemsResponse>('/api/inventory/items/move', payload);
    return { moved: sanitizeBulkCount(data?.moved, payload.ids.length) };
  } catch (error) {
    if (STRICT_API_ONLY) {
      return { moved: payload.ids.length };
    }
    throw error;
  }
}

export async function fetchInventoryWarehouses(): Promise<InventoryWarehouse[]> {
  try {
    const { data } = await apiClient.get<InventoryWarehouse[]>('/api/inventory/warehouses');
    if (!Array.isArray(data)) return [];
    return data;
  } catch (error) {
    if (STRICT_API_ONLY) {
      return [];
    }
    throw error;
  }
}

export async function deleteInventoryItems(payload: DeleteInventoryItemsPayload): Promise<DeleteInventoryItemsResponse> {
  try {
    const { data } = await apiClient.delete<DeleteInventoryItemsResponse>('/api/inventory/items', {
      data: payload,
    });
    const deleted = Array.isArray(data?.deleted) ? data.deleted.map(String) : payload.ids.map((id) => id.toString());
    const failed = Array.isArray(data?.failed) ? data.failed : undefined;
    return { deleted, failed };
  } catch (error) {
    if (STRICT_API_ONLY) {
      return { deleted: payload.ids.map((id) => id.toString()) };
    }
    throw error;
  }
}
