import React from "react";

import LineItemsTable from "../components/requests/LineItemsTable";
import type { LineItem } from "../components/requests/LineItemRow";

import { listRequests, createRequest as apiCreateRequest, uploadRequestFile, updateRequestStatus, deleteRequest } from "../lib/api";
import type { RequestCreateDTO } from "../types";

import Button from "../components/ui/Button";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import type { ChartData, ChartOptions } from "chart.js";
import TaskToolbar from "../components/tasks/TaskToolbar";
import TaskListView from "../components/tasks/TaskListView";
import TaskKanbanView from "../components/tasks/TaskKanbanView";
import TaskModal from "../components/tasks/TaskModal";
import TaskFiltersSheet, { TaskFiltersValue } from "../components/tasks/TaskFiltersSheet";
import { TaskStoreProvider } from "../components/tasks/TaskStore";
import SectionHeader from "../components/ui/SectionHeader";
import FoldersSection from "../components/library/FoldersSection";
import StockAlert from "../components/alerts/StockAlert";
import LiveChat from "../components/chat/LiveChat";
import EditRequestModal from "../components/requests/EditRequestModal";

import StatusPieChart from "../components/StatusPieChart";

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

  // Tasks section local state (UI only; data via TaskStore)
  const [taskView, setTaskView] = React.useState<'list' | 'kanban'>('list');
  const [openTaskModal, setOpenTaskModal] = React.useState(false);
  const [openTaskFilters, setOpenTaskFilters] = React.useState(false);
  const [taskFilters, setTaskFilters] = React.useState<TaskFiltersValue>({});

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

  return (
    <ItemsContext.Provider value={ctxValue}>
      <div className="p-6 space-y-4">
        <div className="rounded-2xl border bg-white shadow-card px-4 py-3 sticky top-16 z-10">
          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center text-gray-700" title="Requests">
                <IconDoc />
              </span>
              Requests Room
            </h1>

            <div className="flex-1 flex justify-center">
              <div className="relative w-full">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  value={searchText}
                  onChange={(e) => setSearchText(e.currentTarget.value)}
                  placeholder="Search requests…  (⌘K)"
                  className="h-9 w-full rounded-2xl border pl-9 pr-3 text-sm outline-none hover:border-gray-400 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className={"shrink-0 " + (showPulse ? "animate-pulse" : "")}>
              <Button className="h-9" onClick={() => setOpenNew(true)} title="Shift + N">New Requests Tool</Button>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <AnalyticsSection />
        
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

        {/* Discussion Board — Tasks */}
        <TaskStoreProvider>
          <div className="card card-p">
            <SectionHeader
              variant="flat"
              size="lg"
              title="Discussion Board"
            />
            <TaskToolbar
              viewMode={taskView}
              onToggleView={setTaskView}
              onAddNew={() => setOpenTaskModal(true)}
              onOpenFilter={() => setOpenTaskFilters(true)}
            />

            <div className="mt-3">
              {taskView === 'list' ? (
                <TaskListView /* q={taskFilters.q} status={...} etc. لاحقًا */ />
              ) : (
                <TaskKanbanView /* tag={taskFilters.tag} assignee={taskFilters.assignee} */ />
              )}
            </div>

            {openTaskModal && (
              <TaskModal mode="create" onClose={() => setOpenTaskModal(false)} />
            )}
            {openTaskFilters && (
              <TaskFiltersSheet
                initial={taskFilters}
                onApply={(f) => setTaskFilters(f)}
                onClose={() => setOpenTaskFilters(false)}
                onClear={() => setTaskFilters({})}
              />
            )}
          </div>
        </TaskStoreProvider>

{/* Alerts & Chat side-by-side */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div className="card card-p">
    <SectionHeader variant="flat" size="md" title="Stock Alert" />
    <div className="mt-3">
      <StockAlert />
    </div>
  </div>

  <div className="card card-p">
    <SectionHeader variant="flat" size="md" title="Live Group Chat" />
    <div className="mt-3">
      <LiveChat />
    </div>
  </div>
</div>

{/* Library — Folders */}
<div className="mt-6 card card-p">
  <SectionHeader variant="flat" size="lg" title="Mini Vault" />
  <FoldersSection />
</div>

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

  const [period, setPeriod] = React.useState<"Monthly"|"Quarterly"|"Annually">("Monthly");

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyByDept = React.useMemo(() => {
    const m: Record<string, number[]> = {};
    for (const it of items) {
      const dept = it.department || "Other";
      if (!m[dept]) m[dept] = Array(12).fill(0);
      const idx = monthIndex(it);
      m[dept][idx] += 1;
    }
    return m;
  }, [items]);

  const quarterlyByDept = React.useMemo(() => {
    const q: Record<string, number[]> = {};
    for (const [dept, arr] of Object.entries(monthlyByDept)) {
      q[dept] = [
        (arr[0]||0)+(arr[1]||0)+(arr[2]||0),
        (arr[3]||0)+(arr[4]||0)+(arr[5]||0),
        (arr[6]||0)+(arr[7]||0)+(arr[8]||0),
        (arr[9]||0)+(arr[10]||0)+(arr[11]||0),
      ];
    }
    return q;
  }, [monthlyByDept]);

  const currentYear = new Date().getFullYear();
  const annuallyByDept = React.useMemo(() => {
    const a: Record<string, number[]> = {};
    for (const [dept, arr] of Object.entries(monthlyByDept)) {
      a[dept] = [arr.reduce((s,v)=>s+v,0)];
    }
    return a;
  }, [monthlyByDept]);

  const barConfig = React.useMemo(() => {
    if (period === "Quarterly") return { labels: ["Q1","Q2","Q3","Q4"], series: quarterlyByDept };
    if (period === "Annually")  return { labels: [String(currentYear)],  series: annuallyByDept  };
    return { labels: months, series: monthlyByDept };
  }, [period, months, monthlyByDept, quarterlyByDept, annuallyByDept, currentYear]);

  return (
    <div className="space-y-4">
      {/* Top two charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Requests by Status">
          <StatusPieChart
            data={[
              { label: "NEW", value: statusCounts.NEW || 0, color: "#3b82f6" },
              { label: "RFQ", value: statusCounts.RFQ || 0, color: "#f59e0b" },
              { label: "APPROVED", value: statusCounts.APPROVED || 0, color: "#10b981" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Requests by Department">
          <StatusPieChart
            title="Requests by Department"
            data={Object.entries(deptCounts).map(([k,v], i) => ({
              label: k,
              value: v,
              color: ["#6366f1","#22c55e","#ef4444","#14b8a6","#f97316","#a855f7","#0ea5e9","#94a3b8"][i % 8],
            }))}
          />
        </ChartCard>
      </div>

      {/* Bottom bar chart with switcher */}
      <ChartCard
        title={`Requests by Department (${period})`}
        rightSlot={
          <div className="rounded-xl border p-0.5 text-xs">
            {(["Monthly","Quarterly","Annually"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={
                  "px-2 py-1 rounded-lg " + (period===p ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50")
                }
              >{p}</button>
            ))}
          </div>
        }
      >
        <StackedBars months={barConfig.labels} series={barConfig.series} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, rightSlot }: { title: string; children: React.ReactNode; rightSlot?: React.ReactNode }) {
  return (
    <div className="card card-p">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          {rightSlot}
          <div className="inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs text-gray-600 bg-gray-50">Demo</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function StackedBars({ months, series }: { months: string[]; series: Record<string, number[]> }) {
  const datasets = Object.entries(series).map(([label, vals], i) => ({
    label,
    data: vals,
    backgroundColor: ["#3b82f6","#22c55e","#ef4444","#14b8a6","#f97316","#a855f7","#0ea5e9","#94a3b8"][i % 8],
    borderRadius: 6,
    stack: "reqs",
  }));
  const allZero = datasets.length === 0 || datasets.every(ds => ds.data.every(v => (v ?? 0) === 0));

  if (allZero) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-gray-500">
        No data yet — create a request to see trends
      </div>
    );
  }

  const data: ChartData<'bar'> = { labels: months, datasets };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { color: '#e5e7eb' }, ticks: { precision: 0 } },
    },
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
    },
  };
  return (
    <div className="h-56">
      <Bar data={data} options={options} />
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
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left w-10">#</th>
              <th className="px-3 py-2 text-left">Request No</th>
              <th className="px-3 py-2 text-left">Vendor</th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-left">Warehouse</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Lines</th>
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
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setOpen(o=>({ ...o, [reqNo]: !o[reqNo] }))}
                          className={"rounded border px-1.5 py-0.5 text-xs transition-colors hover:bg-gray-50 " + (isOpen ? "text-gray-900" : "text-gray-600")}
                          aria-label={isOpen ? 'Collapse' : 'Expand'}
                        >
                          <svg className={"h-3.5 w-3.5 transition-transform " + (isOpen ? "rotate-90" : "")} viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l6 5-6 5V5z"/></svg>
                        </button>
                      </td>
                      <td className="px-3 py-3 font-mono text-sm text-gray-800">{reqNo}</td>
                      <td className="px-3 py-3">{header.vendor || "—"}</td>
                      <td className="px-3 py-3">{header.department}</td>
                      <td className="px-3 py-3">{groupWarehouse && groupWarehouse.trim() ? groupWarehouse : '—'}</td>
                      <td className="px-3 py-3">{header.requiredDate || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs " + statusClass(header.status)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current"></span> {header.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">{rows.length}</td>
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
                              code: r.materialCode,
                              description: r.description,
                              qty: r.quantity,
                              unit: r.uom,
                              status: r.status,
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
    if (!line.itemName?.trim() && !line.itemCode?.trim()) return;
    setLines((prev) => [
      ...prev,
      { id: undefined, code: '', name: '', qty: 1, unit: 'pcs' },
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