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
};

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
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
  const explicitNote = typeof input?.note === 'string' ? input.note : undefined;

  const meta: Record<string, any> = {};
  if (code) meta.code = code;
  if (machine) meta.machine = machine;
  if (warehouse) meta.warehouse = warehouse;
  if (requester) meta.requester = requester;

  let note = explicitNote;
  if (!note && Object.keys(meta).length) {
    try {
      note = JSON.stringify(meta);
    } catch {
      note = undefined;
    }
  }

  return dropUndefined({ name, code, qty, unit, note });
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
  });
}

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
  });

  return { ...base, items } as RequestDTO;
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

// -------- API: Tasks (Discussion Board) --------
export type TaskListParams = {
  status?: TaskStatus | "all"; // filter by status, or 'all'
  search?: string;              // search by title
  sort?: "createdAt" | "dueDate" | "priority" | "order";
  order?: "asc" | "desc";
};

export async function listTasks(params: TaskListParams = {}) {
  const query = buildQuery({
    status: params.status,
    search: params.search,
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
