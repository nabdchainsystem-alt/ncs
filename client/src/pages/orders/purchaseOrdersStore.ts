import * as React from 'react';

export type PurchaseOrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'OnHold';

export type PurchaseOrderItem = {
  id: string;
  materialCode?: string | null;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  lineTotal: number;
};

export type PurchaseOrderRecord = {
  id: string;
  orderNo: string;
  requestId?: string;
  requestNo: string;
  vendor?: string | null;
  department?: string | null;
  poDate: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  completion: boolean;
  completedAt?: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderItemInput = {
  id?: string;
  materialCode?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  unitPrice?: number | string | null;
};

export type UpsertPurchaseOrderInput = {
  orderNo: string;
  requestId?: string;
  requestNo: string;
  vendor?: string | null;
  department?: string | null;
  poDate?: string;
  items: PurchaseOrderItemInput[];
  status?: PurchaseOrderStatus;
  completion?: boolean;
};

const STORAGE_KEY = 'purchase_orders_store_v1';
let cache: PurchaseOrderRecord[] | null = null;
const listeners = new Set<() => void>();
let storageListenerAttached = false;

const makeId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)
);

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function sanitizeString(value: unknown): string | null {
  if (typeof value !== 'string') return value == null ? null : String(value);
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function loadFromStorage(): PurchaseOrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const items = Array.isArray(entry.items) ? entry.items : [];
        return {
          id: typeof entry.id === 'string' ? entry.id : makeId(),
          orderNo: String(entry.orderNo ?? ''),
          requestId: entry.requestId ?? undefined,
          requestNo: String(entry.requestNo ?? ''),
          vendor: sanitizeString(entry.vendor),
          department: sanitizeString(entry.department),
          poDate: typeof entry.poDate === 'string' ? entry.poDate : new Date().toISOString(),
          totalAmount: toNumber(entry.totalAmount, 0),
          status: (entry.status as PurchaseOrderStatus) ?? 'Pending',
          completion: Boolean(entry.completion),
          completedAt: sanitizeString(entry.completedAt),
          items: items.map((item: any) => ({
            id: typeof item?.id === 'string' ? item.id : makeId(),
            materialCode: sanitizeString(item?.materialCode),
            description: sanitizeString(item?.description),
            quantity: toNumber(item?.quantity, 0),
            unit: sanitizeString(item?.unit),
            unitPrice: toNumber(item?.unitPrice, 0),
            lineTotal: toNumber(item?.lineTotal, 0),
          })),
          createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
          updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(),
        } as PurchaseOrderRecord;
      })
      .filter((item): item is PurchaseOrderRecord => !!item && !!item.orderNo);
  } catch {
    return [];
  }
}

function saveToStorage(value: PurchaseOrderRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function ensureCache(): PurchaseOrderRecord[] {
  if (!cache) {
    cache = loadFromStorage();
  }
  return cache;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === 'undefined') return;
  const handler = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = loadFromStorage();
    notify();
  };
  window.addEventListener('storage', handler);
  storageListenerAttached = true;
}

function updateStore(mutator: (list: PurchaseOrderRecord[]) => PurchaseOrderRecord[]) {
  const next = mutator(ensureCache().slice());
  cache = next;
  saveToStorage(next);
  notify();
  return next;
}

function normalizeItems(inputs: PurchaseOrderItemInput[]): { items: PurchaseOrderItem[]; total: number } {
  const items = inputs.map((item) => {
    const quantity = toNumber(item.quantity, 0);
    const unitPrice = toNumber(item.unitPrice, 0);
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100;
    return {
      id: item.id && typeof item.id === 'string' ? item.id : makeId(),
      materialCode: sanitizeString(item.materialCode),
      description: sanitizeString(item.description),
      quantity,
      unit: sanitizeString(item.unit),
      unitPrice,
      lineTotal,
    } satisfies PurchaseOrderItem;
  });
  const total = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  return { items, total };
}

export function getPurchaseOrdersSnapshot(): PurchaseOrderRecord[] {
  return ensureCache();
}

export function subscribePurchaseOrders(listener: () => void): () => void {
  listeners.add(listener);
  attachStorageListener();
  return () => {
    listeners.delete(listener);
  };
}

export function usePurchaseOrders(): PurchaseOrderRecord[] {
  return React.useSyncExternalStore(subscribePurchaseOrders, getPurchaseOrdersSnapshot, getPurchaseOrdersSnapshot);
}

export function upsertPurchaseOrder(payload: UpsertPurchaseOrderInput): PurchaseOrderRecord {
  const now = new Date().toISOString();
  const poDate = payload.poDate ?? now;
  const { items, total } = normalizeItems(payload.items);
  let created: PurchaseOrderRecord | null = null;
  updateStore((list) => {
    const existingIndex = list.findIndex((entry) => entry.orderNo === payload.orderNo);
    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const next: PurchaseOrderRecord = {
        ...existing,
        requestId: payload.requestId ?? existing.requestId,
        requestNo: payload.requestNo || existing.requestNo,
        vendor: payload.vendor ?? existing.vendor ?? null,
        department: payload.department ?? existing.department ?? null,
        poDate,
        items,
        totalAmount: total,
        status: payload.status ?? existing.status ?? 'Pending',
        completion: payload.completion ?? existing.completion ?? false,
        completedAt: payload.completion === false ? null : existing.completedAt ?? null,
        updatedAt: now,
      };
      const nextList = list.slice();
      nextList[existingIndex] = next;
      created = next;
      return nextList;
    }

    const next: PurchaseOrderRecord = {
      id: makeId(),
      orderNo: payload.orderNo,
      requestId: payload.requestId,
      requestNo: payload.requestNo,
      vendor: payload.vendor ?? null,
      department: payload.department ?? null,
      poDate,
      totalAmount: total,
      status: payload.status ?? 'Pending',
      completion: payload.completion ?? false,
      completedAt: null,
      items,
      createdAt: now,
      updatedAt: now,
    };
    created = next;
    return [...list, next];
  });
  if (!created) {
    throw new Error('Failed to create purchase order');
  }
  return created;
}

export async function setPurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrderRecord> {
  let updated: PurchaseOrderRecord | null = null;
  updateStore((list) => {
    const index = list.findIndex((entry) => entry.id === id);
    if (index === -1) return list;
    const current = list[index];
    if (current.status === status) {
      updated = current;
      return list;
    }
    const next = { ...current, status, updatedAt: new Date().toISOString() } satisfies PurchaseOrderRecord;
    const nextList = list.slice();
    nextList[index] = next;
    updated = next;
    return nextList;
  });
  if (!updated) {
    throw new Error('Purchase order not found');
  }
  return updated;
}

export async function setPurchaseOrderCompletion(id: string, completion: boolean): Promise<PurchaseOrderRecord> {
  let updated: PurchaseOrderRecord | null = null;
  updateStore((list) => {
    const index = list.findIndex((entry) => entry.id === id);
    if (index === -1) return list;
    const current = list[index];
    if (current.completion === completion) {
      updated = current;
      return list;
    }
    const now = new Date().toISOString();
    const next: PurchaseOrderRecord = {
      ...current,
      completion,
      completedAt: completion ? now : null,
      updatedAt: now,
    };
    const nextList = list.slice();
    nextList[index] = next;
    updated = next;
    return nextList;
  });
  if (!updated) {
    throw new Error('Purchase order not found');
  }
  return updated;
}

export function findPurchaseOrderById(id: string): PurchaseOrderRecord | null {
  return ensureCache().find((entry) => entry.id === id) ?? null;
}

export function findPurchaseOrderByOrderNo(orderNo: string): PurchaseOrderRecord | null {
  return ensureCache().find((entry) => entry.orderNo === orderNo) ?? null;
}

export function clearPurchaseOrdersForTests() {
  cache = [];
  saveToStorage([]);
  notify();
}
