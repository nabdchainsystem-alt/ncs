import React, { useEffect, useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import StatusPieChart from "./components/StatusPieChart";
import Sparkline from "./components/Sparkline";
import NewRequestModal from "./components/NewRequestModal";
import { createRequest, getRequests, updateRequest, deleteRequest } from "./lib/api";
import type { RequestItem, Priority, Status } from "./types";

const LS_KEY = "ncs_requests_v1"; // local fallback cache

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

class ErrorBoundary extends React.Component<React.PropsWithChildren<{ fallback?: React.ReactNode }>, { hasError: boolean }> {
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
    return (this.props.children as React.ReactNode) || null;
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
      <div className="p-4 flex items-start gap-3">
        <div className={`w-12 h-12 flex items-center justify-center rounded-md ${t.chip}`}>{t.icon}</div>
        <div className="flex-1">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-3xl font-semibold tabular-nums"><CountUp to={value} /></div>
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
  | "vault"
  | "calendar"
  | "profile"
  | "messages"
  | "inbox"
  | "invoice";

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

      {/* Dashboard */}
      <div className="mb-2 text-[11px] uppercase text-gray-500">Dashboard</div>
      {Item("dashboard", "Overview", "🏠")}

      {/* Rooms */}
      <div className="mt-4 mb-2 text-[11px] uppercase text-gray-500">Rooms</div>
      {Item("requests", "Requests", "📝")}
      {Item("orders", "Orders", "📦")}
      {Item("inventory", "Inventory", "📊")}
      {Item("vendors", "Vendors", "🤝")}
      {Item("reports", "Reports", "📈")}

      {/* Boards */}
      <div className="mt-4 mb-2 text-[11px] uppercase text-gray-500">Boards</div>
      {Item("lab", "Lab", "🧪")}
      {Item("tasks", "Tasks", "✅")}
      {Item("vault", "Archive", "🗄️")}

      {/* Tools */}
      <div className="mt-4 mb-2 text-[11px] uppercase text-gray-500">Tools</div>
      {Item("calendar", "Calendar", "📅")}
      {Item("profile", "Profile", "👤")}

      {/* Communication */}
      <div className="mt-4 mb-2 text-[11px] uppercase text-gray-500">Communication</div>
      {Item("messages", "Messages", "💬")}
      {Item("inbox", "Inbox", "📥")}

      {/* Finance */}
      <div className="mt-4 mb-2 text-[11px] uppercase text-gray-500">Finance</div>
      {Item("invoice", "Invoice", "📑")}
    </aside>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(() => (sessionStorage.getItem('page') as Page) || 'dashboard');

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
      if (Array.isArray(data) && data.length > 0) {
        setList(data);
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
      } else {
        console.warn("API returned empty list, keeping cached data");
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          try {
            const parsed: RequestItem[] = JSON.parse(cached);
            setList(parsed);
            return;
          } catch {}
        }
        // fallback if no cache
        setList([]);
      }
    } catch (e: any) {
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          const parsed: RequestItem[] = JSON.parse(cached);
          setList(parsed);
          setError(null);
          return; // stop here, we used cache
        }
      } catch {}
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
    sessionStorage.setItem('page', page);
  }, [page]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
  }, [list]);

  const filtered = useMemo(() => {
    const f = list.filter((r) => {
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
      const createdAtMs = typeof r.createdAt === 'number' ? r.createdAt : new Date(r.createdAt).getTime();
      const okFrom = !fromDate || createdAtMs >= new Date(fromDate).getTime();
      const okTo = !toDate || createdAtMs <= new Date(toDate).getTime() + 86_399_000; // include end day
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
      console.warn("Status update failed on server, keeping local change", e);
      setError(e?.message || "Failed to update status (local only)");
    }
  }

  function Dashboard() {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
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

        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard tone="new" label="New Requests" value={list.filter(x=>!x.completed && x.status==="New").length} sub="Awaiting triage" />
          <KpiCard tone="review" label="Under Review" value={list.filter(x=>!x.completed && x.status==="Under Review").length} sub="In evaluation" />
          <KpiCard tone="quote" label="Quotation" value={list.filter(x=>!x.completed && x.status==="Quotation").length} sub="Quote requested" />
          <KpiCard tone="approved" label="Approved" value={list.filter(x=>!x.completed && x.status==="Approved").length} sub="Ready to proceed" />
          <KpiCard tone="completed" label="Completed" value={list.filter(x=>!!x.completed).length} sub="Done items" />
        </section>

        {/* Quick Insights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Spend vs Budget</div>
            <div className="h-32 w-full bg-gradient-to-t from-blue-100 to-transparent rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = 20 + ((i * 31) % 70);
                  return (
                    <div key={i} className="flex-1 bg-blue-400/70 animate-grow" style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Department Activity</div>
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              (Stacked Bar Placeholder)
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">AI Insight</div>
            <p className="text-sm">“Production requests spiked 30% this week. Consider reallocating budget to handle demand.”</p>
          </div>
        </section>

        {/* Recent Requests Table */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Recent Requests</h2>
            <button
              className="text-xs text-blue-600 underline"
              onClick={() => setPage("requests")}
            >
              View all
            </button>
          </div>
          <table className="min-w-full text-xs">
            <thead className="text-gray-500">
              <tr>
                <th className="px-2 py-1 text-left">Req No</th>
                <th className="px-2 py-1 text-left">Title</th>
                <th className="px-2 py-1 text-left">Dept</th>
                <th className="px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 5).map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-2 py-1 font-mono text-[11px]">{r.orderNo || "—"}</td>
                  <td className="px-2 py-1">{r.title}</td>
                  <td className="px-2 py-1">{r.department}</td>
                  <td className="px-2 py-1">
                    <StatusBadge value={r.completed ? "Completed" : r.status} />
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-gray-400 text-center">
                    No recent requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Additional Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Payments Overview</div>
              <div className="h-32 w-full bg-gradient-to-t from-green-100 to-transparent rounded relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                  {Array.from({length:12}).map((_,i)=>{
                    const h = 20 + ((i*37)%70);
                    return <div key={i} className="flex-1 bg-green-400/60 animate-grow" style={{height: `${h}%`, animationDelay: `${i*60}ms`}}/>;
                  })}
                </div>
              </div>
            </div>
          </ErrorBoundary>
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Profit This Week</div>
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

        {/* Advanced Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Line Trend Chart */}
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Requests Trend (Monthly)</div>
              <svg viewBox="0 0 300 100" className="w-full h-32">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points="0,80 40,60 80,65 120,30 160,50 200,20 240,40 280,25"
                  className="animate-pulse"
                />
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"].map((m,i)=>(
                  <text key={m} x={i*40} y={95} fontSize="8" fill="#6b7280">{m}</text>
                ))}
              </svg>
            </div>
          </ErrorBoundary>

          {/* Radar Chart */}
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Department Performance Matrix</div>
              <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                (Radar Chart Placeholder)
              </div>
            </div>
          </ErrorBoundary>

          {/* Donut Chart */}
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <div className="font-semibold mb-2">Requests by Status</div>
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    className="text-blue-400"
                    strokeDasharray="100,100"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDashoffset="25"
                  />
                  <path
                    className="text-green-400"
                    strokeDasharray="60,100"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDashoffset="65"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                  {list.length}
                </div>
              </div>
            </div>
          </ErrorBoundary>

          {/* Progress Circle */}
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <div className="font-semibold mb-2">Budget Utilization</div>
              <div className="relative w-24 h-24">
                <svg className="w-full h-full">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251"
                    strokeDashoffset="50"
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-semibold text-green-600">
                  80%
                </div>
              </div>
            </div>
          </ErrorBoundary>
        </section>

        {/* Forecast & Heatmap */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Forecast</div>
            <div className="text-gray-500 text-sm">(Forecast table placeholder)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Heatmap</div>
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">(Heatmap Placeholder)</div>
          </div>
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
        const createdAtMs = typeof r.createdAt === 'number' ? r.createdAt : new Date(r.createdAt).getTime();
        const okFrom = !fromDate || createdAtMs >= new Date(fromDate).getTime();
        const okTo = !toDate || createdAtMs <= new Date(toDate).getTime() + 86_399_000;
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
        const count = rows.filter((r) => {
          const ms = typeof r.createdAt === 'number' ? r.createdAt : new Date(r.createdAt).getTime();
          return ms >= dayStart && ms <= dayEnd;
        }).length;
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

        {/* Requests Dashboard Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* KPI Cards */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
            <div className="text-xs text-gray-500">Total Requests</div>
            <div className="text-2xl font-bold text-gray-800">
              <CountUp to={list.length} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
            <div className="text-xs text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              <CountUp to={list.filter(r=>r.completed).length} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
            <div className="text-xs text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-amber-600">
              <CountUp to={list.filter(r=>!r.completed).length} />
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ErrorBoundary>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Requests Trend</div>
              <Sparkline
                data={sparkData}
                width={320}
                height={80}
                color="#3b82f6"
                fill="rgba(59,130,246,.15)"
                title="7-day trend"
              />
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <StatusPieChart
              title="Requests by Status"
              data={[
                { label: "New", value: dist.New, color: "#9ca3af" },
                { label: "Under Review", value: dist["Under Review"], color: "#fbbf24" },
                { label: "Quotation", value: dist.Quotation, color: "#60a5fa" },
                { label: "Approved", value: dist.Approved, color: "#34d399" },
                { label: "Completed", value: dist.Completed, color: "#a78bfa" },
              ] as Slice[]}
            />
          </ErrorBoundary>
        </section>

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
            <span className="text-sm text-gray-700 font-medium">Filters:</span>

            {/* Department Multi-select */}
            <select
              multiple
              className="border rounded px-3 py-2 min-w-[160px]"
              value={filterDept === "All" ? [] : [filterDept]}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map(o=>o.value);
                setFilterDept(vals.length === 0 ? "All" : vals[0]); // simplified multi-select for now
              }}
            >
              <option value="All">All Departments</option>
              <option>Production</option>
              <option>Maintenance</option>
              <option>Quality</option>
              <option>Warehouse</option>
            </select>

            {/* Status Multi-select */}
            <select
              multiple
              className="border rounded px-3 py-2 min-w-[160px]"
              value={filterStatus === "All" ? [] : [filterStatus]}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map(o=>o.value);
                setFilterStatus(vals.length === 0 ? "All" : (vals[0] as Status));
              }}
            >
              <option value="All">All Status</option>
              <option>New</option>
              <option>Under Review</option>
              <option>Quotation</option>
              <option>Approved</option>
              <option>Completed</option>
            </select>

            {/* Completed only toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyCompleted} onChange={(e)=>setOnlyCompleted(e.currentTarget.checked)} />
              Completed only
            </label>

            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <input type="date" className="border rounded px-3 py-2" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
              <span className="text-gray-400">→</span>
              <input type="date" className="border rounded px-3 py-2" value={toDate} onChange={e=>setToDate(e.target.value)} />
            </div>

            {/* Sort controls */}
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

            {/* Search box */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search requests..."
              className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
            />

            {/* Counters */}
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
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Last Updated</th>
                  <th className="px-3 py-2">SLA Deadline</th>
                  <th className="px-3 py-2">Vault</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className={`border-t transition-colors ${r.status==="New"?"bg-yellow-50":r.status==="Approved"?"bg-green-50":r.completed?"bg-indigo-50":""}`}>
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
                      <td className="px-3 py-2 align-top">{r.title}</td>
                      <td className="px-3 py-2 align-top">{r.type}</td>
                      <td className="px-3 py-2 align-top">{r.department}</td>
                      <td className="px-3 py-2 align-top">{r.priority}</td>
                      <td className="px-3 py-2 align-top">{r.quantity}</td>
                      <td className="px-3 py-2 align-top"><StatusBadge value={r.completed ? "Completed" : r.status} /></td>
                      <td className="px-3 py-2 align-top">{(r as any).owner || "—"}</td>
                      <td className="px-3 py-2 align-top">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 align-top">{(r as any).sla || "N/A"}</td>
                      <td className="px-3 py-2 align-top">...</td>
                      <td className="px-3 py-2 align-top">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 align-top text-right space-x-2">
                        <button onClick={() => setEditTarget(r)} className="text-xs text-blue-600 underline">Edit</button>
                        <button onClick={() => deleteRequest(r.id).then(load)} className="text-xs text-red-600 underline">Delete</button>
                      </td>
                    </tr>

                    {expanded[r.id] && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={14} className="px-3 py-3">
                          <div className="flex flex-col gap-4">

                            {/* Timeline */}
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">Status Timeline</div>
                              <div className="flex items-center gap-3 text-xs">
                                {["New","Under Review","Quotation","Approved","Completed"].map((st, i) => (
                                  <div key={st} className="flex items-center gap-1">
                                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] ${
                                      r.status === st || (st==="Completed" && r.completed)
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}>{i+1}</div>
                                    <span className={`${r.status===st?"font-semibold":""}`}>{st}</span>
                                    {i<4 && <span className="mx-1 text-gray-400">→</span>}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Line items table */}
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">Line Items</div>
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
                            </div>

                            {/* Notes */}
                            {(r.specs || (r as any).notes) ? (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Notes: </span>
                                {(r as any).notes ?? r.specs}
                              </div>
                            ) : null}

                            {/* Attachments */}
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">Attachments</div>
                              {r.files && r.files.length > 0 ? (
                                <ul className="list-disc list-inside text-xs text-blue-600">
                                  {r.files.map((f, i) => (
                                    <li key={i}>
                                      <a href={f.url || "#"} target="_blank" rel="noreferrer">{f.name || `File ${i+1}`}</a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-xs text-gray-500">No attachments.</div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded"
                                onClick={() => {
                                  const clone = { ...r, id: `tmp-${crypto.randomUUID()}`, orderNo: `${r.orderNo}-copy` };
                                  setList(prev => [clone, ...prev]);
                                }}
                              >
                                Clone Request
                              </button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr><td className="px-3 py-6 text-gray-500" colSpan={14}>No requests yet.</td></tr>
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
{page === "requests" && (
  <ErrorBoundary>
    <RequestsRoom />
  </ErrorBoundary>
)}        {page === "orders" && (
  <ErrorBoundary>
    <OrdersRoom />
  </ErrorBoundary>
)}
        {page === "inventory" && (
          <ErrorBoundary>
            <InventoryRoom />
          </ErrorBoundary>
        )}
        {page === "vendors" && (
          <ErrorBoundary>
            <VendorsRoom />
          </ErrorBoundary>
        )}
        {page === "reports" && (
          <ErrorBoundary>
            <ReportsRoom />
          </ErrorBoundary>
        )}
       {page === "lab" && (
  <ErrorBoundary>
    <BigBoard />
  </ErrorBoundary>
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

// VendorsRoom: expanded vendors main page
function VendorsRoom() {
  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendors Room</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search vendors..."
            className="border rounded pl-3 pr-3 py-2 text-sm w-64"
          />
          <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Advanced Search</button>
        </div>
      </header>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Vendor Orders Trend</div>
            <div className="h-32 w-full bg-gradient-to-t from-green-100 to-transparent rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = 20 + ((i * 41) % 70);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-green-400/60 animate-grow"
                      style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Vendor Ratings</div>
            <div className="h-32 w-full rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({ length: 8 }).map((_, i) => {
                  const a = 30 + ((i * 47) % 60);
                  const b = 15 + ((i * 31) % 50);
                  return (
                    <div key={i} className="flex-1 flex gap-1 items-end">
                      <div
                        className="flex-1 bg-purple-400/70 animate-grow"
                        style={{ height: `${a}%`, animationDelay: `${i * 60}ms` }}
                      />
                      <div
                        className="flex-1 bg-yellow-400/70 animate-grow"
                        style={{ height: `${b}%`, animationDelay: `${i * 60 + 120}ms` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </section>

      {/* Top 5 Active Vendors */}
      <section className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Top 5 Active Vendors</h2>
          <button className="text-xs text-blue-600 underline">View details</button>
        </div>
        <table className="min-w-full text-xs">
          <thead className="text-gray-500">
            <tr>
              <th className="px-2 py-1 text-left">Vendor</th>
              <th className="px-2 py-1 text-left">Category</th>
              <th className="px-2 py-1 text-left">Orders</th>
            </tr>
          </thead>
          <tbody>
            {["Acme Supplies","TechCorp","BuildIt","LogiTrans","QuickParts"].map((v,i)=>(
              <tr key={v} className="border-t">
                <td className="px-2 py-1">{v}</td>
                <td className="px-2 py-1">{["General","Electronics","Construction","Logistics","Spare Parts"][i]}</td>
                <td className="px-2 py-1">{Math.floor(Math.random()*200+20)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* All Vendors */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">All Vendors</h2>
          <button className="text-xs text-blue-600 underline">Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="text-gray-500 bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left">Vendor</th>
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-left">Location</th>
                <th className="px-2 py-1 text-left">Orders</th>
                <th className="px-2 py-1 text-left">Rating</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1">Vendor {i+1}</td>
                  <td className="px-2 py-1">{["General","Electronics","Construction","Logistics","Spare Parts"][i%5]}</td>
                  <td className="px-2 py-1">{["Riyadh","Jeddah","Dammam","Dubai","Cairo"][i%5]}</td>
                  <td className="px-2 py-1">{Math.floor(Math.random()*500+50)}</td>
                  <td className="px-2 py-1">{(Math.random()*2+3).toFixed(1)} ★</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function OrdersRoom() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders Room</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search orders..."
            className="border rounded pl-3 pr-3 py-2 text-sm w-64"
          />
          <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">
            + New Order
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard tone="new" label="Pending Orders" value={18} sub="Awaiting release" />
        <KpiCard tone="review" label="Released" value={42} sub="In progress" />
        <KpiCard tone="approved" label="Closed Orders" value={97} sub="Fulfilled" />
        <KpiCard tone="quote" label="Delayed" value={7} sub="Past due" />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Orders Flow</div>
            <div className="h-32 w-full flex items-center justify-center text-gray-400 text-sm">
              (Flow Diagram Placeholder)
            </div>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Orders Trend</div>
            <div className="h-32 w-full bg-gradient-to-t from-blue-100 to-transparent rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({ length: 10 }).map((_, i) => {
                  const h = 20 + ((i * 35) % 70);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-400/70 animate-grow"
                      style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </section>

      {/* Recent Orders Table */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Recent Orders</h2>
          <button className="text-xs text-blue-600 underline">View all</button>
        </div>
        <table className="min-w-full text-xs">
          <thead className="text-gray-500 bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left">Order No</th>
              <th className="px-2 py-1 text-left">Vendor</th>
              <th className="px-2 py-1 text-left">Status</th>
              <th className="px-2 py-1 text-left">Amount</th>
              <th className="px-2 py-1 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {["#ORD-101","#ORD-102","#ORD-103","#ORD-104","#ORD-105"].map((o,i)=>(
              <tr key={o} className="border-t">
                <td className="px-2 py-1">{o}</td>
                <td className="px-2 py-1">{["Acme","TechCorp","BuildIt","QuickParts","LogiTrans"][i]}</td>
                <td className="px-2 py-1">
                  <StatusBadge value={["New","Under Review","Approved","Completed","Quotation"][i%5] as any}/>
                </td>
                <td className="px-2 py-1">{Math.floor(Math.random()*50000+5000)} SAR</td>
                <td className="px-2 py-1">{new Date(Date.now()-i*86400000).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Forecast & Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="font-semibold mb-2">Forecast</div>
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">(Forecast Placeholder)</div>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-2">AI Insight</h2>
          <p className="text-sm">“Orders from TechCorp are delayed 3x above average. Recommend vendor performance review.”</p>
        </div>
      </section>
    </div>
  );
}
function InventoryRoom() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Room</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search items..."
            className="border rounded pl-3 pr-3 py-2 text-sm w-64"
          />
          <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">
            + Add Item
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard tone="new" label="Total Items" value={1200} sub="All SKUs" />
        <KpiCard tone="review" label="Low Stock" value={34} sub="Needs restock" />
        <KpiCard tone="quote" label="Out of Stock" value={12} sub="Unavailable" />
        <KpiCard tone="approved" label="Categories" value={8} sub="Item groups" />
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-lg shadow p-4 flex gap-3">
        <button className="px-3 py-2 bg-green-600 text-white rounded text-sm">📥 Receive Stock</button>
        <button className="px-3 py-2 bg-yellow-500 text-white rounded text-sm">📤 Issue Stock</button>
        <button className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">📝 Adjustments</button>
        <button className="px-3 py-2 bg-purple-600 text-white rounded text-sm">📊 Generate Report</button>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Top Items by Stock</div>
            <div className="h-36 w-full bg-gradient-to-t from-blue-100 to-transparent rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({ length: 10 }).map((_, i) => {
                  const h = 20 + ((i * 37) % 70);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-400/70 animate-grow"
                      style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Category Distribution</div>
            <div className="h-36 w-full rounded relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                (Donut Chart Placeholder with Animation)
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </section>

      {/* More Animated Placeholder Charts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sparkline */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="font-semibold mb-2">Stock Movement (7d)</div>
          <div className="flex-1 flex items-center justify-center">
            <svg width="140" height="40" className="w-36 h-10">
              <polyline
                points="0,35 20,25 40,30 60,15 80,28 100,10 120,25 140,12"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                className="animate-pulse"
              />
              <polyline
                points="0,38 20,32 40,36 60,27 80,35 100,18 120,32 140,17"
                fill="none"
                stroke="#a7f3d0"
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>
        {/* Stacked Bars */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="font-semibold mb-2">Monthly Receipts vs Issues</div>
          <div className="flex-1 flex items-end gap-1 h-24">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col w-5">
                <div
                  className="rounded-t bg-green-400/80 animate-grow"
                  style={{
                    height: `${20 + ((i * 33) % 60)}%`,
                    animationDelay: `${i * 70}ms`
                  }}
                />
                <div
                  className="rounded-b bg-yellow-400/80 animate-grow"
                  style={{
                    height: `${10 + ((i * 21) % 40)}%`,
                    animationDelay: `${i * 70 + 120}ms`
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] mt-2 text-gray-500">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>
        {/* Placeholder Chart */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="font-semibold mb-2">Top Categories</div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-purple-300 border-dashed animate-spin" />
          </div>
          <div className="text-xs text-gray-400 text-center mt-2">(Animated Pie Placeholder)</div>
        </div>
      </section>

      {/* Stock Alerts */}
      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-sm mb-3">Stock Alerts</h2>
        <div className="flex flex-wrap gap-2">
          {["Bearing","Motor","Filter","Belt","Sensor","Pump","Valve"].map((it,i)=>(
            <span key={i} className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">
              {it}: Low
            </span>
          ))}
        </div>
      </section>

      {/* Critical Stock */}
      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-sm mb-3">Critical Stock</h2>
        <table className="min-w-full text-xs">
          <thead className="text-gray-500">
            <tr>
              <th className="px-2 py-1 text-left">Item</th>
              <th className="px-2 py-1 text-left">Code</th>
              <th className="px-2 py-1 text-left">Qty</th>
              <th className="px-2 py-1 text-left">Unit</th>
              <th className="px-2 py-1 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {["Bearing","Motor","Filter","Belt","Sensor"].map((it,i)=>(
              <tr key={i} className="border-t">
                <td className="px-2 py-1">{it}</td>
                <td className="px-2 py-1">ITM-{100+i}</td>
                <td className="px-2 py-1 text-red-600 font-semibold">{Math.floor(Math.random()*5)+1}</td>
                <td className="px-2 py-1">pcs</td>
                <td className="px-2 py-1">
                  <button className="text-xs text-blue-600 underline">Reorder</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* All Inventory */}
      <section className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">All Inventory</h2>
          <button className="text-xs text-blue-600 underline">Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="text-gray-500 bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left">Item</th>
                <th className="px-2 py-1 text-left">Code</th>
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-left">Qty</th>
                <th className="px-2 py-1 text-left">Unit</th>
                <th className="px-2 py-1 text-left">Location</th>
                <th className="px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }).map((_, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-1">Item {i+1}</td>
                  <td className="px-2 py-1">ITM-{200+i}</td>
                  <td className="px-2 py-1">{["General","Spare Parts","Consumables","Raw Materials"][i%4]}</td>
                  <td className="px-2 py-1">{Math.floor(Math.random()*500+20)}</td>
                  <td className="px-2 py-1">pcs</td>
                  <td className="px-2 py-1">{["Warehouse A","Warehouse B","Yard","Workshop"][i%4]}</td>
                  <td className="px-2 py-1 flex gap-2">
                    <button className="text-xs text-blue-600 underline">Edit</button>
                    <button className="text-xs text-red-600 underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ReportsRoom() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports & Insights</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search reports..."
            className="border rounded pl-3 pr-3 py-2 text-sm w-64"
          />
          <select className="border rounded px-3 py-2 text-sm">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Custom Range</option>
          </select>
          <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">
            Export PDF
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard tone="new" label="Total Spend" value={420000} sub="SAR" />
        <KpiCard tone="approved" label="Approval Ratio" value={86} sub="% approved" />
        <KpiCard tone="quote" label="On-Time Delivery" value={72} sub="% on time" />
        <KpiCard tone="review" label="Delayed Orders" value={14} sub="this month" />
      </section>

      {/* Chart Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Spend vs Budget</div>
            <div className="h-40 w-full bg-gradient-to-t from-blue-100 to-transparent rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = 20 + ((i * 37) % 70);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-400/70 animate-grow"
                      style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Requests by Department</div>
            <div className="h-40 w-full flex items-center justify-center text-gray-400 text-sm">
              (Stacked Bar Chart Placeholder)
            </div>
          </div>
        </ErrorBoundary>
      </section>

      {/* AI Insight Box */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-2">AI Insight</h2>
        <p className="text-sm">
          Based on current trends, <span className="font-bold">Maintenance</span> will exceed budget in 2 weeks unless orders are optimized.
        </p>
      </section>

      {/* Tables Placeholder */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-sm mb-3">Top 10 Vendors by Spend</h2>
          <div className="text-gray-400 text-sm">(Table Placeholder)</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-sm mb-3">Requests Breakdown</h2>
          <div className="text-gray-400 text-sm">(Table Placeholder)</div>
        </div>
      </section>
    </div>
  );
}
function BigBoard() {
  const [items, setItems] = useState<{ id: string; type: string; x: number; y: number; w: number; h: number; content?: string }[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const addItem = (type: string) => {
    const id = crypto.randomUUID();
    setItems([...items, { id, type, x: 100, y: 100, w: 120, h: 60, content: type }]);
  };

  const clearItems = () => setItems([]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const item = items.find((it) => it.id === id);
    if (item) {
      setDragging(id);
      setOffset({ x: e.clientX - item.x, y: e.clientY - item.y });
    }
  };

  const handleResizeDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setResizing(id);
    setOffset({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === dragging ? { ...it, x: e.clientX - offset.x, y: e.clientY - offset.y } : it
        )
      );
    }
    if (resizing) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === resizing
            ? {
                ...it,
                w: Math.max(50, it.w + (e.clientX - offset.x)),
                h: Math.max(30, it.h + (e.clientY - offset.y)),
              }
            : it
        )
      );
      setOffset({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  // Dropdown state for shapes
  const [shapeDropdown, setShapeDropdown] = useState(false);
  const shapeOptions = [
    { label: "🟦 Rectangle", value: "Rectangle" },
    { label: "◯ Circle", value: "Circle" },
    { label: "🔺 Triangle", value: "Triangle" },
  ];
  // Delete item handler
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };
  return (
    <div className="p-6 space-y-6 w-full bg-gray-100 overflow-hidden relative">
      {/* Page Header */}
      <header className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between px-6 shadow z-40">
        <h1 className="font-bold text-lg">Lab — Big Board</h1>
        <div className="flex items-center gap-4">
          <button className="text-sm hover:underline">Help</button>
          <button className="text-sm hover:underline">Settings</button>
          <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">MA</div>
        </div>
      </header>
      {/* Toolbar */}
      <div className="absolute top-16 left-4 bg-white shadow rounded p-2 flex gap-2 z-30">
        {/* Add Shape Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShapeDropdown((v) => !v)}
            className="px-3 py-2 bg-gradient-to-r from-cyan-200 to-indigo-300 text-gray-800 rounded shadow-sm text-sm hover:bg-opacity-80 transition-colors flex items-center gap-1"
          >
            <span>➕ Add Shape</span> <span>▼</span>
          </button>
          {shapeDropdown && (
            <div className="absolute left-0 mt-2 bg-white border border-gray-200 rounded shadow z-30 min-w-[170px]">
              {[
                { label: "Rectangle", icon: "⬛" },
                { label: "Circle", icon: "⚪" },
                { label: "Triangle", icon: "🔺" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    addItem(opt.label);
                    setShapeDropdown(false);
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Standalone buttons for other items */}
        <button
          onClick={() => addItem("Sticky Note")}
          className="px-3 py-2 bg-gradient-to-r from-cyan-200 to-indigo-300 text-gray-800 rounded shadow-sm text-sm hover:bg-opacity-80 transition-colors flex items-center gap-1"
          title="Add Sticky Note"
        >
          📝 Sticky Note
        </button>
        <button
          onClick={() => addItem("Text Box")}
          className="px-3 py-2 bg-gradient-to-r from-cyan-200 to-indigo-300 text-gray-800 rounded shadow-sm text-sm hover:bg-opacity-80 transition-colors flex items-center gap-1"
          title="Add Text Box"
        >
          🔤 Text Box
        </button>
        <button
          onClick={() => addItem("Image")}
          className="px-3 py-2 bg-gradient-to-r from-cyan-200 to-indigo-300 text-gray-800 rounded shadow-sm text-sm hover:bg-opacity-80 transition-colors flex items-center gap-1"
          title="Add Image"
        >
          🖼 Image
        </button>
        <button
          onClick={() => addItem("Link")}
          className="px-3 py-2 bg-gradient-to-r from-cyan-200 to-indigo-300 text-gray-800 rounded shadow-sm text-sm hover:bg-opacity-80 transition-colors flex items-center gap-1"
          title="Add Link"
        >
          🔗 Link
        </button>
        <button
          onClick={clearItems}
          className="px-3 py-2 bg-gradient-to-r from-red-200 to-red-400 text-gray-800 rounded shadow-sm text-sm hover:bg-opacity-80 transition-colors flex items-center gap-1"
        >
          🗑 Clear
        </button>
      </div>
      {/* Pan/Zoom Canvas */}
      <TransformWrapper defaultScale={0.7}>
        <TransformComponent>
          <div
            className="w-[2000px] h-[1500px] bg-white shadow-inner relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {items.map((it) => (
              <div
                key={it.id}
                className="absolute bg-yellow-100 border border-yellow-300 rounded shadow cursor-move select-none flex items-center justify-center"
                style={{ top: it.y, left: it.x, width: it.w, height: it.h }}
                onMouseDown={(e) => handleMouseDown(e, it.id)}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(it.id);
                  }}
                  className="absolute top-0 right-0 mt-1 mr-1 w-5 h-5 flex items-center justify-center rounded-full bg-white text-red-500 border border-gray-200 shadow text-xs hover:bg-red-100 z-10"
                  title="Delete"
                  style={{ lineHeight: 1 }}
                >
                  ✕
                </button>
                {it.content}
                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                  onMouseDown={(e) => handleResizeDown(e, it.id)}
                />
              </div>
            ))}
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">
              (Drag to move, resize with corner, scroll to zoom)
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}