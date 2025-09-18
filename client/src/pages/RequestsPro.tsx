import React from "react";
import { motion } from "framer-motion";
import HeaderBar, { type HeaderAction } from "../components/ui/HeaderBar";
import { Plus, UploadCloud, DownloadCloud } from "lucide-react";

import LineItemsTable from "../components/requests/LineItemsTable";
import type { LineItem } from "../components/requests/LineItemRow";

import { listRequests, createRequest as apiCreateRequest, uploadRequestFile, updateRequestStatus, deleteRequest } from "../lib/api";
import type { RequestCreateDTO } from "../types";

import Button from "../components/ui/Button";
import ReactECharts from "echarts-for-react";
import { Maximize2, X } from "lucide-react";
import EditRequestModal from "../components/requests/EditRequestModal";
import RequestTracker from "../components/requests/RequestTracker";
import MiniDiscussion from "../components/requests/MiniDiscussion";
import QuickReports from "../components/requests/QuickReports";
import AttachmentsVaultMini from "../components/requests/AttachmentsVaultMini";
import ApprovalsCenter from "../components/requests/ApprovalsCenter";
import QuotationsTable from "../components/requests/QuotationsTable";
import { StatCard } from "../components/shared";

function IconDoc(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8 13h8M8 17h6M8 9h4" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

const twRow = (i:number) => "border-b last:border-0 " + (i % 2 ? "bg-white" : "bg-gray-50/50");

type RequestLine = {
  id: string;            // UI row id
  reqId?: string;        // backend request id (for status updates)
  requestNo: string;
  createdAt?: string;
  vendor: string;
  requiredDate: string;
  materialCode: string;
  description: string;
  quantity: number;
  uom: string;
  department: string;
  machine: string;
  warehouse?: string;
  requester?: string;
  status: "NEW" | "RFQ" | "APPROVED";
};
// --- helpers for parsing/formatting ---
function parseNoteJSON(note?: string): any {
  if (!note) return {};
  try { return JSON.parse(note); } catch { return {}; }
}
function fmtDate(v?: string | Date): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
function mostCommon(arr: (string | undefined)[]): string {
  const m: Record<string, number> = {};
  for (const x of arr) {
    const k = (x || "").trim();
    if (!k) continue;
    m[k] = (m[k] || 0) + 1;
  }
  let best = "", n = 0;
  for (const [k, v] of Object.entries(m)) if (v > n) { best = k; n = v; }
  return best || "—";
}
// --------------------------------------

const ItemsContext = React.createContext<{
  items: RequestLine[];
  header: Partial<{ requestNo: string; vendor: string; requiredDate: string; department: string }>;
  updateHeader: (patch: Partial<{ requestNo: string; vendor: string; requiredDate: string; department: string }>) => void;
  addItem: (r: Omit<RequestLine, "id" | "status">) => void;
  updateItem: (id: string, patch: Partial<RequestLine>) => void;
  removeItem: (id: string) => void;
  toRFQ: (id: string) => void;
} | null>(null);

function useItems() {
  const ctx = React.useContext(ItemsContext);
  if (!ctx) throw new Error("ItemsContext missing");
  return ctx;
}

function RequestHeaderForm() {
  const { updateHeader } = useItems();
  const [requestNo, setRequestNo] = React.useState("");
  const [vendor, setVendor] = React.useState("");
  const [requiredDate, setRequiredDate] = React.useState<string>(toDateInput(new Date()));
  const [department, setDepartment] = React.useState("Production");

  React.useEffect(() => {
    updateHeader({ requestNo, vendor, requiredDate, department });
  }, [requestNo, vendor, requiredDate, department, updateHeader]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <input className="h-10 rounded-xl border px-3 text-sm input-focus" placeholder="Request No" value={requestNo} onChange={(e)=>setRequestNo(e.currentTarget.value)} />
      <input className="h-10 rounded-xl border px-3 text-sm input-focus" placeholder="Vendor" value={vendor} onChange={(e)=>setVendor(e.currentTarget.value)} />
      <input
        type="date"
        className="h-10 rounded-xl border px-3 text-sm input-focus"
        value={requiredDate}
        onChange={(e) => setRequiredDate(e.currentTarget.value)}
      />
      <div className="relative">
        <select className="h-10 w-full rounded-xl border px-3 pr-8 text-sm input-focus appearance-none bg-white" value={department} onChange={(e)=>setDepartment(e.currentTarget.value)}>
          {["Production","Maintenance","Procurement","Logistics","Quality","IT","Operations"].map(d=> <option key={d}>{d}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M6 8l4 4 4-4H6z"/></svg>
        </span>
      </div>
    </div>
  );
}

function MaterialLineForm() {
  const { addItem, header } = useItems();
  const [materialCode, setMaterialCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [uom, setUom] = React.useState("pcs");
  // Removed department state
  const [machine, setMachine] = React.useState("—");

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    addItem({
      requestNo: header.requestNo || `${Date.now()}`.slice(-6),
      vendor: header.vendor || "",
      requiredDate: header.requiredDate || "",
      materialCode: materialCode.trim(),
      description: description.trim(),
      quantity: quantity || 1,
      uom,
      department: header.department || "Production",
      machine,
    });
    setMaterialCode(""); setDescription(""); setQuantity(1); setUom("pcs"); /* removed setDepartment */ setMachine("—");
  }

  return (
    <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <input className="h-10 rounded-xl border px-3 text-sm input-focus" placeholder="Material Code" value={materialCode} onChange={(e)=>setMaterialCode(e.currentTarget.value)} />
      <input className="h-10 rounded-xl border px-3 text-sm md:col-span-2 input-focus" placeholder="Description" value={description} onChange={(e)=>setDescription(e.currentTarget.value)} />
      <input type="number" min={1} className="h-10 rounded-xl border px-3 text-sm text-right input-focus" placeholder="Qty" value={quantity} onChange={(e)=>setQuantity(Number(e.currentTarget.value))} />
      <input className="h-10 rounded-xl border px-3 text-sm input-focus" placeholder="UOM" value={uom} onChange={(e)=>setUom(e.currentTarget.value)} />
      {/* Removed department select */}
      <input className="h-10 rounded-xl border px-3 text-sm input-focus" placeholder="Machine" value={machine} onChange={(e)=>setMachine(e.currentTarget.value)} />
      <div className="md:col-span-5 flex justify-end">
        <Button type="submit">Add Material</Button>
      </div>
    </form>
  );
}

function RequestItemsRows() {
  const { items, updateItem, removeItem, toRFQ } = useItems();
  if (!items.length) {
    return (
      <tr>
        <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
          No materials yet — add your first line above.
        </td>
      </tr>
    );
  }
  return (
    <>
      {items.map((r, idx) => (
        <tr key={r.id} className={twRow(idx)}>
          <td className="px-3 py-4 whitespace-nowrap font-medium text-gray-800">{r.requestNo}</td>
          <td className="px-3 py-4">{r.description}</td>
          <td className="px-3 py-4">{r.vendor || "—"}</td>
          <td className="px-3 py-4">{r.requiredDate || "—"}</td>
          <td className="px-3 py-4 text-right">{r.quantity}</td>
          <td className="px-3 py-4">{r.uom}</td>
          <td className="px-3 py-4">{r.department}</td>
          <td className="px-3 py-4">{r.machine}</td>
          <td className="px-3 py-4 text-right">
            <div className="inline-flex gap-3 text-gray-500">
              <button className="hover:text-primary-600" title="Edit" onClick={()=>updateItem(r.id, {})}>✏️</button>
              <button className="hover:text-danger" title="Delete" onClick={()=>removeItem(r.id)}>🗑️</button>
              <button className="hover:text-primary-600" title="Convert to RFQ" onClick={()=>toRFQ(r.id)}>🧾 RFQ</button>
            </div>
          </td>
          <td className="px-3 py-4 text-right">
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500"></span> {r.status}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function RequestsPro() {
  const [items, setItems] = React.useState<RequestLine[]>([]);
  const [header, setHeader] = React.useState<Partial<{ requestNo: string; vendor: string; requiredDate: string; department: string }>>({ requestNo: "", vendor: "", requiredDate: "", department: "Production" });
  const [openNew, setOpenNew] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editInitial, setEditInitial] = React.useState<any>(null);
  // Server-driven filters & pagination (Step 5)
  const [filters, setFilters] = React.useState<{ q?: string; status?: string; department?: string; vendor?: string; warehouse?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortDir?: 'asc'|'desc'; page: number; pageSize: number }>({ page: 1, pageSize: 20 });
  const [searchText, setSearchText] = React.useState<string>("");
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error,   setError]   = React.useState<string | null>(null);

  // NOTE: listRequests mapping — No changes needed for header-level Warehouse/Requester/Machine (Step 5)
  // Current backend (RequestCreateDTO) has no official header fields for these. We keep parsing
  // only line-level extras from `item.note` (JSON) via parseNoteJSON().
  // If backend later adds header-level specs (e.g. r.specs, r.warehouse, r.requester, r.machine),
  // we can extend the mapping here to surface them in the table header/expand summary.
  const refreshList = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listRequests({
        q: filters.q,
        status: filters.status,
        department: filters.department,
        vendor: filters.vendor,
        warehouse: filters.warehouse,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        page: filters.page,
        pageSize: filters.pageSize,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      });
      setTotal(res.total || 0);
      // Map API -> UI line-level structure
      const mapped: RequestLine[] = [];
      for (const r of res.items || []) {
        // Prefer orderNo from API, fallback to id, else generate unique fallback
        const reqNo = r.orderNo
          ? r.orderNo.toString()
          : r.id
          ? r.id.toString()
          : `REQ-${Date.now()}`;
        const vendor = (r.vendor || (r as any).vendorName || (r as any).supplier || "—") as string;
        const department = r.department ?? "Production";
        const status = (r.status ?? "NEW").toString().toUpperCase();
        const itemsArr = Array.isArray(r.items) && r.items.length ? r.items : [null];
        itemsArr.forEach((it: any, idx: number) => {
          const extra = parseNoteJSON(it?.note);
          mapped.push({
            id: `${r.id ?? reqNo}-${idx}`,
            reqId: (r as any).id,
            requestNo: reqNo,
            createdAt: fmtDate(r.createdAt ?? ""),
            vendor,
            requiredDate: fmtDate(r.requiredDate ?? r.createdAt ?? ""),
            materialCode: (it?.code ?? (it as any)?.itemCode ?? (it as any)?.item_code ?? ""),
            description: (it?.name ?? (it as any)?.itemName ?? (it as any)?.item_name ?? r.title ?? ""),
            quantity: Number(it?.qty ?? r.quantity ?? 1) || 1,
            uom: it?.unit ?? "pcs",
            department,
            machine: (extra?.machine ?? it?.machine ?? (it as any)?.machineName ?? "—"),
            warehouse: (r as any).warehouse ?? it?.warehouse ?? extra?.warehouse ?? "",
            requester: it?.requester ?? extra?.requester ?? "",
            status: status === "QUOTATION" ? "RFQ" : (status === "APPROVED" ? "APPROVED" : "NEW"),
          });
        });
      }
      setItems(mapped);
    } catch (e: any) {
      console.error("listRequests failed", e);
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleChangeStatus = React.useCallback(async (reqId: string | undefined, next: 'RFQ'|'APPROVED'|'COMPLETED') => {
    if (!reqId) { alert('Missing request id'); return; }
    try {
      await updateRequestStatus(reqId, next);
      await refreshList();
    } catch (e: any) {
      console.error('updateRequestStatus failed', e);
      alert(e?.message || 'Failed to update status');
    }
  }, [refreshList]);

  const handleEditLine = React.useCallback((reqId: string | undefined, line: { id: string | number }) => {
    console.log("edit line (placeholder)", { reqId, line });
    alert("Edit Item coming soon");
  }, []);
  const handleDeleteLine = React.useCallback((reqId: string | undefined, lineId: string) => {
    console.log("delete line (placeholder)", { reqId, lineId });
    alert("Delete Item coming soon");
  }, []);
  const handleApproveLine = React.useCallback((reqId: string | undefined, lineId: string) => {
    console.log("approve line (placeholder)", { reqId, lineId });
    if (reqId) handleChangeStatus(reqId, "APPROVED");
  }, [handleChangeStatus]);
  const handleRejectLine = React.useCallback((reqId: string | undefined, lineId: string) => {
    console.log("reject line (placeholder)", { reqId, lineId });
    alert("Reject Item coming soon");
  }, []);
  const handleSendRFQ = React.useCallback((reqId: string | undefined, lineId: string) => {
    console.log("send RFQ (placeholder)", { reqId, lineId });
    if (reqId) handleChangeStatus(reqId, "RFQ");
  }, [handleChangeStatus]);

  React.useEffect(() => { refreshList(); }, [refreshList]);

  const ctxValue = React.useMemo(() => ({
    items,
    header,
    updateHeader: (patch: Partial<typeof header>) => setHeader((h) => ({ ...h, ...patch })),
    addItem: (r: Omit<RequestLine, "id" | "status">) => {
      setItems((prev) => [...prev, { id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), status: "NEW", ...r }]);
    },
    updateItem: (id: string, patch: Partial<RequestLine>) => {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    },
    removeItem: (id: string) => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    },
    toRFQ: (id: string) => {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "RFQ" } : x)));
    },
  }), [items, header]);

  const searchRef = React.useRef<HTMLInputElement>(null);
  // Debounce search input into filters.q
  React.useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, q: searchText || undefined, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  // Keep URL in sync with filters (Step 6)
  React.useEffect(() => {
    const usp = new URLSearchParams();
    if (filters.q) usp.set('q', filters.q);
    if (filters.status) usp.set('status', filters.status);
    if (filters.department) usp.set('department', filters.department);
    if (filters.vendor) usp.set('vendor', filters.vendor);
    if (filters.warehouse) usp.set('warehouse', filters.warehouse);
    if (filters.dateFrom) usp.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) usp.set('dateTo', filters.dateTo);
    if (filters.sortBy) usp.set('sortBy', filters.sortBy);
    if (filters.sortDir) usp.set('sortDir', filters.sortDir);
    usp.set('page', String(filters.page));
    usp.set('pageSize', String(filters.pageSize));
    const qs = usp.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [filters]);

  // Removed Discussion Board / Tasks for focused Requests redesign

  // Focus search on mount
  React.useEffect(() => {
    if (searchRef.current) searchRef.current.placeholder = "Search requests…  (⌘K)";
  }, []);

  // Keyboard shortcuts: ⌘K / Ctrl+K to focus, Shift+N to open modal
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.shiftKey && (e.key === "N" || e.key === "n")) {
        e.preventDefault();
        setOpenNew(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --- Inserted UI states for pulse and count ---
  const [showPulse, setShowPulse] = React.useState(true);
  const [totalRequests] = React.useState<number>(0); // TODO: replace with API count
  React.useEffect(() => {
    const t = setTimeout(() => setShowPulse(false), 1800);
    return () => clearTimeout(t);
  }, []);
  // ----------------------------------------------

  // ----- Derived views for new blocks -----
  const requestHeaders = React.useMemo(() => {
    const m = new Map<string, { reqId?: string; requestNo: string; vendor?: string; department?: string; status: 'NEW'|'RFQ'|'APPROVED'|'COMPLETED'; requiredDate?: string; quantity?: number; lines: number }>();
    for (const it of items) {
      const k = it.requestNo || String(it.reqId || '—');
      const prev = m.get(k) || { reqId: it.reqId as any, requestNo: it.requestNo, vendor: it.vendor, department: it.department, status: it.status, requiredDate: it.requiredDate, quantity: 0, lines: 0 };
      prev.reqId = (prev.reqId || it.reqId) as any;
      prev.vendor = prev.vendor || it.vendor;
      prev.department = prev.department || it.department;
      prev.status = it.status; // last wins
      prev.requiredDate = prev.requiredDate || it.requiredDate;
      prev.quantity = (prev.quantity || 0) + (it.quantity || 0);
      prev.lines += 1;
      m.set(k, prev);
    }
    return Array.from(m.values());
  }, [items]);

  const quotes = React.useMemo(() => {
    const rows: Array<{ requestNo:string; vendor:string; item:string; price:number; currency:string; validity:string }> = [];
    const byReq = new Map<string, { vendor?: string; date?: string }>();
    requestHeaders.forEach(h => byReq.set(h.requestNo, { vendor: h.vendor, date: h.requiredDate }));
    items.filter(i => i.status === 'RFQ').slice(0,50).forEach((it) => {
      const meta = byReq.get(it.requestNo) || {};
      const base = Math.max(1, Number(it.quantity || 1));
      const price = Math.round(base * 95 + (base % 7) * 12) * 10;
      const date = meta.date ? new Date(meta.date) : new Date();
      const validity = new Date(date.getTime() + 14*86400000).toISOString().slice(0,10);
      rows.push({ requestNo: it.requestNo, vendor: meta.vendor || it.vendor || 'Vendor', item: it.materialCode || it.description || '—', price, currency:'SAR', validity });
    });
    return rows.slice(0, 12);
  }, [items, requestHeaders]);

  return (
    <ItemsContext.Provider value={ctxValue}>
      <div className="p-6 space-y-4">
        {/* Header with title + search + CTA */}
        <HeaderBar
          title="Requests"
          onSearch={(s)=> setSearchText(s)}
          searchPlaceholder="Search requests…"
          actions={[
            { key: 'template', label: 'Template', icon: <DownloadCloud className='w-4 h-4' />, onClick: ()=> window.open('/templates/Purchase_Request_Template.xlsx','_blank') },
            { key: 'import', label: 'Import', icon: <UploadCloud className='w-4 h-4' />, onClick: ()=> alert('Import requests coming soon') },
            { key: 'new', label: 'New Requests Tool', icon: <Plus className='w-4 h-4' />, onClick: ()=> setOpenNew(true) },
          ]}
        />
        {/* legacy mid-header removed as per new top header design */}

        {/* KPI strip */}
        <div className="u-card p-3"><KPIBar /></div>

        {/* Requests table */}
        <RequestListSection
  total={total}
  loading={loading}
  error={error}
  page={filters.page}
  pageSize={filters.pageSize}
  onChangeStatus={handleChangeStatus}
  onEdit={(reqNo, rows) => {
    const header = rows[0];
    const initial = {
      id: header.reqId || header.id,
      requestNo: reqNo,
      date: header.requiredDate || "",
      vendor: header.vendor || "",
      type: "Purchase",
      department: header.department || "IT",
      notes: "",
      lines: rows.map(r => ({
        itemCode: r.materialCode || "",
        itemName: r.description || "",
        qty: String(r.quantity || ""),
        unit: r.uom || "pcs",
        warehouse: "",
        requester: "",
        machine: r.machine || "",
      })),
    } as const;
    setEditInitial(initial as any);
    setOpenEdit(true);
  }}
  onLineEdit={(reqId, item) => handleEditLine(reqId, item)}
  onLineDelete={(reqId, lineId) => handleDeleteLine(reqId, lineId)}
  onLineSendRFQ={(reqId, lineId) => handleSendRFQ(reqId, lineId)}
/>

        {/* Two charts: Status + Department */}
        <AnalyticsSection />

        {/* Discussion + Tasks */}
        <MiniDiscussion requests={requestHeaders.map(h=>({ requestNo: h.requestNo }))} />

        {/* Request Tracker (Lifecycle) */}
        <RequestTracker
          requests={requestHeaders.map(h => ({ reqId: h.reqId, requestNo: h.requestNo, vendor: h.vendor, department: h.department, status: h.status, date: h.requiredDate, lines: h.lines }))}
          onChangeStatus={(id, next)=> handleChangeStatus(String(id), next)}
        />

        {/* Quick Reports (8 cards, 4x4) */}
        <QuickReports requests={requestHeaders.map(h=>({ requestNo:h.requestNo, department:h.department, status:h.status, requiredDate:h.requiredDate, quantity: h.quantity }))} />

        {/* Approvals Center */}
        <ApprovalsCenter rows={requestHeaders.map(h=>({ reqId:h.reqId, requestNo:h.requestNo, requester: '', department:h.department, quantity:h.quantity, status:h.status }))} onApprove={(id)=> handleChangeStatus(String(id), 'APPROVED')} />

        {/* Quotations */}
        <QuotationsTable rows={quotes} />

        {/* Attachments Vault (visual, folders prominent) */}
        <AttachmentsVaultMini requests={requestHeaders.map(h=>({ requestNo:h.requestNo, vendor:h.vendor, department:h.department }))} />

        {/* Modal */}
        {openNew && (
          <NewRequestModal onClose={() => setOpenNew(false)} onCreated={refreshList} />
        )}
        {openEdit && editInitial && (
          <EditRequestModal
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            request={editInitial}
            onUpdated={async (patch?: { id?: string; orderNo?: string; vendor?: string; department?: string; requiredDate?: string; }) => {
              setOpenEdit(false);
              if (patch && (patch.id || patch.orderNo || patch.vendor || patch.department || patch.requiredDate)) {
                setItems(prev => prev.map(r => (
                  (patch.id && r.reqId === patch.id) || (!patch.id && r.requestNo === (editInitial?.requestNo || r.requestNo))
                    ? {
                        ...r,
                        requestNo: patch.orderNo ?? r.requestNo,
                        vendor: patch.vendor ?? r.vendor,
                        department: patch.department ?? r.department,
                        requiredDate: patch.requiredDate ? fmtDate(patch.requiredDate) : r.requiredDate,
                      }
                    : r
                )));
              }
              await refreshList();
            }}
          />
        )}
      </div>
    </ItemsContext.Provider>
  );
}
function KPIBar() {
  const { items } = useItems();
  const counts = React.useMemo(() => {
    const c = { total: items.length, NEW: 0, RFQ: 0, APPROVED: 0 } as any;
    for (const it of items) c[it.status] = (c[it.status] || 0) + 1;
    return c;
  }, [items]);
  const cards = [
    { label: 'Total Requests', value: counts.total, delta: null },
    { label: 'Pending Approval', value: counts.NEW, delta: null },
    { label: 'Awaiting Quotes', value: counts.RFQ, delta: null },
    { label: 'Approved', value: counts.APPROVED, delta: null },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <motion.div key={c.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
          <StatCard label={c.label} value={c.value} className="h-full" />
        </motion.div>
      ))}
    </div>
  );
}
function AnalyticsSection() {
  const { items } = useItems();

  // Aggregate by status
  const statusCounts = React.useMemo(() => {
    const m: Record<string, number> = { NEW: 0, RFQ: 0, APPROVED: 0 };
    for (const it of items) m[it.status] = (m[it.status] || 0) + 1;
    return m;
  }, [items]);

  // Aggregate by department
  const deptCounts = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of items) m[it.department] = (m[it.department] || 0) + 1;
    return m;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Requests by Status">
          <RosePie data={[
            { name:'NEW', value: statusCounts.NEW || 0 },
            { name:'RFQ', value: statusCounts.RFQ || 0 },
            { name:'APPROVED', value: statusCounts.APPROVED || 0 },
          ]} />
        </ChartCard>
        <ChartCard title="Requests by Department">
          <RosePie data={Object.entries(deptCounts).map(([k,v])=> ({ name:k, value:v }))} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children, rightSlot }: { title: string; children: React.ReactNode; rightSlot?: React.ReactNode }) {
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.35}} className="card card-p transition duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          {rightSlot}
          <div className="inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs text-gray-600 bg-gray-50">Demo</div>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function ScatterAggregateBar({ months, series }: { months: string[]; series: Record<string, number[]> }) {
  const totals = months.map((_, idx) => Object.values(series).reduce((s, arr) => s + (arr[idx] || 0), 0));
  // scatter points: dept counts per month
  const scatterPoints: [number, number][] = [];
  Object.values(series).forEach((arr) => arr.forEach((v, mIdx) => scatterPoints.push([mIdx, v])));
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 16, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: '#e5e7eb' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e5e7eb' } } },
    series: [
      { type: 'bar', name: 'Total', data: totals, itemStyle: { color: '#3B82F6', borderRadius:[6,6,0,0] }, animationDuration: 700 },
      { type: 'scatter', name: 'Dept', data: scatterPoints.map(([x,y])=> ({ value:[months[x], y] })), symbolSize: (val:any)=> 6 + (val[1]||0)*0.8, itemStyle:{ color:'#F59E0B' }, animationDuration: 700 }
    ]
  } as any;
  return <div className="h-56"><ReactECharts option={option} style={{ height: '100%' }} notMerge /></div>;
}

function RosePie({ data }: { data: Array<{ name: string; value: number }> }) {
  const option = {
    tooltip: { trigger:'item', formatter:'{b}: {c} ({d}%)' },
    legend: { bottom: 0, icon: 'circle' },
    series: [{ type:'pie', radius:[30, 120], center:['50%','48%'], roseType:'area', itemStyle:{ borderRadius:8 }, data, animationDuration: 700 }]
  } as any;
  return <div className="h-80"><ReactECharts option={option} style={{ height: '100%' }} notMerge /></div>;
}

function FSModal({ title, onClose, children }: { title: string; onClose: ()=>void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[1200px] h-[84vh] bg-white rounded-2xl shadow-2xl border" onClick={(e)=> e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">{title}</div>
          <button className="px-2 py-1 text-sm rounded border hover:bg-gray-50 inline-flex items-center gap-1" onClick={onClose}>
            <X className="w-4 h-4" /> Close
          </button>
        </div>
        <div className="h-[calc(84vh-48px)] p-2">
          <div className="w-full h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
function monthIndex(it: { requiredDate?: string; id: string }) {
  if (it.requiredDate) {
    const d = new Date(it.requiredDate);
    if (!isNaN(d.getTime())) return d.getMonth(); // 0..11
  }
  return Math.abs(hashCode(it.id)) % 12; // fallback للتوزيع لو مفيش تاريخ
}
function hashCode(str: string) {
  let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return h;
}

function RequestListSection({
  total,
  loading,
  error,
  page,
  pageSize,
  onEdit,
  onChangeStatus,
  onLineEdit,
  onLineDelete,
  onLineSendRFQ,
}: {
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  onEdit?: (reqNo: string, rows: RequestLine[]) => void;
  onChangeStatus?: (reqId: string | undefined, next: 'RFQ'|'APPROVED'|'COMPLETED') => void;
  onLineEdit?: (reqId: string | undefined, item: LineItem) => void;
  onLineDelete?: (reqId: string | undefined, lineId: string) => void;
  onLineSendRFQ?: (reqId: string | undefined, lineId: string) => void;
}) {
  const { items } = useItems();

  // Group by requestNo
  const groups = React.useMemo(() => {
    const m = new Map<string, RequestLine[]>();
    for (const it of items) {
      const key = it.requestNo || "—";
      m.set(key, [...(m.get(key) || []), it]);
    }
    return Array.from(m.entries());
  }, [items]);

  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  const totalLines = React.useMemo(() => items.length, [items]);
  const totalReqs = groups.length;
const showingFrom = (page - 1) * pageSize + (items.length ? 1 : 0);
const showingTo = Math.min(page * pageSize, total || items.length);

  // Status pill color helper
  const statusClass = (s: string) =>
    s === 'APPROVED'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'RFQ'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className="card card-p">
     <div className="mb-3 flex items-center justify-between">
  <div className="text-sm font-semibold">Requests</div>
  <div className="flex items-center gap-2 text-xs text-gray-600">
    {loading ? (
      <span className="rounded-full border px-2 py-0.5 bg-gray-50 animate-pulse">Loading…</span>
    ) : error ? (
      <span className="rounded-full border px-2 py-0.5 bg-red-50 text-red-600">{error}</span>
    ) : (
      <span className="rounded-full border px-2 py-0.5 bg-gray-50">
        Showing {showingFrom}-{showingTo} of {total}
      </span>
    )}
  </div>
</div>
      <div className="overflow-auto">
        <table className="u-table text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Request NO</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-left">Required Date</th>
              <th className="px-3 py-2 text-left">Vendor</th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-left">Requester</th>
              <th className="px-3 py-2 text-left">Warehouse</th>
              <th className="px-3 py-2 text-left">Machine</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-red-600">{error}</td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">No requests yet</td>
              </tr>
            ) : (
              groups.map(([reqNo, rows], i) => {
                const header = rows[0];
                const groupWarehouse = mostCommon(rows.map(r => r.warehouse));
                const isOpen = !!open[reqNo];
                return (
                  <React.Fragment key={reqNo}>
                    <tr className={twRow(i) + " hover:bg-gray-50"}>
                      <td className="px-3 py-3 font-mono text-sm text-gray-800">
                        <button
                          onClick={() => setOpen(o=>({ ...o, [reqNo]: !o[reqNo] }))}
                          className={"rounded border px-1.5 py-0.5 mr-2 text-xs transition-colors hover:bg-gray-50 " + (isOpen ? "text-gray-900" : "text-gray-600")}
                          aria-label={isOpen ? 'Collapse' : 'Expand'}
                        >
                          <svg className={"h-3.5 w-3.5 transition-transform " + (isOpen ? "rotate-90" : "")} viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l6 5-6 5V5z"/></svg>
                        </button>
                        {reqNo}
                      </td>
                      <td className="px-3 py-3">{mostCommon(rows.map(r => r.createdAt)) || "—"}</td>
                      <td className="px-3 py-3">{rows[0]?.description || "—"}</td>
                      <td className="px-3 py-3">{header.requiredDate || "—"}</td>
                      <td className="px-3 py-3">{header.vendor || "—"}</td>
                      <td className="px-3 py-3">{header.department}</td>
                      <td className="px-3 py-3">{mostCommon(rows.map(r => r.requester)) || '—'}</td>
                      <td className="px-3 py-3">{groupWarehouse && groupWarehouse.trim() ? groupWarehouse : '—'}</td>
                      <td className="px-3 py-3">{mostCommon(rows.map(r => r.machine)) || '—'}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="xs"
                            title="Edit this request"
                            aria-label="Edit"
                            className="rounded-full px-2"
                            onClick={() => onEdit && onEdit(reqNo, rows)}
                          >
                            {/* Pencil icon */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                          </Button>

                          <Button
                            variant="danger"
                            size="xs"
                            title="Delete this request"
                            aria-label="Delete"
                            className="rounded-full px-2"
                            onClick={async () => {
                              const id = rows[0]?.reqId;
                              if (!id) { alert('Missing request id'); return; }
                              const ok = confirm('Are you sure you want to delete this request?');
                              if (!ok) return;
                              try {
                                await deleteRequest(id as any);
                                window.setTimeout(() => window.location.reload(), 50);
                              } catch (e: any) {
                                console.error('deleteRequest failed', e);
                                alert(e?.message || 'Failed to delete');
                              }
                            }}
                          >
                            {/* Trash icon */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-white">
                        <td colSpan={9} className="px-3 py-3">
                          <LineItemsTable
                            items={rows.map<LineItem>((r) => ({
                              id: r.id,
                              code: r.materialCode,       // standardized source for CODE
                              description: r.description,  // standardized source for DESCRIPTION
                              qty: r.quantity,             // standardized source for QTY
                              unit: r.uom,                 // standardized source for UNIT
                            }))}
                            onEdit={(item: LineItem) => onLineEdit && onLineEdit(header.reqId, item)}
                            onDelete={(item: LineItem) => onLineDelete && onLineDelete(header.reqId, String(item.id))}
                            onSendRFQ={(item: LineItem) => onLineSendRFQ && onLineSendRFQ(header.reqId, String(item.id))}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// yyyy-MM-dd (مع تصوير الـtimezone صح)
const toDateInput = (v?: string | Date) => {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (isNaN(d.getTime())) return '';
  // تصفير الأوفست عشان مايحصلش انزياح يوم
  const dLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return dLocal.toISOString().slice(0, 10); // yyyy-MM-dd
};

function NewRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [requestNo, setRequestNo] = React.useState("");
  const [date, setDate] = React.useState<string>("");
  const [vendor, setVendor] = React.useState("");
  const [type, setType] = React.useState("Purchase");
  const [department, setDepartment] = React.useState("IT");
  const [notes, setNotes] = React.useState("");
  const [requestFile, setRequestFile] = React.useState<File | null>(null);
  const [quotationFile, setQuotationFile] = React.useState<File | null>(null);

  // Header-level states for warehouse, requester, machine
  const [warehouse, setWarehouse] = React.useState("");
  const [requester, setRequester] = React.useState("");
  const [machine, setMachine] = React.useState("");

  type Line = {
    id?: string | undefined;
    code?: string;
    name?: string;
    itemCode?: string;
    itemName?: string;
    qty: any;
    unit: string;
  };
  const [line, setLine] = React.useState<Line>({ itemCode: "", itemName: "", qty: "", unit: "pcs" });
  const [lines, setLines] = React.useState<Line[]>([]);

  function addLine() {
    const itemCode = (line.itemCode || "").trim();
    const itemName = (line.itemName || "").trim();
    const qty = Number(line.qty) || 0;
    const unit = (line.unit || 'pcs').toString();
    if (!itemCode && !itemName) return;
    setLines((prev) => [
      ...prev,
      { id: undefined, itemCode, itemName, qty, unit },
    ]);
    setLine({ itemCode: "", itemName: "", qty: "", unit: "pcs" });
  }
  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function createRequest() {
    try {
      // Build DTO from modal state (new contract)
      const specsStr = `Warehouse: ${warehouse || "—"} | Requester: ${requester || "—"} | Machine: ${machine || "—"}`;

      const items = lines.length
        ? lines.map((l) => ({
            code: (l.code?.trim?.() || l.itemCode?.trim?.() || undefined) as string | undefined,
            name: (l.name?.trim?.() || l.itemName?.trim?.() || "") as string,
            qty: Number(l.qty) || 0,
            unit: (l.unit?.toString?.().trim?.() || undefined) as string | undefined,
          }))
        : undefined;

      const requiredDate = date;
      const dto: any = {
        orderNo: requestNo || `REQ-${Date.now()}`,
        vendor: vendor?.trim() || undefined,
        requiredDate: requiredDate || undefined,
        type,
        department,
        warehouse: warehouse?.trim() || undefined,
        // Merge user notes (if any) with our compact specs line
        notes: [notes && notes.trim(), specsStr].filter(Boolean).join("\n"),
        ...(items ? { items } : {}),
      };

      const created = await apiCreateRequest(dto);

      // Optional files upload
      if (created?.id && requestFile) await uploadRequestFile(created.id, requestFile, "request");
      if (created?.id && quotationFile) await uploadRequestFile(created.id, quotationFile, "quotation");

      // Refresh list in parent and close
      onCreated();
      onClose();
    } catch (err) {
      console.error("createRequest failed", err);
      alert((err as Error)?.message || "Create failed");
    }
  }

  // --- canSubmit logic ---
  const canSubmit = (requestNo?.trim().length ?? 0) > 0 && (vendor?.trim().length ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-card border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-lg font-semibold">New Request</div>
<Button variant="outline" size="sm" onClick={onClose}>Close</Button>        </div>

        <div className="p-5 space-y-5">
          {/* Basic Data */}
          <div>
            <div className="mb-2 text-sm font-semibold">Basic Data</div>
            <div className="grid grid-cols-1 md:grid-cols-8 gap-2">
              <div>
                <label className="text-xs text-gray-600">Request No</label>
                <input className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" placeholder="e.g. REQ-20250903-001" value={requestNo} onChange={(e) => setRequestNo(e.currentTarget.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Date</label>
                <input type="date" className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" value={date} onChange={(e)=>setDate(e.currentTarget.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Vendor</label>
                <input className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" placeholder="Vendor name" value={vendor} onChange={(e)=>setVendor(e.currentTarget.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Type</label>
                <div className="relative">
                  <select className="mt-1 h-10 w-full rounded-xl border px-3 pr-8 text-sm input-focus appearance-none bg-white" value={type} onChange={(e)=>setType(e.currentTarget.value)}>
                    {['Purchase','Maintenance','Transfer'].map(t=> <option key={t}>{t}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M6 8l4 4 4-4H6z"/></svg>
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Department</label>
                <div className="relative">
                  <select className="mt-1 h-10 w-full rounded-xl border px-3 pr-8 text-sm input-focus appearance-none bg-white" value={department} onChange={(e)=>setDepartment(e.currentTarget.value)}>
                    {['IT','Production','Maintenance','Procurement','Logistics','Quality','Operations'].map(d=> <option key={d}>{d}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M6 8l4 4 4-4H6z"/></svg>
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Warehouse</label>
                <input className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" placeholder="Warehouse" value={warehouse} onChange={e => setWarehouse(e.currentTarget.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Requester</label>
                <input className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" placeholder="Requester" value={requester} onChange={e => setRequester(e.currentTarget.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Machine</label>
                <input className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" placeholder="Machine" value={machine} onChange={e => setMachine(e.currentTarget.value)} />
              </div>
            </div>
          </div>

          {/* Files small table */}
          <div>
            <div className="mb-2 text-sm font-semibold">Request Files</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Request File</label>
                <input type="file" className="mt-1 block w-full text-sm" onChange={(e)=>setRequestFile(e.currentTarget.files?.[0] ?? null)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Quotation File</label>
                <input type="file" className="mt-1 block w-full text-sm" onChange={(e)=>setQuotationFile(e.currentTarget.files?.[0] ?? null)} />
              </div>
            </div>
          </div>

          {/* Material Data */}
          <div className="border rounded-2xl p-3">
            <div className="mb-2 text-sm font-semibold">Material Data</div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-600">Item Code</label>
                <input className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" placeholder="Item Code" value={line.itemCode} onChange={(e)=>setLine({ ...line, itemCode: e.currentTarget.value })} />
              </div>
              <div className="lg:col-span-1">
                <label className="text-xs text-gray-600">Item Name</label>
                <input className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus" placeholder="Item Name" value={line.itemName} onChange={(e)=>setLine({ ...line, itemName: e.currentTarget.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Quantity</label>
                <input type="number" className="mt-1 h-10 w-full rounded-xl border px-3 text-sm text-left input-focus" placeholder="Qty" value={line.qty} onChange={(e)=>setLine({ ...line, qty: e.currentTarget.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Unit</label>
                <div className="relative">
                  <select className="mt-1 h-10 w-full rounded-xl border px-3 pr-8 text-sm input-focus appearance-none bg-white" value={line.unit} onChange={(e)=>setLine({ ...line, unit: e.currentTarget.value })}>
                    {['pcs','kg','m','box'].map(u=> <option key={u}>{u}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M6 8l4 4 4-4H6z"/></svg>
                  </span>
                </div>
              </div>
              <div className="lg:col-span-4 flex justify-end">
                <Button type="button" onClick={addLine}>+ Add item</Button>
              </div>
            </div>

            <div className="mt-3 overflow-auto rounded-xl border shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-center">Item Code</th>
                    <th className="px-3 py-2 text-left">Item Name</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-center">Unit</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500">No items yet</td></tr>
                  ) : (
                    lines.map((li, idx) => (
                      <tr key={idx} className={twRow(idx) + " hover:bg-gray-50"}>
                        <td className="px-3 py-2 text-center align-middle">{li.itemCode}</td>
                        <td className="px-3 py-2 text-left align-middle">{li.itemName}</td>
                        <td className="px-3 py-2 text-center align-middle">{li.qty}</td>
                        <td className="px-3 py-2 text-center align-middle">{li.unit}</td>
                        <td className="px-3 py-2 text-center align-middle">
                          <div className="inline-flex items-center gap-3 text-gray-800">
                            <button title="Edit" className="hover:text-black/80">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                            </button>
                            <button title="Delete" className="hover:text-black" onClick={()=>removeLine(idx)}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
            <Button onClick={createRequest} disabled={!canSubmit}>Create Request</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
