import axios from "axios";
import type { Task, TaskStatus } from "../types";

export type RequestPriority = 'Low' | 'Normal' | 'High';
export type RequestApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'OnHold';

export type RequestItemInput = {
  code?: string;
  name?: string;
  description?: string;
  qty: number;
  unit?: string;
  machine?: string;
  warehouse?: string;
  requester?: string;
  note?: string | Record<string, any>;
  storeId?: number;
};

export type CreateRequestPayload = {
  requestNo: string;
  description?: string;
  department?: string;
  warehouse?: string;
  machine?: string;
  priority?: RequestPriority;
  requiredDate?: string;
  items: RequestItemInput[];
  storeId?: number;
  // legacy compatibility fields (still accepted by backend)
  orderNo?: string;
  type?: string;
  vendor?: string;
  notes?: string;
};

export type UpdateRequestPayload = Partial<CreateRequestPayload> & {
  status?: string;
  approval?: RequestApprovalStatus;
  title?: string;
};

export type RequestItemDTO = {
  id?: string | number;
  code?: string | null;
  description?: string;
  name?: string;
  qty: number;
  unit?: string | null;
  status?: string | null;
  machine?: string | null;
  warehouse?: string | null;
  requester?: string | null;
  storeId?: number | null;
  storeName?: string | null;
};

export type RequestDTO = {
  id: string;
  requestNo: string;
  orderNo?: string;
  dateRequested?: string | null;
  createdAt?: string | null;
  description?: string;
  department?: string;
  warehouse?: string;
  machine?: string;
  vendor?: string;
  status?: string;
  statusRaw?: string;
  priority?: RequestPriority;
  priorityRaw?: string;
  approval?: RequestApprovalStatus;
  approvalRaw?: string;
  rfqStatus?: 'Sent' | 'Pending' | 'Not Sent';
  rfqSentAt?: string | null;
  requiredDate?: string | null;
  items: RequestItemDTO[];
  source?: any;
  storeId?: number | null;
  storeName?: string | null;
};

export type RfqItemDTO = {
  id: string;
  materialNo?: string | null;
  description?: string | null;
  qty: number;
  unit?: string | null;
  unitPriceSar: number;
  lineTotalSar: number;
};

export type RfqRecordDTO = {
  id: string;
  quotationNo?: string | null;
  status: string;
  totalSar?: number;
  vendorId?: string | null;
  vendorName?: string | null;
  requestId?: string | null;
  requestNo?: string | null;
  request?: { id: string; orderNo?: string | null; department?: string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items: RfqItemDTO[];
  isDeleted?: boolean;
  locked?: boolean;
};

export type PurchaseOrderItemDTO = {
  id: string;
  materialNo?: string | null;
  description?: string | null;
  qty: number;
  unit?: string | null;
  unitPriceSar: number;
  lineTotalSar: number;
};

export type PurchaseOrderDTO = {
  id: string;
  orderNo?: string | null;
  status: string;
  completed: boolean;
  department?: string | null;
  machine?: string | null;
  poDate?: string | null;
  totalAmountSar: number;
  requestId?: string | null;
  requestNo?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  request?: { id: string; orderNo?: string | null; department?: string | null } | null;
  items: PurchaseOrderItemDTO[];
  createdAt?: string | null;
  updatedAt?: string | null;
  isDeleted?: boolean;
};

export type SpendByMachineEntry = {
  machine: string;
  totalSar: number;
};

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

export type RequestStats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  onHold: number;
  byDepartment: Array<{ department: string; count: number }>;
};

export type OverviewStatusEntry = { name: string; value: number };

export type OverviewRequestsSummary = {
  total: number;
  statusCounts: OverviewStatusEntry[];
  byDepartment: Array<{ name: string; value: number }>;
  priorityCounts?: Array<{ name: string; value: number }>;
};

export type OverviewOrdersSummary = {
  total: number;
  statusCounts: OverviewStatusEntry[];
  monthlyExpenses: Array<{ month: string; totalSar: number }>;
  byCategory: Array<{ category: string; totalSar: number }>;
  twelveMonthSpend?: number;
};

// -------- sanitizer helpers --------
function dropUndefined<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && v.trim() === '') return; // drop empty strings
    if (Array.isArray(v) && v.length === 0) return;        // drop empty arrays
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return; // drop empty objects
    out[k] = v;
  });
  return out as T;
}

function makeTempId(prefix: string): string {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    try {
      const array = new Uint32Array(1);
      crypto.getRandomValues?.(array);
      if (array[0]) return `${prefix}-${array[0].toString(16)}`;
    } catch {
      // ignore
    }
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeDateInput(value: any): string | undefined {
  if (!value && value !== 0) return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

function toISODate(value: any): string | null {
  if (!value && value !== 0) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toDateOnly(value: any): string | null {
  const iso = toISODate(value);
  return iso ? iso.slice(0, 10) : null;
}

function normalizePriorityValue(raw: any): RequestPriority {
  const str = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (str === 'low') return 'Low';
  if (str === 'high' || str === 'urgent' || str === 'emergency') return 'High';
  if (str === 'medium' || str === 'normal' || str === 'standard') return 'Normal';
  return 'Normal';
}

function normalizeApprovalValue(raw: any): RequestApprovalStatus {
  const str = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (str === 'approved' || str === 'approve') return 'Approved';
  if (str === 'rejected' || str === 'reject') return 'Rejected';
  if (str === 'onhold' || str === 'on-hold' || str === 'hold') return 'OnHold';
  return 'Pending';
}

function normalizeStatusValue(raw: any): string | undefined {
  if (!raw && raw !== 0) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;
  return str
    .replace(/[_\s]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function sanitizeItem(input: any) {
  const name = input?.name ?? input?.description ?? input?.title ?? input?.itemName ?? '';
  const code = input?.code ?? input?.itemCode ?? input?.materialCode ?? undefined;
  const qty = Number(input?.qty ?? input?.quantity ?? 0);
  const unit = input?.unit ?? input?.uom ?? undefined;
  const machine = input?.machine ?? input?.meta?.machine ?? undefined;
  const warehouse = input?.warehouse ?? input?.meta?.warehouse ?? undefined;
  const requester = input?.requester ?? input?.meta?.requester ?? undefined;
  const storeIdRaw = input?.storeId ?? input?.store?.id ?? input?.meta?.storeId;
  const storeId = storeIdRaw != null ? Number(storeIdRaw) : undefined;
  const explicitNote = typeof input?.note === 'string' ? input.note : undefined;

  const meta: Record<string, any> = {};
  if (code) meta.code = code;
  if (machine) meta.machine = machine;
  if (warehouse) meta.warehouse = warehouse;
  if (requester) meta.requester = requester;
  if (storeId != null && Number.isFinite(storeId)) meta.storeId = Number(storeId);

  let note = explicitNote;
  if (!note && Object.keys(meta).length) {
    try {
      note = JSON.stringify(meta);
    } catch {
      note = undefined;
    }
  }

  const payload = dropUndefined({ name, code, qty, unit, note });
  if (storeId != null && Number.isFinite(storeId)) {
    (payload as any).storeId = Number(storeId);
  }
  return payload;
}

function sanitizeCreatePayload(input: any) {
  const requestNo = String(input?.requestNo ?? input?.orderNo ?? '').trim();
  const description = isNonEmptyString(input?.description)
    ? input.description
    : isNonEmptyString(input?.title)
      ? input.title
      : isNonEmptyString(input?.notes)
        ? input.notes
        : undefined;
  const type = input?.type ?? 'Purchase';
  const department = input?.department ?? undefined;
  const warehouse = input?.warehouse ?? undefined;
  const machine = input?.machine ?? undefined;
  const priority = input?.priority ? normalizePriorityValue(input.priority) : undefined;
  const vendor = input?.vendor ?? undefined;
  const notes = input?.notes ?? undefined;
  const requiredDate = normalizeDateInput(input?.requiredDate ?? input?.date);
  const approval = input?.approval ?? 'Pending';

  const rawItems = Array.isArray(input?.items) ? input.items : [];
  const items = rawItems
    .map((item: any) => sanitizeItem({ ...item, machine }))
    .filter((it: any) => {
      const hasIdentity = isNonEmptyString(it.name) || isNonEmptyString(it.code);
      const qtyValue = typeof it.qty === 'number' ? it.qty : 0;
      return hasIdentity && qtyValue > 0;
    });

  const storeId = input?.storeId != null ? Number(input.storeId) : undefined;

  return dropUndefined({
    orderNo: requestNo || undefined,
    requestNo: requestNo || undefined,
    title: description ?? (requestNo || undefined),
    description,
    type,
    department,
    warehouse,
    machine,
    priority,
    approval,
    vendor,
    notes,
    requiredDate,
    items,
    storeId: Number.isFinite(storeId) ? Number(storeId) : undefined,
  });
}

function sanitizeUpdatePayload(input: any) {
  const requestNoRaw = input?.requestNo ?? input?.orderNo;
  const requestNo = requestNoRaw !== undefined && requestNoRaw !== null ? String(requestNoRaw).trim() : undefined;
  const description = isNonEmptyString(input?.description)
    ? input.description
    : isNonEmptyString(input?.title)
      ? input.title
      : undefined;
  const type = input?.type ?? undefined;
  const department = input?.department ?? undefined;
  const warehouse = input?.warehouse ?? undefined;
  const machine = input?.machine ?? undefined;
  const priority = input?.priority ? normalizePriorityValue(input.priority) : undefined;
  const vendor = input?.vendor ?? undefined;
  const notes = input?.notes ?? undefined;
  const requiredDate = normalizeDateInput(input?.requiredDate ?? input?.date);
  const status = input?.status ?? undefined;
  let approval: RequestApprovalStatus | undefined = undefined;
  if (input?.approval !== undefined) {
    approval = normalizeApprovalValue(input.approval);
  } else if (input?.approvalStatus !== undefined) {
    approval = normalizeApprovalValue(input.approvalStatus);
  }

  const storeId = input?.storeId != null ? Number(input.storeId) : undefined;

  let items: any = undefined;
  if (Array.isArray(input?.items)) {
    const mapped = input.items
      .map((item: any) => sanitizeItem({ ...item, machine }))
      .filter((it: any) => {
        const hasIdentity = isNonEmptyString(it.name) || isNonEmptyString(it.code);
        const qtyValue = typeof it.qty === 'number' ? it.qty : 0;
        return hasIdentity && qtyValue > 0;
      });
    if (mapped.length > 0) {
      items = mapped;
    }
  }

  return dropUndefined({
    orderNo: requestNo,
    requestNo,
    title: description ?? requestNo,
    description,
    type,
    department,
    warehouse,
    machine,
    priority,
    vendor,
    notes,
    requiredDate,
    status,
    approval,
    items,
    storeId: Number.isFinite(storeId) ? Number(storeId) : undefined,
  });
}

const DEFAULT_API_BASE = 'http://localhost:4000';

function normalizeBaseUrl(input?: string | null) {
  if (typeof input !== 'string') return DEFAULT_API_BASE;
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_API_BASE;
  return trimmed.replace(/\/+$/, '');
}

const resolvedApiBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE);

export const API_BASE_URL = resolvedApiBase;
export const API_URL = API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_URL || DEFAULT_API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const failedOnce = new Set<string>();

function normalizeEndpointKey(path: string): string {
  const [base] = path.split('?');
  return base || path;
}

export async function safeApiGet<T>(path: string, fallback: T): Promise<T> {
  const key = normalizeEndpointKey(path);
  if (failedOnce.has(key)) {
    return fallback;
  }

  try {
    const { data } = await apiClient.get<T>(path);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const isNetwork = !error.response || error.code === 'ERR_NETWORK';
      if (status === 404 || isNetwork) {
        failedOnce.add(key);
        return fallback;
      }
    }
    throw error;
  }
}

// -------- utils --------
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const m = (init?.method || 'GET').toUpperCase();
    // eslint-disable-next-line no-console
    console.debug('[api]', m, path, init?.body ? `body: ${typeof init.body === 'string' ? init.body : '[FormData]'}` : '');
  } catch {}
  const res = await fetch(path, {
    ...init,
    credentials: init?.credentials ?? 'include',
  });
  if (!res.ok) {
    let detail: any = undefined;
    try { detail = await res.json(); } catch {}
    const msg = detail?.message || detail?.error || res.statusText || "Request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  try {
    // eslint-disable-next-line no-console
    console.debug('[api] OK', res.status, path);
  } catch {}
  return res.json() as Promise<T>;
}

export type ApiHealthResult = {
  healthy: boolean;
  status?: number;
  message?: string;
  info?: Record<string, any> | null;
};

export async function checkApiHealth(): Promise<ApiHealthResult> {
  const url = `${API_URL}/api/health`;
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      let detail: any = null;
      try { detail = await res.json(); } catch {}
      const msg = detail?.message || detail?.error || res.statusText || 'Backend unavailable';
      const message = typeof msg === 'string' ? msg : JSON.stringify(msg);
      return { healthy: false, status: res.status, message, info: detail };
    }
    const data = await res.json().catch(() => ({}));
    const healthy = typeof data?.ok === 'boolean' ? Boolean(data.ok) : true;
    const rawMessage = data?.message ?? data?.status ?? undefined;
    const message = typeof rawMessage === 'string' ? rawMessage : undefined;
    return { healthy, status: res.status, message, info: data };
  } catch (error: any) {
    const message = error?.message ?? 'Network error';
    return { healthy: false, message, info: null };
  }
}

function buildQuery(params: Record<string, any> = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => q.append(k, String(x)));
    else q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function normalizeItems(items: any[] = []): RequestItemDTO[] {
  return items.map((it: any) => {
    const name = it?.name ?? it?.description ?? it?.title ?? it?.itemName ?? '';
    const code = it?.code ?? it?.itemCode ?? it?.materialCode ?? undefined;
    const qty = Number(it?.qty ?? it?.quantity ?? 0) || 0;
    const unit = it?.unit ?? it?.uom ?? undefined;
    const status = it?.status ?? it?.state ?? undefined;
    const machine = it?.machine ?? it?.meta?.machine ?? undefined;
    const warehouse = it?.warehouse ?? it?.meta?.warehouse ?? undefined;
    const requester = it?.requester ?? it?.meta?.requester ?? undefined;
    const storeIdRaw = it?.storeId ?? it?.store?.id ?? it?.meta?.storeId;
    const storeId = storeIdRaw != null ? Number(storeIdRaw) : undefined;
    const storeName = it?.store?.name
      ?? it?.store?.code
      ?? it?.storeName
      ?? it?.store_label
      ?? undefined;

    return dropUndefined({
      id: it?.id ?? undefined,
      code,
      description: name || undefined,
      name: name || undefined,
      qty,
      unit,
      status,
      machine,
      warehouse,
      requester,
      storeId: storeId != null && Number.isFinite(storeId) ? Number(storeId) : undefined,
      storeName,
    });
  });
}

function normalizeRequest(raw: any): RequestDTO {
  if (!raw) {
    return { id: 'unknown-request', requestNo: 'unknown-request', items: [], rfqStatus: 'Not Sent' };
  }

  const requestNo = String(raw.requestNo ?? raw.orderNo ?? raw.id ?? '').trim();
  const createdAtISO = toISODate(raw.createdAt ?? raw.date ?? raw.dateRequested);
  const dateRequested = createdAtISO ? createdAtISO.slice(0, 10) : null;
  const description = raw.description ?? raw.title ?? raw.notes ?? undefined;
  const department = raw.department ?? undefined;
  const warehouse = raw.warehouse ?? undefined;
  const machineFromItems = Array.isArray(raw.items)
    ? raw.items.find((it: any) => isNonEmptyString(it?.machine))?.machine
    : undefined;
  const machine = raw.machine ?? machineFromItems ?? undefined;
  const vendor = raw.vendor ?? undefined;
  const priorityRaw = raw.priority ?? raw.priorityLevel ?? raw.priority_raw ?? raw.priorityStatus;
  const approvalRaw = raw.approval ?? raw.approvalStatus ?? raw.approval_state ?? raw.approvalStatusRaw;
  const rfqStatusRaw = raw.rfqStatus ?? raw.rfq_state ?? raw.rfq ?? raw.rfqStatusRaw;
  const rfqSentAtISO = toISODate(raw.rfqSentAt ?? raw.rfq_sent_at ?? raw.rfqSentAtIso);
  const rfqStatus: 'Sent' | 'Pending' | 'Not Sent' = (() => {
    const val = typeof rfqStatusRaw === 'string' ? rfqStatusRaw.trim().toLowerCase() : '';
    if (rfqSentAtISO || val === 'sent' || val === 'completed') return 'Sent';
    if (val === 'pending' || val === 'in-progress' || val === 'queued') return 'Pending';
    return 'Not Sent';
  })();
  const items = normalizeItems(raw.items || []);
  const priority = priorityRaw ? normalizePriorityValue(priorityRaw) : 'Normal';
  const approval = normalizeApprovalValue(approvalRaw);
  const status = normalizeStatusValue(raw.status) ?? raw.status ?? undefined;
  const requiredDate = toDateOnly(raw.requiredDate);
  const storeIdRaw = raw.storeId ?? raw.store_id ?? raw.store?.id ?? null;
  const storeId = storeIdRaw != null && storeIdRaw !== '' ? Number(storeIdRaw) : undefined;
  const storeName = raw.store?.name
    ?? raw.store?.code
    ?? raw.storeLabel
    ?? raw.store_name
    ?? undefined;

  const safeId = (() => {
    if (raw?.id !== undefined && raw?.id !== null) return String(raw.id);
    if (requestNo) return requestNo;
    return 'unknown-request';
  })();

  const base = dropUndefined({
    id: safeId,
    requestNo: requestNo || safeId,
    orderNo: raw.orderNo ?? undefined,
    dateRequested,
    createdAt: createdAtISO,
    description,
    department,
    warehouse,
    machine,
    vendor,
    status,
    statusRaw: raw.status ?? undefined,
    priority,
    priorityRaw: priorityRaw ?? undefined,
    approval,
    approvalRaw: approvalRaw ?? undefined,
    rfqStatus,
    rfqSentAt: rfqSentAtISO,
    requiredDate,
    source: raw,
    storeId: storeId != null && Number.isFinite(storeId) ? Number(storeId) : undefined,
    storeName,
  });

  return { ...base, items } as RequestDTO;
}

function normalizeRfqItem(raw: any): RfqItemDTO {
  const id = raw?.id != null ? String(raw.id) : makeTempId('rfq-item');
  const qty = Number(raw?.qty ?? raw?.quantity ?? 0) || 0;
  const unitPriceSar = Number(raw?.unitPriceSar ?? raw?.price ?? 0) || 0;
  const lineTotalSar = Number(raw?.lineTotalSar ?? raw?.lineTotal ?? qty * unitPriceSar) || 0;
  return {
    id,
    materialNo: raw?.materialNo ?? raw?.code ?? raw?.itemCode ?? null,
    description: raw?.description ?? raw?.name ?? null,
    qty,
    unit: raw?.unit ?? null,
    unitPriceSar,
    lineTotalSar,
  } satisfies RfqItemDTO;
}

function normalizeRfq(raw: any): RfqRecordDTO {
  if (!raw) {
    return {
      id: 'unknown-rfq',
      quotationNo: null,
      status: 'Draft',
      items: [],
    } satisfies RfqRecordDTO;
  }
  const id = String(raw.id ?? raw.rfqId ?? '');
  const quotationNo = raw.quotationNo ?? raw.number ?? null;
  const vendorName = raw.vendorName ?? raw.vendor?.name ?? null;
  const requestInfo = (() => {
    if (raw.request) {
      return {
        id: String(raw.request.id ?? raw.requestId ?? ''),
        orderNo: raw.request.orderNo ?? raw.request.requestNo ?? null,
        department: raw.request.department ?? null,
      };
    }
    if (raw.requestId != null || raw.requestNo != null) {
      return {
        id: String(raw.requestId ?? ''),
        orderNo: raw.requestNo ?? null,
        department: raw.department ?? null,
      };
    }
    return null;
  })();
  const items = Array.isArray(raw.items) ? raw.items.map(normalizeRfqItem) : [];
  return {
    id: id || makeTempId('rfq'),
    quotationNo,
    status: raw.status ?? 'Draft',
    totalSar: Number(raw.totalSar ?? raw.totalAmount ?? 0) || 0,
    isDeleted: Boolean(raw.isDeleted),
    locked: Boolean(raw.locked),
    vendorId: raw.vendorId != null ? String(raw.vendorId) : undefined,
    vendorName,
    requestId: raw.requestId != null ? String(raw.requestId) : undefined,
    requestNo: raw.requestNo ?? requestInfo?.orderNo ?? undefined,
    request: requestInfo,
    createdAt: toISODate(raw.createdAt),
    updatedAt: toISODate(raw.updatedAt),
    items,
  } satisfies RfqRecordDTO;
}

function normalizePurchaseOrderItem(raw: any): PurchaseOrderItemDTO {
  const id = raw?.id != null ? String(raw.id) : makeTempId('po-item');
  const qty = Number(raw?.qty ?? raw?.quantity ?? 0) || 0;
  const unitPriceSar = Number(raw?.unitPriceSar ?? raw?.unitPrice ?? 0) || 0;
  const lineTotalSar = Number(raw?.lineTotalSar ?? raw?.lineTotal ?? qty * unitPriceSar) || 0;
  return {
    id,
    materialNo: raw?.materialNo ?? raw?.code ?? raw?.itemCode ?? null,
    description: raw?.description ?? raw?.name ?? null,
    qty,
    unit: raw?.unit ?? null,
    unitPriceSar,
    lineTotalSar,
  } satisfies PurchaseOrderItemDTO;
}

function normalizePurchaseOrder(raw: any): PurchaseOrderDTO {
  if (!raw) {
    return {
      id: 'unknown-order',
      status: 'Pending',
      completed: false,
      totalAmountSar: 0,
      items: [],
    } satisfies PurchaseOrderDTO;
  }
  const id = String(raw.id ?? raw.orderId ?? '');
  const items = Array.isArray(raw.items) ? raw.items.map(normalizePurchaseOrderItem) : [];
  const requestInfo = (() => {
    if (!raw.request && raw.requestId == null) return null;
    if (raw.request) {
      return {
        id: String(raw.request.id ?? raw.requestId ?? ''),
        orderNo: raw.request.orderNo ?? raw.request.requestNo ?? null,
        department: raw.request.department ?? null,
      };
    }
    return {
      id: String(raw.requestId ?? ''),
      orderNo: raw.requestNo ?? null,
      department: raw.department ?? null,
    };
  })();
  return {
    id: id || makeTempId('po'),
    orderNo: raw.orderNo ?? null,
    status: raw.status ?? 'Pending',
    completed: Boolean(raw.completed),
    department: raw.department ?? null,
    machine: raw.machine ?? null,
    poDate: toISODate(raw.poDate),
    totalAmountSar: Number(raw.totalAmountSar ?? raw.total ?? 0) || 0,
    requestId: raw.requestId != null ? String(raw.requestId) : undefined,
    requestNo: raw.requestNo ?? requestInfo?.orderNo ?? undefined,
    vendorId: raw.vendorId != null ? String(raw.vendorId) : undefined,
    vendorName: raw.vendorName ?? raw.vendor?.name ?? null,
    request: requestInfo,
    items,
    createdAt: toISODate(raw.createdAt),
    updatedAt: toISODate(raw.updatedAt),
    isDeleted: Boolean(raw.isDeleted),
  } satisfies PurchaseOrderDTO;
}

// -------- types for list --------
export type RequestListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;           // e.g. NEW | RFQ | APPROVED | COMPLETED
  department?: string;       // department filter
  vendor?: string;
  warehouse?: string;
  dateFrom?: string;         // ISO date (yyyy-mm-dd)
  dateTo?: string;           // ISO date (yyyy-mm-dd)
  sortBy?: string;           // e.g. createdAt
  sortDir?: "asc" | "desc";
};

// -------- API: Requests --------
export async function listRequests(params: RequestListParams & Record<string, any> = {}) {
  // Backward compatibility: map old keys -> new ones if provided
  const mapped = {
    q: params.q,
    status: params.status,
    department: params.department ?? (params as any).dept,
    vendor: params.vendor,
    warehouse: params.warehouse,
    dateFrom: params.dateFrom ?? (params as any).from,
    dateTo: params.dateTo ?? (params as any).to,
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  };
  const query = buildQuery(mapped);
  const raw = await http<Paginated<any>>(`${API_URL}/api/requests${query}`);
  const items = Array.isArray(raw.items) ? raw.items.map(normalizeRequest) : [];
  return {
    ...raw,
    items,
  } as Paginated<RequestDTO>;
}

// Backward-compat helper
export async function getRequests() {
  return listRequests();
}

export async function getRequestStats() {
  return http<RequestStats>(`${API_URL}/api/requests/stats`);
}

export async function getOverviewRequests() {
  return http<OverviewRequestsSummary>(`${API_URL}/api/overview/requests`);
}

export async function getOverviewOrders() {
  return http<OverviewOrdersSummary>(`${API_URL}/api/overview/orders`);
}

export async function getRequest(id: number | string) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('getRequest: missing request id');
  const raw = await http<any>(`${API_URL}/api/requests/${sid}`);
  return normalizeRequest(raw);
}

export async function createRequest(payload: CreateRequestPayload) {
  const body = sanitizeCreatePayload(payload as any);
  const res = await http<any>(`${API_URL}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  try {
    if (res && typeof res === 'object' && 'requestNo' in res) {
      return normalizeRequest(res);
    }
  } catch {}
  return res;
}

export async function updateRequest(id: number | string, payload: UpdateRequestPayload) {
  const sid = String(id ?? '').trim();
  if (!sid) {
    throw new Error('updateRequest: missing request id');
  }
  const body = sanitizeUpdatePayload(payload as any);
  const url = `${API_URL}/api/requests/${sid}`;
  // eslint-disable-next-line no-console
  console.debug('[api] PATCH', url, body);
  const res = await http<any>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  try {
    if (res && typeof res === 'object') {
      return normalizeRequest(res);
    }
  } catch {}
  return res;
}

export async function deleteRequest(id: number | string) {
  return http<any>(`${API_URL}/api/requests/${String(id)}`, { method: "DELETE" });
}

export async function updateRequestApproval(id: number | string, approval: RequestApprovalStatus) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('updateRequestApproval: missing request id');
  const res = await http<any>(`${API_URL}/api/requests/${sid}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approval }),
  });
  try {
    if (res && typeof res === 'object') {
      return normalizeRequest(res);
    }
  } catch {}
  return res;
}

export async function sendRFQ(id: number | string) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('sendRFQ: missing request id');
  const res = await http<any>(`${API_URL}/api/requests/${sid}/rfq/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  try {
    if (res && typeof res === 'object') {
      return normalizeRequest(res);
    }
  } catch {}
  return res;
}

export async function updateRequestStatus(id: number | string, status: string) {
  return http<any>(`${API_URL}/api/requests/${String(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function uploadRequestFile(id: number | string, file: File, kind: "request" | "quotation" = "request") {
  const fd = new FormData();
  fd.append("file", file);
  return http<any>(`${API_URL}/api/requests/${String(id)}/files${buildQuery({ kind })}`, {
    method: "POST",
    body: fd,
  });
}

// -------- API: Request Items (for later use) --------
export type RequestItemPayload = {
  name: string;
  code?: string;
  qty?: number;
  unit?: string;
  note?: string;
};

export async function addRequestItem(requestId: number | string, item: RequestItemPayload) {
  const sid = String(requestId ?? '').trim();
  if (!sid) throw new Error('addRequestItem: missing request id');
  const body = sanitizeItem(item);
  return http<any>(`${API_URL}/api/requests/${sid}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateRequestItem(
  requestId: number | string,
  itemId: number | string,
  item: RequestItemPayload
) {
  const sid = String(requestId ?? '').trim();
  const iid = String(itemId ?? '').trim();
  if (!sid || !iid) throw new Error('updateRequestItem: missing ids');
  const body = sanitizeItem(item);
  return http<any>(`${API_URL}/api/requests/${sid}/items/${iid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteRequestItem(requestId: number | string, itemId: number | string) {
  const sid = String(requestId ?? '').trim();
  const iid = String(itemId ?? '').trim();
  if (!sid || !iid) throw new Error('deleteRequestItem: missing ids');
  return http<any>(`${API_URL}/api/requests/${sid}/items/${iid}`, {
    method: 'DELETE',
  });
}

export async function replaceRequestItems(requestId: number | string, items: RequestItemPayload[]) {
  const sid = String(requestId ?? '').trim();
  if (!sid) throw new Error('replaceRequestItems: missing request id');
  const sanitized = (Array.isArray(items) ? items : []).map(sanitizeItem);
  return http<any>(`${API_URL}/api/requests/${sid}/items`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: sanitized }),
  });
}

// Update a single item's release status (Approved | Rejected)
export async function updateRequestItemStatus(
  requestId: number | string,
  itemId: number | string,
  status: 'Approved' | 'Rejected'
) {
  const sid = String(requestId ?? '').trim();
  const iid = String(itemId ?? '').trim();
  if (!sid || !iid) throw new Error('updateRequestItemStatus: missing ids');
  return http<any>(`${API_URL}/api/requests/${sid}/items/${iid}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

// Trigger RFQ for a single item (server can mark item as RFQ or enqueue an RFQ job)
export async function sendRFQForItem(requestId: number | string, itemId: number | string) {
  const sid = String(requestId ?? '').trim();
  const iid = String(itemId ?? '').trim();
  if (!sid || !iid) throw new Error('sendRFQForItem: missing ids');
  return http<any>(`${API_URL}/api/requests/${sid}/items/${iid}/rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

// -------- API: RFQ --------

export type CreateRfqPayload = {
  requestId: number | string;
  vendorId?: number | string | null;
};

export type UpdateRfqPayload = {
  quotationNo?: string | null;
  status?: string;
  vendorId?: number | string | null;
  vendorName?: string | null;
};

export type UpdateRfqItemPayload = {
  materialNo?: string | null;
  description?: string | null;
  qty?: number;
  unit?: string | null;
  unitPriceSar?: number;
};

export type SendRfqToPoPayload = {
  orderNo?: string | null;
};

function toInt(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function listRfq(params: { includeDeleted?: boolean } = {}) {
  const query = buildQuery(params);
  const raw = await http<any[]>(`${API_URL}/api/rfq${query}`);
  return Array.isArray(raw) ? raw.map(normalizeRfq) : [];
}

export async function getRfq(id: number | string) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('getRfq: missing rfq id');
  const raw = await http<any>(`${API_URL}/api/rfq/${sid}`);
  return normalizeRfq(raw);
}

export async function createOrFetchRfq(payload: CreateRfqPayload) {
  const requestId = toInt(payload?.requestId);
  if (!requestId) throw new Error('createOrFetchRfq: invalid requestId');
  const vendorId = toInt(payload?.vendorId ?? undefined);
  const body: Record<string, any> = { requestId };
  if (payload?.vendorId !== undefined) body.vendorId = vendorId;
  const raw = await http<any>(`${API_URL}/api/rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return normalizeRfq(raw);
}

export async function updateRfq(id: number | string, payload: UpdateRfqPayload) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('updateRfq: missing rfq id');
  const vendorId = payload?.vendorId !== undefined ? toInt(payload.vendorId) : undefined;
  const body: Record<string, any> = {};
  if (payload?.quotationNo !== undefined) body.quotationNo = payload.quotationNo;
  if (payload?.status !== undefined) body.status = payload.status;
  if (payload?.vendorId !== undefined) body.vendorId = vendorId;
  if (payload?.vendorName !== undefined) body.vendorName = payload.vendorName;
  const raw = await http<any>(`${API_URL}/api/rfq/${sid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return normalizeRfq(raw);
}

export async function updateRfqItem(rfqId: number | string, itemId: number | string, payload: UpdateRfqItemPayload) {
  const sid = String(rfqId ?? '').trim();
  const iid = String(itemId ?? '').trim();
  if (!sid || !iid) throw new Error('updateRfqItem: missing ids');
  const body: Record<string, any> = {};
  if (payload?.materialNo !== undefined) body.materialNo = payload.materialNo;
  if (payload?.description !== undefined) body.description = payload.description;
  if (payload?.qty !== undefined) body.qty = payload.qty;
  if (payload?.unit !== undefined) body.unit = payload.unit;
  if (payload?.unitPriceSar !== undefined) body.unitPriceSar = payload.unitPriceSar;
  const raw = await http<any>(`${API_URL}/api/rfq/${sid}/items/${iid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return normalizeRfq(raw);
}

export async function deleteRfq(id: number | string) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('deleteRfq: missing rfq id');
  const raw = await http<any>(`${API_URL}/api/rfq/${sid}`, { method: 'DELETE' });
  return normalizeRfq(raw);
}

export async function sendRfqToPurchaseOrder(id: number | string, payload: SendRfqToPoPayload = {}) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('sendRfqToPurchaseOrder: missing rfq id');
  const body = dropUndefined({ orderNo: payload?.orderNo ?? undefined });
  return http<{ poId: number }>(`${API_URL}/api/rfq/${sid}/send-to-po`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// -------- API: Purchase Orders --------

export type UpdatePurchaseOrderPayload = {
  status?: string;
  completed?: boolean;
  department?: string | null;
  poDate?: string | null;
  totalAmountSar?: number;
  machine?: string | null;
};

export async function listPurchaseOrders(): Promise<PurchaseOrderDTO[]> {
  const raw = await http<any[]>(`${API_URL}/api/orders`);
  return Array.isArray(raw) ? raw.map(normalizePurchaseOrder) : [];
}

export async function getPurchaseOrder(id: number | string) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('getPurchaseOrder: missing id');
  const raw = await http<any>(`${API_URL}/api/orders/${sid}`);
  return normalizePurchaseOrder(raw);
}

export async function updatePurchaseOrder(id: number | string, payload: UpdatePurchaseOrderPayload) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('updatePurchaseOrder: missing id');
  const body: Record<string, any> = {};
  if (payload?.status !== undefined) body.status = payload.status;
  if (payload?.completed !== undefined) body.completed = payload.completed;
  if (payload?.department !== undefined) body.department = payload.department;
  if (payload?.poDate !== undefined) body.poDate = payload.poDate;
  if (payload?.totalAmountSar !== undefined) body.totalAmountSar = payload.totalAmountSar;
  if (payload?.machine !== undefined) body.machine = payload.machine;
  const raw = await http<any>(`${API_URL}/api/orders/${sid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return normalizePurchaseOrder(raw);
}

export async function deletePurchaseOrder(id: number | string) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('deletePurchaseOrder: missing id');
  const raw = await http<any>(`${API_URL}/api/orders/${sid}`, { method: 'DELETE' });
  return normalizePurchaseOrder(raw);
}

export async function getSpendByMachine() {
  const raw = await http<Array<{ machine: string; totalSar: number }>>(`${API_URL}/api/orders/analytics/spend-by-machine`);
  return Array.isArray(raw)
    ? raw.map((entry) => ({ machine: entry.machine || 'Unassigned', totalSar: Number(entry.totalSar ?? 0) || 0 }))
    : [];
}

// -------- API: Tasks (Discussion Board) --------
export type TaskListParams = {
  status?: TaskStatus | "all"; // filter by status, or 'all'
  search?: string;              // search by title
  assignee?: string | null;
  label?: string | null;
  refType?: Task['refType'] | null;
  refId?: number | string | null;
  sort?: "createdAt" | "dueDate" | "priority" | "order";
  order?: "asc" | "desc";
};

export async function listTasks(params: TaskListParams = {}) {
  const query = buildQuery({
    status: params.status,
    search: params.search,
    assignee: params.assignee,
    label: params.label,
    refType: params.refType,
    refId: params.refId,
    sort: params.sort,
    order: params.order,
  });
  return http<{ ok: true; data: Task[] }>(`${API_URL}/api/tasks${query}`);
}

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  status?: TaskStatus; // default TODO
  priority?: string | null; // e.g. High | Medium | Low
  assignee?: string | null;
  label?: string | null;
  dueDate?: string | null; // ISO string
  refType?: Task['refType'] | null;
  refId?: number | null;
  custom?: Record<string, any> | null;
};

export async function createTask(payload: CreateTaskPayload) {
  const body: any = dropUndefined({ ...payload });
  return http<{ ok: true; data: Task }>(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type UpdateTaskPayload = Partial<CreateTaskPayload> & {
  commentsCount?: number;
};

export async function updateTask(id: number | string, payload: UpdateTaskPayload) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('updateTask: missing id');
  const body: any = dropUndefined({ ...payload });
  return http<{ ok: true; data: Task }>(`${API_URL}/api/tasks/${sid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteTask(id: number | string) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('deleteTask: missing id');
  return http<{ ok: true }>(`${API_URL}/api/tasks/${sid}`, { method: "DELETE" });
}

export async function moveTask(
  id: number | string,
  opts: { toStatus?: TaskStatus | string; toIndex: number }
) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('moveTask: missing id');
  const body = { toStatus: opts?.toStatus, toIndex: Number(opts?.toIndex) };
  return http<{ ok: true; data: Task }>(`${API_URL}/api/tasks/${sid}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// -------- API: Inventory --------

export type InventoryListParams = {
  search?: string;
  status?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'code' | 'name' | 'qty' | 'lowQty';
  sortDir?: 'asc' | 'desc';
};

export type InventoryWarehouse = {
  id: number;
  code: string;
  name: string;
};

export type InventoryItemDTO = {
  id: number;
  itemCode: string;
  itemDescription: string;
  materialNo?: string;
  name?: string;
  category?: string | null;
  categoryParent?: string | null;
  picture?: string | null;
  unit?: string | null;
  bigUnit?: string | null;
  unitCost?: number | null;
  qty?: number;
  reorder?: number;
  qtyOnHand?: number;
  reorderPoint?: number;
  lowStock?: boolean;
  lastMovementAt?: string | null;
  warehouse?: string | InventoryWarehouse | null;
  warehouseId?: number | null;
  storeId?: number | null;
  store?: string | null;
  storeCode?: string | null;
};

export type InventoryMovementDTO = {
  id: number;
  itemId: number;
  moveType: 'IN' | 'OUT' | 'ADJUST';
  qty: number;
  note?: string | null;
  createdAt: string;
};

export type CreateInventoryItemPayload = {
  itemCode?: string;
  materialNo?: string;
  itemDescription?: string;
  name?: string;
  category?: string;
  categoryParent?: string;
  picture?: string;
  unit?: string;
  bigUnit?: string;
  unitCost?: number;
  qtyOnHand?: number;
  qty?: number;
  quantity?: number;
  reorderPoint?: number;
  reorder?: number;
  lowQty?: number;
  warehouseId?: number;
  warehouse?: string;
  warehouseLabel?: string;
  storeId?: number;
  store?: string;
};

export async function getInventoryItems(params: InventoryListParams = {}) {
  const query = buildQuery({
    search: params.search,
    status: params.status && params.status !== 'all' ? params.status : undefined,
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  });
  return http<{ items: InventoryItemDTO[]; total: number; page: number; pageSize: number }>(
    `${API_URL}/api/inventory/items${query}`,
  );
}

export type UpdateInventoryItemPayload = Partial<Omit<CreateInventoryItemPayload, 'materialNo'>> & {
  warehouseId?: number | null;
  reorderPoint?: number;
};

export async function updateInventoryItem(id: number, body: UpdateInventoryItemPayload) {
  const payload = dropUndefined({ ...body });
  return http<InventoryItemDTO>(`${API_URL}/api/inventory/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteInventoryItem(id: number) {
  const res = await fetch(`${API_URL}/api/inventory/items/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    let detail: any;
    try { detail = await res.json(); } catch {}
    const msg = detail?.message || detail?.error || res.statusText || 'Delete failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
}

export type CreateInventoryMovementPayload = {
  moveType: 'IN' | 'OUT' | 'ADJUST';
  qty: number;
  note?: string;
  orderId?: number;
  sourceWarehouseId?: number;
  destinationWarehouseId?: number;
  sourceWarehouse?: string;
  destinationWarehouse?: string;
  sourceStoreId?: number;
  destinationStoreId?: number;
};

export async function createMovement(id: number, body: CreateInventoryMovementPayload) {
  const payload = dropUndefined({ ...body });
  return http<InventoryItemDTO>(`${API_URL}/api/inventory/items/${id}/movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getMovements(id: number, params: { page?: number; pageSize?: number } = {}) {
  const query = buildQuery({ page: params.page, pageSize: params.pageSize });
  return http<{ movements: InventoryMovementDTO[]; total: number; page: number; pageSize: number }>(
    `${API_URL}/api/inventory/items/${id}/movements${query}`,
  );
}

// -------- API: Fleet --------

export type VehicleListParams = {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
};

export type VehicleDTO = {
  id: number;
  plateNo: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  department?: string | null;
  status: string;
  odometer?: number | null;
  lastServiceAt?: string | null;
};

export type MaintenanceRecordDTO = {
  id: number;
  type: string;
  date: string;
  costSar: number;
  vendorName?: string | null;
  odometer?: number | null;
  notes?: string | null;
  vehicle?: VehicleDTO | null;
};

export async function getVehicles(params: VehicleListParams = {}) {
  const query = buildQuery({
    search: params.search,
    status: params.status,
    department: params.department,
    page: params.page,
    pageSize: params.pageSize,
  });
  return http<{ vehicles: VehicleDTO[]; total: number; page: number; pageSize: number }>(
    `${API_URL}/api/fleet/vehicles${query}`,
  );
}

export type CreateVehiclePayload = {
  plateNo: string;
  make?: string;
  model?: string;
  year?: number;
  department?: string;
  status?: string;
  odometer?: number;
};

export async function createVehicle(body: CreateVehiclePayload) {
  const payload = dropUndefined({ ...body });
  return http<VehicleDTO>(`${API_URL}/api/fleet/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export async function updateVehicle(id: number, body: UpdateVehiclePayload) {
  const payload = dropUndefined({ ...body });
  return http<VehicleDTO>(`${API_URL}/api/fleet/vehicles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicle(id: number) {
  const res = await fetch(`${API_URL}/api/fleet/vehicles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    let detail: any;
    try { detail = await res.json(); } catch {}
    const msg = detail?.message || detail?.error || res.statusText || 'Delete failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
}

export type AddMaintenancePayload = {
  type: string;
  date?: string;
  costSar?: number;
  vendorName?: string;
  odometer?: number;
  notes?: string;
};

export async function addMaintenance(vehicleId: number, body: AddMaintenancePayload) {
  const payload = dropUndefined({ ...body });
  return http<{ maintenance: MaintenanceRecordDTO; vehicle: VehicleDTO }>(
    `${API_URL}/api/fleet/vehicles/${vehicleId}/maintenance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export type MaintenanceListParams = {
  vehicleId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export async function getMaintenance(params: MaintenanceListParams = {}) {
  const query = buildQuery({
    vehicleId: params.vehicleId,
    from: params.from,
    to: params.to,
    page: params.page,
    pageSize: params.pageSize,
  });
  return http<{ records: MaintenanceRecordDTO[]; total: number; page: number; pageSize: number }>(
    `${API_URL}/api/fleet/maintenance${query}`,
  );
}
