import { RequestCreateDTO, RequestUpdateDTO } from "../types";
import type { Task, TaskStatus } from "../types";

export type CreateRequestPayload = {
  orderNo: string;
  type: string;
  department: string;
  warehouse?: string;
  vendor?: string;
  notes?: string;
  items: {
    name: string;
    code?: string;
    qty: number;
    unit?: string;
    note?: string;
  }[];
};
export type RequestDTO = {
  id: string | number;
  orderNo?: string;
  vendor?: string;
  department?: string;
  warehouse?: string;
  requiredDate?: string;
  createdAt?: string;
  status?: string;
  title?: string;
  quantity?: number;
  items?: Array<{
    name?: string;
    code?: string;
    qty: number;
    unit?: string;
    note?: string;
  }>;
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

function sanitizeItem(input: any) {
  const name = input?.name ?? input?.itemName ?? input?.description ?? "";
  const code = input?.code ?? input?.itemCode ?? input?.materialCode ?? undefined;
  const qty = Number(input?.qty) || 0;
  const unit = input?.unit ?? undefined;
  const note = typeof input?.note === "string" ? input.note : (input?.note ? JSON.stringify(input.note) : undefined);
  return dropUndefined({ name, code, qty, unit, note });
}

function sanitizeCreatePayload(input: any) {
  const orderNo = String(input?.orderNo || "").trim();
  const type = input?.type;
  const department = input?.department;
  const vendor = input?.vendor ? String(input.vendor).trim() : undefined;
  const notes = input?.notes ? String(input.notes).trim() : undefined;
  const requiredDate = input?.requiredDate || input?.date || undefined;
  const warehouse = input?.warehouse ? String(input.warehouse).trim() : undefined;
  const rawItems = Array.isArray(input?.items) ? input.items.map(sanitizeItem) : [];
  const items = rawItems.filter((it: any) => it.name || it.code || (it.qty && it.qty > 0) || it.unit || it.note);
  return dropUndefined({ orderNo, type, department, vendor, notes, requiredDate, warehouse, items });
}

function sanitizeUpdatePayload(input: any) {
  // allow updating order number; accept either orderNo or requestNo from callers
  const orderNoRaw = input?.orderNo ?? input?.requestNo;
  const orderNo = orderNoRaw !== undefined ? String(orderNoRaw).trim() : undefined;

  const type = input?.type;
  const department = input?.department;
  const vendor = input?.vendor ? String(input.vendor).trim() : undefined;
  const notes = input?.notes ? String(input.notes).trim() : undefined;
  const requiredDate = input?.requiredDate || input?.date || undefined;
  const warehouse = input?.warehouse ? String(input.warehouse).trim() : undefined;

  let items: any = undefined;
  if (Array.isArray(input?.items)) {
    const mapped = input.items.map(sanitizeItem).filter((it: any) => it.name || it.code || (it.qty && it.qty > 0) || it.unit || it.note);
    if (mapped.length > 0) {
      items = mapped;
    }
  }

  return dropUndefined({ orderNo, type, department, vendor, notes, requiredDate, warehouse, items });
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

function normalizeItems(items: any[] = []) {
  return items.map((it: any) => {
    const name = it?.name ?? it?.itemName ?? it?.description ?? "";
    const code = it?.code ?? it?.itemCode ?? it?.materialCode ?? undefined;
    const qty = Number(it?.qty) || 0;
    const unit = it?.unit ?? undefined;
    const note = typeof it?.note === "string" ? it.note : (it?.note ? JSON.stringify(it.note) : undefined);
    return dropUndefined({ name, code, qty, unit, note });
  });
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
  const raw = await http<Paginated<RequestDTO>>(`${API_URL}/api/requests${query}`);
  const mappedResult = {
    ...raw,
    items: (raw.items || []).map((r: any) => ({
      ...r,
      items: normalizeItems(r.items || []),
    })),
  };
  return mappedResult as Paginated<RequestDTO>;
}

// Backward-compat helper
export async function getRequests() {
  return listRequests();
}

export async function createRequest(payload: CreateRequestPayload) {
  const body = sanitizeCreatePayload(payload as any);
  return http<any>(`${API_URL}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateRequest(id: number | string, payload: RequestUpdateDTO) {
  const sid = String(id ?? '').trim();
  if (!sid) {
    throw new Error('updateRequest: missing request id');
  }
  const body = sanitizeUpdatePayload(payload as any);
  const url = `${API_URL}/api/requests/${sid}`;
  // eslint-disable-next-line no-console
  console.debug('[api] PATCH', url, body);
  return http<any>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteRequest(id: number | string) {
  return http<any>(`${API_URL}/api/requests/${String(id)}`, { method: "DELETE" });
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
