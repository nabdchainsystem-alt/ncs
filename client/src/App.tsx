import React, { useEffect, useMemo, useState } from "react";
import StatusPieChart from "./components/StatusPieChart";
import Sparkline from "./components/Sparkline";
import NewRequestModal from "./components/NewRequestModal";
import { createRequest, getRequests, updateRequest, deleteRequest } from "./lib/api";
import type { RequestItem, Priority, Status } from "./types";

type Slice = { label: string; value: number; color: string };

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

/** Update status */
async function apiUpdateRequestStatus(id: string, status: Status) {
  const res = await fetch(`${API_URL}/api/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to update status");
  }
  return res.json();
}

/** Toggle completed */
async function apiToggleCompleted(id: string, completed: boolean) {
  const res = await fetch(`${API_URL}/api/requests/${id}/completed`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to toggle completed");
  }
  return res.json();
}

/** Upload file */
async function apiUploadFile(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/requests/${id}/files`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to upload");
  }
  return res.json();
}

const statusColors: Record<Status, string> = {
  New: "bg-slate-50 text-slate-700 border border-slate-200",
  "Under Review": "bg-amber-50 text-amber-700 border border-amber-200",
  Quotation: "bg-sky-50 text-sky-700 border border-sky-200",
  Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Completed: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

class ErrorBoundary extends React.Component<{ fallback?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.error("UI error captured:", err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          Something went wrong while rendering this section.
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}


function StatusBadge({ value, className }: { value: Status; className?: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColors[value]} ${className ?? ""}`}>
      {value}
    </span>
  );
}


/** Animated counter for dashboard/mini-cards */
function CountUp({ to, duration = 800 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | undefined;
    const from = 0;
    const d = duration;
    const tick = (t: number) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / d);
      const v = Math.round(from + (to - from) * p);
      setVal(v);
      if (p < 1) requestAnimationFrame(tick);
    };
    setVal(0);
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <span>{val}</span>;
}

/** Tone styles for KPI cards */
const kpiTones = {
  new: {
    chip: "bg-slate-50 text-slate-700 border border-slate-200",
    icon: "🆕",
  },
  review: {
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: "📝",
  },
  quote: {
    chip: "bg-sky-50 text-sky-700 border border-sky-200",
    icon: "💬",
  },
  approved: {
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: "✅",
  },
  completed: {
    chip: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    icon: "🏁",
  },
} as const;

type KpiTone = keyof typeof kpiTones;

function KpiCard({
  tone,
  label,
  value,
  sub,
  onClick,
}: {
  tone: KpiTone;
  label: string;
  value: number;
  sub?: string;
  onClick?: () => void;
}) {
  const t = kpiTones[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300"
    >
      <div className="p-3 flex items-start gap-3">
        <div className={`w-9 h-9 flex items-center justify-center rounded-md ${t.chip}`}>{t.icon}</div>
        <div className="flex-1">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-2xl font-semibold tabular-nums"><CountUp to={value} /></div>
          {sub ? <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div> : null}
        </div>
      </div>
    </button>
  );
}

type Page =
  | "dashboard"
  | "requests"
  | "orders"
  | "inventory"
  | "vendors"
  | "reports"
  | "lab"
  | "tasks"
  | "vault";

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const Item = (p: Page, label: string, icon: string) => (
    <button
      onClick={() => setPage(p)}
      className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-gray-100 ${
        page === p ? "bg-gray-200 font-semibold" : ""
      }`}
    >
      <span className="text-gray-500 w-5 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
  return (
    <aside className="w-64 border-r bg-white h-screen sticky top-0 p-4 hidden md:block">
      <div className="mb-4 px-3">
        <div className="w-full h-12 md:h-14 overflow-hidden">
          <img src="/logo.svg" alt="NCS Logo" className="h-full w-auto object-contain" />
        </div>
      </div>

      <div className="mb-2 text-[11px] uppercase text-gray-500">Dashboard</div>
      {Item("dashboard", "Overview", "🏠")}

      <div className="mt-4 mb-2 text-[11px] uppercase text-gray-500">Rooms</div>
      {Item("requests", "Requests", "📝")}
      {Item("orders", "Orders", "📦")}
      {Item("inventory", "Inventory", "📊")}
      {Item("vendors", "Vendors", "🤝")}
      {Item("reports", "Reports", "📈")}

      <div className="mt-4 mb-2 text-[11px] uppercase text-gray-500">Boards</div>
      {Item("lab", "Lab (Big Board)", "🧪")}
      {Item("tasks", "Discussion & Tasks", "💬")}
      {Item("vault", "Vault", "🗄️")}
    </aside>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(() => (localStorage.getItem('page') as Page) || 'dashboard');
  useEffect(() => {
    // First-visit bootstrap: force Dashboard once, then honor user's last page.
    if (!localStorage.getItem('page_bootstrapped')) {
      setPage('dashboard');
      localStorage.setItem('page_bootstrapped', '1');
    }
  }, []);

  const [list, setList] = useState<RequestItem[]>([]);

  const dist = useMemo(() => {
    const base = { New: 0, "Under Review": 0, Quotation: 0, Approved: 0, Completed: 0 };
    for (const r of list) {
      if (r.completed) base.Completed++;
      else base[r.status as keyof typeof base]++;
    }
    return base;
  }, [list]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Maintenance");
  const [department, setDepartment] = useState("Production");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [quantity, setQuantity] = useState<number>(1);
  const [specs, setSpecs] = useState("");

  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
const [fromDate, setFromDate] = useState<string>("");
const [toDate, setToDate] = useState<string>("");
const [sortBy, setSortBy] = useState<"createdAt" | "priority" | "status" | "quantity">("createdAt");
const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
const [pageIndex, setPageIndex] = useState(0);
const pageSize = 20;
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [dark, setDark] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getRequests();
      setList(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (page === "requests" || page === "dashboard") {
      load();
    }
  }, [page]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    setPageIndex(0);
  }, [filterDept, filterStatus, query, onlyCompleted, fromDate, toDate, sortBy, sortDir]);

  useEffect(() => {
    localStorage.setItem('page', page);
  }, [page]);

  const filtered = useMemo(() => {
    const f = list.filter((r) => {
      const okDept = filterDept === "All" || r.department === filterDept;
const okStatus =
  filterStatus === "All"
    ? true
    : filterStatus === "Completed"
    ? !!r.completed
    : !r.completed && r.status === filterStatus;      const okQuery =
        query.trim().length === 0 ||
        [r.title, r.type, r.department].some((v) =>
          v.toLowerCase().includes(query.toLowerCase())
        );
      const okCompleted = !onlyCompleted || !!r.completed;
      const okFrom = !fromDate || r.createdAt >= new Date(fromDate).getTime();
      const okTo = !toDate || r.createdAt <= new Date(toDate).getTime() + 86_399_000; // include end day
      return okDept && okStatus && okQuery && okCompleted && okFrom && okTo;
    });

    const priOrder: Record<Priority, number> = { Low: 0, Medium: 1, High: 2 };
    const by = sortBy;
    const dir = sortDir === "asc" ? 1 : -1;

    f.sort((a, b) => {
      let A: number | string = 0;
      let B: number | string = 0;
      if (by === "createdAt") { A = a.createdAt; B = b.createdAt; }
      else if (by === "quantity") { A = a.quantity; B = b.quantity; }
      else if (by === "priority") { A = priOrder[a.priority]; B = priOrder[b.priority]; }
      else { A = a.status; B = b.status; }
      if (A < B) return -1 * dir;
      if (A > B) return 1 * dir;
      return 0;
    });

    return f;
  }, [list, filterDept, filterStatus, query, onlyCompleted, fromDate, toDate, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(pageIndex, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(pageSafe * pageSize, pageSafe * pageSize + pageSize),
    [filtered, pageSafe]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createRequest({ title, type, department, priority, quantity, specs });
      setTitle("");
      setSpecs("");
      setQuantity(1);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create");
    }
  }

  async function onChangeStatus(id: string, status: Status) {
    setError(null);
    if (id.startsWith("tmp-")) {
      setError("Please wait until the request is saved.");
      return;
    }
    const snapshot = list;
    setList(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      await apiUpdateRequestStatus(id, status);
    } catch (e: any) {
      setList(snapshot);
      setError(e?.message || "Failed to update status");
    }
  }

  function Dashboard() {
    return (
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="border rounded pl-8 pr-3 py-2 text-sm w-56"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            </div>
            <button onClick={() => setDark((d) => !d)} className="px-2 py-2 border rounded text-sm" title="Toggle theme">{dark ? "🌙" : "☀️"}</button>
            <button className="px-2 py-2 border rounded text-sm" title="Notifications">🔔</button>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">MA</div>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiCard tone="new" label="New" value={list.filter(x=>!x.completed && x.status==="New").length} sub="Awaiting triage" />
          <KpiCard tone="review" label="Under Review" value={list.filter(x=>!x.completed && x.status==="Under Review").length} sub="In evaluation" />
          <KpiCard tone="quote" label="Quotation" value={list.filter(x=>!x.completed && x.status==="Quotation").length} sub="Quote requested" />
          <KpiCard tone="approved" label="Approved" value={list.filter(x=>!x.completed && x.status==="Approved").length} sub="Ready to proceed" />
          <KpiCard tone="completed" label="Completed" value={list.filter(x=>!!x.completed).length} sub="Done items" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Payments Overview</div>
              <div className="h-32 w-full bg-gradient-to-t from-blue-100 to-transparent rounded relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                  {Array.from({length:12}).map((_,i)=>{
                    const h = 20 + ((i*37)%70);
                    return <div key={i} className="flex-1 bg-blue-400/60 animate-grow" style={{height: `${h}%`, animationDelay: `${i*60}ms`}}/>;
                  })}
                </div>
              </div>
            </div>
          </ErrorBoundary>
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Profit this week</div>
              <div className="h-32 w-full rounded relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                  {Array.from({length:10}).map((_,i)=>{
                    const a = 20 + ((i*53)%70);
                    const b = 10 + ((i*29)%60);
                    return (
                      <div key={i} className="flex-1 flex gap-1 items-end">
                        <div className="flex-1 bg-purple-400/70 animate-grow" style={{height: `${a}%`, animationDelay: `${i*50}ms`}}/>
                        <div className="flex-1 bg-cyan-400/70 animate-grow" style={{height: `${b}%`, animationDelay: `${i*50+120}ms`}}/>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ErrorBoundary>
        </section>
      </div>
    );
  }

  function RequestsRoom() {
    const [newOpen, setNewOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<RequestItem | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const sparkData = useMemo(() => {
      // apply same filters used by the table
      const rows = list.filter((r) => {
        const okDept = filterDept === "All" || r.department === filterDept;
        const okStatus =
          filterStatus === "All"
            ? true
            : filterStatus === "Completed"
            ? !!r.completed
            : !r.completed && r.status === filterStatus;
        const okQuery =
          query.trim().length === 0 ||
          [r.title, r.type, r.department].some((v) =>
            v.toLowerCase().includes(query.toLowerCase())
          );
        const okCompleted = !onlyCompleted || !!r.completed;
        const okFrom = !fromDate || r.createdAt >= new Date(fromDate).getTime();
        const okTo = !toDate || r.createdAt <= new Date(toDate).getTime() + 86_399_000;
        return okDept && okStatus && okQuery && okCompleted && okFrom && okTo;
      });
      // last 7 days buckets
      const now = new Date();
      const days: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86_399_000;
        const count = rows.filter(
          (r) => r.createdAt >= dayStart && r.createdAt <= dayEnd
        ).length;
        days.push(count);
      }
      return days;
    }, [list, filterDept, filterStatus, query, onlyCompleted, fromDate, toDate]);
    return (
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">NCS — Requests Room</h1>
          <div className="flex items-center gap-2">
            <div className="hidden md:block relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search requests..."
                className="border rounded pl-8 pr-3 py-2 text-sm w-64"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            </div>
            <button
              onClick={() => { setEditTarget(null); setNewOpen(true); }}
              className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
              title="Create new request"
            >
              + New Request
            </button>
            <button onClick={() => setDark((d) => !d)} className="px-2 py-2 border rounded text-sm" title="Toggle theme">{dark ? "🌙" : "☀️"}</button>
            <button onClick={() => load()} className="px-3 py-2 rounded bg-gray-900 text-white text-sm">Refresh</button>
            <button className="px-2 py-2 border rounded text-sm" title="Notifications">🔔</button>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">MA</div>
          </div>
        </header>

        {/* Mini Reports (clickable KPIs) */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <KpiCard tone="new" label="New" value={list.filter(x=>!x.completed && x.status==="New").length} onClick={() => { setFilterStatus("New"); setOnlyCompleted(false); }} />
          <KpiCard tone="review" label="Under Review" value={list.filter(x=>!x.completed && x.status==="Under Review").length} onClick={() => { setFilterStatus("Under Review"); setOnlyCompleted(false); }} />
          <KpiCard tone="quote" label="Quotation" value={list.filter(x=>!x.completed && x.status==="Quotation").length} onClick={() => { setFilterStatus("Quotation"); setOnlyCompleted(false); }} />
          <KpiCard tone="approved" label="Approved" value={list.filter(x=>!x.completed && x.status==="Approved").length} onClick={() => { setFilterStatus("Approved"); setOnlyCompleted(false); }} />
          <KpiCard tone="completed" label="Completed" value={list.filter(x=>!!x.completed).length} onClick={() => { setFilterStatus("Completed"); setOnlyCompleted(true); }} />
        </section>

        {/* Status Distribution */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ErrorBoundary>
            <StatusPieChart
              title="Requests by Status"
              data={[
                { label: "New",           value: dist.New,            color: "#9ca3af" },
                { label: "Under Review",  value: dist["Under Review"],color: "#fbbf24" },
                { label: "Quotation",     value: dist.Quotation,      color: "#60a5fa" },
                { label: "Approved",      value: dist.Approved,       color: "#34d399" },
                { label: "Completed",     value: dist.Completed,      color: "#a78bfa" },
              ] as Slice[]}
            />
          </ErrorBoundary>
        </section>

        {/* Sparkline for last 7 days (respects filters) */}
        <section className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="font-semibold mb-2">Requests (last 7 days)</div>
          <Sparkline
            data={sparkData}
            width={260}
            height={64}
            color="#10b981"
            fill="rgba(16,185,129,.12)"
            title="Requests trend (filtered)"
          />
        </section>

        {/* New Request Modal */}
        <NewRequestModal
          open={newOpen}
          initial={editTarget ? {
            orderNo: editTarget.orderNo,
            type: editTarget.type,
            department: editTarget.department,
            notes: (editTarget as any).notes ?? (editTarget as any).specs,
            items: (editTarget as any).items ?? [],
          } : undefined}
          onClose={() => { setNewOpen(false); setEditTarget(null); }}
          onSubmit={async (payload) => {
            const now = Date.now();
            const sumQty = (payload.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
            const optimisticNew: RequestItem = {
              id: `tmp-${crypto.randomUUID()}`,
              orderNo: payload.orderNo,
              title: payload.items?.[0]?.name || payload.orderNo || "New Request",
              type: payload.type,
              department: payload.department,
              priority: "Medium",
              quantity: sumQty || 1,
              specs: payload.notes,
              status: "New",
              completed: false,
              createdAt: now,
              items: (payload as any).items || [],
              files: [],
            } as any;
            try {
              if (editTarget) {
                // Optimistic update in list
                setList(prev => prev.map(r => r.id === editTarget.id ? {
                  ...r,
                  orderNo: payload.orderNo,
                  type: payload.type,
                  department: payload.department,
                  specs: payload.notes,
                  quantity: (payload.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0) || r.quantity,
                  items: (payload as any).items || r.items,
                } : r));
                await updateRequest(editTarget.id, payload);
              } else {
                // Optimistic add at top, then reconcile with server response (robust)
                setList(prev => [optimisticNew, ...prev]);
                const created = await createRequest(payload).catch(() => null);
                if (created && created.id) {
                  // Normalize minimal fields for UI safety
                  const safe: RequestItem = {
                    id: created.id,
                    orderNo: created.orderNo ?? payload.orderNo,
                    title: created.title ?? (payload.items?.[0]?.name || payload.orderNo || "New Request"),
                    type: created.type ?? payload.type,
                    department: created.department ?? payload.department,
                    priority: created.priority ?? "Medium",
                    quantity: typeof created.quantity === 'number' ? created.quantity : (payload.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0) || 1,
                    specs: created.specs ?? created.notes ?? payload.notes,
                    status: created.status ?? "New",
                    completed: !!created.completed,
                    createdAt: created.createdAt ?? Date.now(),
                    items: created.items ?? (payload as any).items ?? [],
                    files: created.files ?? [],
                  } as any;
                  setList(prev => prev.map(r => (r.id === optimisticNew.id ? safe : r)));
                } else {
                  // Fallback: keep optimistic row; optional refresh if backend stores it
                  // (skip load() to avoid wiping optimistic if backend doesn't echo it yet)
                }
              }
              setNewOpen(false);
              setEditTarget(null);
              if (editTarget) await load();
            } catch (err: any) {
              setError(err?.message || (editTarget ? "Failed to save" : "Failed to create"));
            }
          }}
        />

        {/* Filters */}
        <section className="bg-white rounded-lg shadow p-4 mb-3">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-700">Filters:</span>
            <select className="border rounded px-3 py-2" value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
              <option value="All">All Departments</option>
              <option>Production</option><option>Maintenance</option><option>Quality</option><option>Warehouse</option>
            </select>
 <select
  className="border rounded px-3 py-2"
  value={filterStatus}
  onChange={e=>setFilterStatus(e.target.value as Status | "All")}
>
  <option value="All">All Status</option>
  <option>New</option>
  <option>Under Review</option>
  <option>Quotation</option>
  <option>Approved</option>
  <option>Completed</option>
</select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyCompleted} onChange={(e)=>setOnlyCompleted(e.currentTarget.checked)} />
              Completed only
            </label>
            <input type="date" className="border rounded px-3 py-2" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
            <input type="date" className="border rounded px-3 py-2" value={toDate} onChange={e=>setToDate(e.target.value)} />
            <select className="border rounded px-3 py-2" value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
              <option value="createdAt">Sort: Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="status">Sort: Status</option>
              <option value="quantity">Sort: Qty</option>
            </select>
            <select className="border rounded px-3 py-2" value={sortDir} onChange={e=>setSortDir(e.target.value as any)}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <span className="ml-auto text-sm text-gray-600">{filtered.length} / {list.length} items</span>
            <span className="text-sm text-gray-500">Page {pageSafe+1}/{totalPages}</span>
          </div>
        </section>

        {/* Requests Table */}
        <section className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-6 text-gray-600">Loading...</div>
          ) : (
            <>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 w-8"></th>
                  <th className="px-3 py-2">Request No</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Dept</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Vault</th>
                  <th className="px-3 py-2 text-center">Action</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className={`border-t ${r.completed ? "opacity-60" : ""}`}>
                      <td className="px-2 py-2 align-top">
                        <button
                          className="w-6 h-6 flex items-center justify-center rounded border hover:bg-gray-50"
                          onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                          title={expanded[r.id] ? "Hide details" : "Show details"}
                        >
                          {expanded[r.id] ? "▾" : "▸"}
                        </button>
                      </td>
                      <td className="px-3 py-2 align-top font-mono text-xs text-gray-700">{r.orderNo || "—"}</td>
                      <td className="px-3 py-2 align-top">{r.completed ? <span className="line-through">{r.title}</span> : r.title}</td>
                      <td className="px-3 py-2 align-top">{r.type}</td>
                      <td className="px-3 py-2 align-top">{r.department}</td>
                      <td className="px-3 py-2 align-top">{r.priority}</td>
                      <td className="px-3 py-2 align-top">{r.quantity}</td>
                      <td className="px-3 py-2 align-top"><StatusBadge value={r.completed ? "Completed" : r.status} /></td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <label className="text-xs underline cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.currentTarget.files?.[0];
                                if (!f) return;
                                try {
                                  setUploadingId(r.id);
                                  await apiUploadFile(r.id, f);
                                  await load();
                                } catch (err: any) {
                                  setError(err?.message || "Upload failed");
                                } finally {
                                  setUploadingId(null);
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            Upload
                          </label>
                          <span className="text-xs text-gray-600">
                            {(r.files?.length ?? 0)} file(s)
                          </span>
                          {r.files && r.files.length > 0 && (
                            <a
                              className="text-xs text-blue-600 underline"
                              href={r.files[r.files.length - 1].url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          )}
                          {uploadingId === r.id && <span className="text-xs">Uploading...</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center justify-center gap-3">
                          {r.completed ? (
                            <select className="border rounded px-2 py-1 w-36" value="Completed" disabled>
                              <option>Completed</option>
                            </select>
                          ) : (
                            <select
                              className="border rounded px-2 py-1 w-36"
                              value={r.status}
                              onChange={e => onChangeStatus(r.id, e.target.value as Status)}
                              disabled={r.id.startsWith("tmp-")}
                              title={r.id.startsWith("tmp-") ? "Please wait until saved" : undefined}
                            >
                              <option>New</option>
                              <option>Under Review</option>
                              <option>Quotation</option>
                              <option>Approved</option>
                            </select>
                          )}
                          <label className="flex items-center gap-1 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              checked={!!r.completed}
                              onChange={async (e) => {
                                const next = e.currentTarget.checked;
                                if (r.id.startsWith("tmp-")) {
                                  setError("Please wait until the request is saved.");
                                  return;
                                }
                                const snapshot = list;
                                setList(prev => prev.map(x => x.id === r.id ? { ...x, completed: next } : x));
                                try {
                                  await apiToggleCompleted(r.id, next);
                                } catch (err: any) {
                                  setList(snapshot);
                                  setError(err?.message || "Failed to mark completed");
                                }
                              }}
                            />
                            Completed
                          </label>
                          <button
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                            onClick={() => { setEditTarget(r); setNewOpen(true); }}
                            title="Edit request"
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 text-xs border rounded hover:bg-red-50 text-red-700 border-red-300"
                            onClick={async () => {
                              if (!confirm("Delete this request?")) return;
                              const snapshot = list;
                              setList(prev => prev.filter(x => x.id !== r.id));
                              try {
                                await deleteRequest(r.id);
                              } catch (err: any) {
                                setList(snapshot);
                                setError(err?.message || "Failed to delete");
                              }
                            }}
                            title="Delete request"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>

                    {expanded[r.id] && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={11} className="px-3 py-3">
                          <div className="flex flex-col gap-3">
                            <div className="text-sm text-gray-700 font-medium">Request Details</div>
                            {/* Line items table */}
                            {r.items && r.items.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-[600px] text-xs">
                                  <thead>
                                    <tr className="text-left text-gray-500">
                                      <th className="px-2 py-1">#</th>
                                      <th className="px-2 py-1">Name</th>
                                      <th className="px-2 py-1">Code</th>
                                      <th className="px-2 py-1">Qty</th>
                                      <th className="px-2 py-1">Unit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.items.map((it, idx) => (
                                      <tr key={it.id || idx} className="border-t">
                                        <td className="px-2 py-1 w-10 text-gray-500">{idx + 1}</td>
                                        <td className="px-2 py-1">{it.name}</td>
                                        <td className="px-2 py-1 font-mono text-[11px] text-gray-700">{it.code || "—"}</td>
                                        <td className="px-2 py-1 tabular-nums">{it.qty}</td>
                                        <td className="px-2 py-1">{it.unit}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">No line items.</div>
                            )}

                            {r.specs || r.notes ? (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Notes: </span>
                                {r.notes ?? r.specs}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr><td className="px-3 py-6 text-gray-500" colSpan={11}>No requests yet.</td></tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-3 py-3 border-t text-sm">
              <div>
                Showing {paged.length} of {filtered.length} (total {list.length})
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={()=>setPageIndex(0)} disabled={pageSafe===0}>« First</button>
                <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={()=>setPageIndex(p=>Math.max(0,p-1))} disabled={pageSafe===0}>‹ Prev</button>
                <span>Page {pageSafe+1} / {totalPages}</span>
                <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={()=>setPageIndex(p=>Math.min(totalPages-1,p+1))} disabled={pageSafe>=totalPages-1}>Next ›</button>
                <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={()=>setPageIndex(totalPages-1)} disabled={pageSafe>=totalPages-1}>Last »</button>
              </div>
            </div>
            </>
          )}
        </section>

        {/* Mini Tracker (click to filter) */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Mini Tracker</h3>
          <div className="flex gap-2 text-xs flex-wrap">
            {(["New","Under Review","Quotation","Approved","Completed"] as Status[]).map((st) => {
              const isActive =
                st === "Completed"
                  ? filterStatus === "Completed" || onlyCompleted
                  : filterStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    if (st === "Completed") {
                      setFilterStatus("Completed");
                      setOnlyCompleted(true);
                    } else {
                      setFilterStatus(st);
                      setOnlyCompleted(false);
                    }
                  }}
                  className={`rounded focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                    isActive ? "ring-2 ring-gray-300" : ""
                  }`}
                  title={`Filter by ${st}`}
                >
                  <StatusBadge value={st} className="status-badge" />
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setFilterStatus("All");
                setOnlyCompleted(false);
              }}
              className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50"
              title="Clear status filter"
            >
              Clear
            </button>
          </div>
        </section>
      </div>
    );
  }

  function Placeholder({ title, note }: { title: string; note: string }) {
    return (
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
        </header>
        <section className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">{note}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 min-h-screen bg-gray-50">
        {page === "dashboard" && Dashboard()}
        {page === "requests" && RequestsRoom()}
        {page === "orders" && (
          Placeholder({ title: "Orders Room", note: "Orders flow: Pending → Released → Closed." })
        )}
        {page === "inventory" && (
          Placeholder({ title: "Inventory Room", note: "Critical stock, receipts, issues, adjustments." })
        )}
        {page === "vendors" && (
          Placeholder({ title: "Vendors Room", note: "Vendor profiles, performance index, documents." })
        )}
        {page === "reports" && (
          Placeholder({ title: "Reports", note: "Spend trend, approval ratio, on-time vs delayed orders." })
        )}
        {page === "lab" && (
          Placeholder({ title: "Lab (Big Board)", note: "Master board & reporting hub for management & specialists." })
        )}
        {page === "tasks" && (
          Placeholder({ title: "Discussion & Tasks", note: "Collaborative notes, tasks, mini chat linked to records." })
        )}
        {page === "vault" && (
          Placeholder({ title: "Vault", note: "Central archive for documents (linked from rooms)." })
        )}
      </main>
    </div>
  );
}
