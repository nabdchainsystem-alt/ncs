import * as React from 'react';

import {
  listPurchaseOrders,
  updatePurchaseOrder as apiUpdatePurchaseOrder,
  deletePurchaseOrder as apiDeletePurchaseOrder,
  getPurchaseOrder,
  type PurchaseOrderDTO,
  type PurchaseOrderItemDTO,
  type UpdatePurchaseOrderPayload,
} from '../../lib/api';
import { refreshRfqs } from '../../stores/useRfqStore';

export type PurchaseOrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'OnHold' | string;

export type PurchaseOrderItemRecord = {
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
  status: PurchaseOrderStatus;
  completion: boolean;
  department?: string | null;
  machine?: string | null;
  poDate: string | null;
  totalAmount: number;
  totalAmountSar: number;
  requestId?: string | null;
  requestNo?: string | null;
  vendor?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  items: PurchaseOrderItemRecord[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Listener = () => void;

type StoreState = {
  orders: PurchaseOrderRecord[];
  loading: boolean;
  error?: string;
};

let state: StoreState = {
  orders: [],
  loading: false,
  error: undefined,
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('purchaseOrdersStore listener failed', error);
    }
  });
}

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  notify();
}

function upsert(list: PurchaseOrderRecord[], record: PurchaseOrderRecord) {
  const index = list.findIndex((entry) => entry.id === record.id);
  if (index >= 0) {
    const next = list.slice();
    next[index] = record;
    return next;
  }
  return [record, ...list];
}

function normalizeItem(item: PurchaseOrderItemDTO): PurchaseOrderItemRecord {
  const quantity = Number(item.qty ?? 0) || 0;
  const unitPrice = Number(item.unitPriceSar ?? 0) || 0;
  const lineTotal = Number(item.lineTotalSar ?? quantity * unitPrice) || 0;
  return {
    id: item.id != null ? String(item.id) : Math.random().toString(36).slice(2, 10),
    materialCode: item.materialNo ?? null,
    description: item.description ?? null,
    quantity,
    unit: item.unit ?? null,
    unitPrice,
    lineTotal,
  };
}

function normalizePurchaseOrder(dto: PurchaseOrderDTO): PurchaseOrderRecord {
  const totalAmount = Number(dto.totalAmountSar ?? 0) || 0;
  return {
    id: dto.id,
    orderNo: dto.orderNo ?? `PO-${dto.id}`,
    status: dto.status ?? 'Pending',
    completion: Boolean(dto.completed),
    department: dto.department ?? null,
    machine: dto.machine ?? null,
    poDate: dto.poDate ?? null,
    totalAmount,
    totalAmountSar: totalAmount,
    requestId: dto.requestId ?? null,
    requestNo: dto.requestNo ?? dto.request?.orderNo ?? null,
    vendor: dto.vendorName ?? null,
    vendorId: dto.vendorId ?? null,
    vendorName: dto.vendorName ?? null,
    items: Array.isArray(dto.items) ? dto.items.map(normalizeItem) : [],
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

export function getPurchaseOrdersSnapshot(): PurchaseOrderRecord[] {
  return state.orders;
}

export function subscribePurchaseOrders(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getStoreSnapshot() {
  return state;
}

export function usePurchaseOrdersStore() {
  return React.useSyncExternalStore(subscribePurchaseOrders, getStoreSnapshot, getStoreSnapshot);
}

export function usePurchaseOrders(): PurchaseOrderRecord[] {
  return usePurchaseOrdersStore().orders;
}

export async function refreshPurchaseOrders() {
  setState({ loading: true, error: undefined });
  try {
    const orders = await listPurchaseOrders();
    const normalized = orders.map(normalizePurchaseOrder);
    setState({ orders: normalized, loading: false, error: undefined });
    return normalized;
  } catch (error: any) {
    const message = error?.message ?? 'Failed to load purchase orders';
    setState({ orders: [], loading: false, error: message });
    throw error;
  }
}

async function applyUpdate(id: string | number, payload: UpdatePurchaseOrderPayload) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('applyUpdate: missing id');
  const updated = await apiUpdatePurchaseOrder(sid, payload);
  const normalized = normalizePurchaseOrder(updated);
  setState({ orders: upsert(state.orders, normalized), error: undefined });
  return normalized;
}

export async function setPurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  return applyUpdate(id, { status });
}

export async function setPurchaseOrderCompletion(id: string, completion: boolean) {
  const record = await applyUpdate(id, { completed: completion });
  try {
    await refreshRfqs();
  } catch {
    // ignore refresh failure
  }
  return record;
}

export async function hydratePurchaseOrder(id: string | number) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('hydratePurchaseOrder: missing id');
  const record = await getPurchaseOrder(sid);
  const normalized = normalizePurchaseOrder(record);
  setState({ orders: upsert(state.orders, normalized), error: undefined });
  return normalized;
}

export async function removePurchaseOrder(id: string | number) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('removePurchaseOrder: missing id');
  await apiDeletePurchaseOrder(sid);
  setState({ orders: state.orders.filter((entry) => entry.id !== sid), error: undefined });
  try {
    await refreshRfqs();
  } catch {
    // ignore refresh error; RFQ store already handles its own state
  }
}

export function findPurchaseOrderById(id: string): PurchaseOrderRecord | null {
  return state.orders.find((entry) => entry.id === id) ?? null;
}

export function findPurchaseOrderByOrderNo(orderNo: string): PurchaseOrderRecord | null {
  return state.orders.find((entry) => entry.orderNo === orderNo) ?? null;
}

export function clearPurchaseOrdersState() {
  setState({ orders: [], error: undefined });
}

export function clearPurchaseOrdersForTests() {
  clearPurchaseOrdersState();
}
