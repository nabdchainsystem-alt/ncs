import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Topbar from "./components/ui/Topbar";
import "./styles/glow.css";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import ArchivePage from "./pages/Archive";
import Vendors from "./pages/Vendors";
import ReportsPage from "./pages/Reports";
import LabPage from "./pages/Lab";
import Profile from "./pages/Profile";
import Marketplace from "./pages/Marketplace";
import CalendarPage from "./pages/Calendar";
import { Home, FileText, Package, Boxes, Users, BarChart3, CheckSquare, Archive, CalendarDays, User as UserIcon, Receipt, ChevronDown, FlaskConical, type LucideIcon } from "lucide-react";
import StatusPieChart from "./components/StatusPieChart";
import Overview from "./pages/Overview";
import Sparkline from "./components/Sparkline";
import NewRequestModal from "./components/NewRequestModal";
import { createRequest, getRequests, updateRequest, deleteRequest } from "./lib/api";
import type { RequestItem, Priority, Status } from "./types";
import RequestsPage from "./pages/Requests";
import DiscussionBoardPage from "./pages/DiscussionBoard";
import TasksListPage from "./pages/TasksList";
import Button from "./components/ui/Button";
import Footer from "./components/ui/Footer";
import AssistantLauncher from "./components/ai/AssistantLauncher";
import { AssistantProvider } from "./components/ai/useAssistant";
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/Card";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const LS_KEY = "ncs_requests_v1"; // local fallback cache

type Slice = { label: string; value: number; color: string };

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

/** Update status */
async function apiUpdateRequestStatus(id: string, status: Status) {
  const res = await fetch(`${API_URL}/api/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to update status");
  }
  return res.json();
}

/** Toggle completed */
async function apiToggleCompleted(id: string, completed: boolean) {
  const res = await fetch(`${API_URL}/api/requests/${id}/completed`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to toggle completed");
  }
  return res.json();
}

/** Upload file */
async function apiUploadFile(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/requests/${id}/files`, {
    method: "POST",
    credentials: 'include',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to upload");
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

class ErrorBoundary extends React.Component<React.PropsWithChildren<{ fallback?: React.ReactNode }>, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    // eslint-disable-next-line no-console
    console.error("UI error captured:", err);
    this.setState({ error: err });
  }
  render() {
    if (this.state.hasError) {
      const dev = (import.meta as any).env?.DEV;
      const details = dev && this.state.error ? String(this.state.error?.message || this.state.error) : null;
      return (
        (this.props.fallback as any) ?? (
          <div className="p-4 text-sm bg-red-50 border border-red-200 rounded text-red-700 space-y-2">
            <div className="font-semibold">Something went wrong while rendering this section.</div>
            {details ? <div className="text-xs text-red-800">{details}</div> : null}
            <button
              className="px-2 py-1 text-xs rounded border"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </button>
          </div>
        )
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
  | "invoice";

const PAGE_ROUTES: Record<Page, string> = {
  dashboard: "/overview",
  requests: "/requests",
  orders: "/orders",
  inventory: "/inventory",
  vendors: "/vendors",
  reports: "/reports",
  lab: "/lab",
  tasks: "/tasks",
  vault: "/archive",
  calendar: "/calendar",
  profile: "/profile",
  invoice: "/marketplace",
};

const DEFAULT_PAGE: Page = "dashboard";

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function pageFromPath(pathname: string): Page {
  const normalized = normalizePathname(pathname);
  const entry = Object.entries(PAGE_ROUTES).find(([, path]) => path === normalized);
  if (entry) return entry[0] as Page;
  if (normalized === "/") return DEFAULT_PAGE;
  return DEFAULT_PAGE;
}

function pathFromPage(page: Page) {
  return PAGE_ROUTES[page] || PAGE_ROUTES[DEFAULT_PAGE];
}

function Sidebar({ page, setPage, collapsed }: { page: Page; setPage: (p: Page) => void; collapsed?: boolean }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ rooms: true, boards: true, tools: true, finance: true });

  // Collapsed rail (icons only)
  if (collapsed) {
    const RailBtn = (p: Page, label: string, Icon: LucideIcon) => (
      <button
        key={p}
        onClick={() => setPage(p)}
        title={label}
        className={`h-10 w-10 flex items-center justify-center rounded-lg ${page===p? 'bg-gray-900 text-white shadow-sm':'text-gray-600 hover:bg-gray-100'}`}
        aria-current={page===p? 'page': undefined}
      >
        <Icon className="w-5 h-5" strokeWidth={page===p?2.6:2} />
      </button>
    );
    const Dot = () => <div className="my-2 h-0.5 w-6 rounded bg-gray-200" />;
    return (
      <div className="w-full h-full p-3 flex flex-col items-center gap-2 overflow-y-auto no-scrollbar">
        <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 grid place-items-center font-bold">N</div>
        {RailBtn('dashboard','Overview', Home)}
        <Dot />
        {RailBtn('requests','Requests', FileText)}
        {RailBtn('orders','Orders', Package)}
        {RailBtn('inventory','Inventory', Boxes)}
        {RailBtn('vendors','Vendors', Users)}
        {RailBtn('reports','Reports', BarChart3)}
        <Dot />
        {RailBtn('calendar','Calendar', CalendarDays)}
        {RailBtn('profile','Profile', UserIcon)}
        <Dot />
        {RailBtn('tasks','Tasks', CheckSquare)}
        {RailBtn('vault','Archive', Archive)}
        <Dot />
        {RailBtn('invoice','B2B Marketplace', Receipt)}
      </div>
    );
  }

  const Item = (p: Page, label: string, Icon: LucideIcon, opts?: { subtle?: boolean }) => (
    <button
      onClick={() => setPage(p)}
      className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg transition-colors ${
        page === p
          ? "bg-gray-900 text-white shadow-sm"
          : opts?.subtle
          ? "text-gray-600 hover:bg-gray-100"
          : "text-gray-700 hover:bg-gray-100"
      }`}
      aria-current={page === p ? 'page' : undefined}
    >
      <Icon className={`w-4.5 h-4.5 ${page === p ? "text-white" : "text-gray-500"}`} strokeWidth={page === p ? 2.6 : 2} />
      <span className="text-[13.5px] font-medium">{label}</span>
    </button>
  );

  const Group: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}
        className="w-full flex items-center justify-between px-2 py-1 text-[11px] uppercase tracking-wide text-gray-500 hover:text-gray-700"
      >
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open[id] ? 'rotate-180' : ''}`} />
      </button>
      {open[id] && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );

  return (
    <aside className={"w-full h-full bg-white p-4 overflow-y-auto"}>
      <div className="mb-4 px-2">
        <div className="w-full h-12 overflow-hidden">
          <img src="/logo.svg" alt="NCS Logo" className="h-full w-auto object-contain" />
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] uppercase text-gray-500">Dashboard</div>
        {Item("dashboard", "Overview", Home)}
        {Item("lab", "Lab", FlaskConical)}
      </div>

      <Group id="rooms" title="Rooms">
        {Item("requests", "Requests", FileText)}
        {Item("orders", "Orders", Package)}
        {Item("inventory", "Inventory", Boxes)}
        {Item("vendors", "Vendors", Users)}
        {Item("reports", "Reports", BarChart3)}
      </Group>

      <Group id="boards" title="Boards">
        {Item("tasks", "Tasks", CheckSquare)}
        {Item("vault", "Archive", Archive)}
      </Group>

      <Group id="tools" title="Tools">
        {Item("calendar", "Calendar", CalendarDays)}
        {Item("profile", "Profile", UserIcon)}
      </Group>

      <Group id="finance" title="Finance">
        {Item("invoice", "B2B Marketplace", Receipt)}
      </Group>
    </aside>
  );
}

export default function ProtectedApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, refresh } = useAuth();
  const [page, setPage] = useState<Page>(() => pageFromPath(location.pathname));
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('ncs_sidebar_open');
      if (s === '0') return false;
      if (s === '1') return true;
    } catch {}
    return true;
  });

  useEffect(() => {
    try { localStorage.setItem('ncs_sidebar_open', sidebarOpen ? '1' : '0'); } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    const resolved = pageFromPath(location.pathname);
    setPage((prev) => (prev === resolved ? prev : resolved));
    const expected = pathFromPage(resolved);
    if (normalizePathname(location.pathname) !== expected) {
      navigate(expected, { replace: true });
    }
  }, [location.pathname, navigate]);

  const setPageAndNavigate = useCallback((next: Page) => {
    const target = pathFromPage(next);
    setPage(next);
    if (normalizePathname(location.pathname) !== target) {
      navigate(target);
    }
  }, [location.pathname, navigate]);

  const handleLogout = useCallback(() => {
    void (async () => {
      await logout();
      navigate('/login', { replace: true });
    })();
  }, [logout, navigate]);

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
      const res = await fetch(`${API_URL}/api/requests`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        await refresh();
        throw new Error('Authentication required');
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || "Failed to load requests");
      }
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      setList(items);
      try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
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
              onClick={() => setPageAndNavigate("requests")}
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
                // Map modal payload to API payload for update
                const sumQty2 = (payload.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
                const apiUpdatePayload = {
                  title: payload.items?.[0]?.name || payload.orderNo || "New Request",
                  type: payload.type,
                  department: payload.department,
                  priority: 'Medium',
                  quantity: sumQty2 || 1,
                  specs: payload.notes,
                  items: (payload.items || []).map((it: any) => ({
                    name: it.name,
                    qty: Number(it.qty) || 0,
                    unit: it.unit,
                    note: it.note,
                  })),
                };
                await updateRequest(editTarget.id, apiUpdatePayload as any);
              } else {
                // Optimistic add at top, then reconcile with server response (robust)
                setList(prev => [optimisticNew, ...prev]);
                // Map modal payload to API payload for create
                const apiCreatePayload = {
                  title: payload.items?.[0]?.name || payload.orderNo || "New Request",
                  type: payload.type,
                  department: payload.department,
                  priority: 'Medium',
                  quantity: sumQty || 1,
                  specs: payload.notes,
                  items: (payload.items || []).map((it: any) => ({
                    name: it.name,
                    qty: Number(it.qty) || 0,
                    unit: it.unit,
                    note: it.note,
                  })),
                };
                const created = await createRequest(apiCreatePayload as any).catch(() => null);
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
    <AssistantProvider>
    <div className="grid min-h-screen bg-gray-50" style={{ gridTemplateColumns: '294px 1fr' }}>
      {/* Fixed sidebar layer that always spans viewport height */}
      <div className="relative">
        <div className="fixed left-0 top-0 bottom-0 w-[294px] bg-white z-40 shadow-[4px_0_12px_rgba(0,0,0,0.04)] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">
          <Sidebar page={page} setPage={setPageAndNavigate} collapsed={false} />
        </div>
      </div>

      {/* Main content column */}
      <div className="min-h-screen flex flex-col min-w-0">
        <Topbar className="sticky top-0 z-40" user={user} onLogout={handleLogout} />
        <main className="flex-1 min-h-0">
          <div className="mx-auto w-full max-w-screen-2xl">
            {page === "dashboard" && (
              <ErrorBoundary>
                <Overview />
              </ErrorBoundary>
            )}
            {page === "requests" && (
              <ErrorBoundary>
                <RequestsPage />
              </ErrorBoundary>
            )}
            {page === "orders" && (
              <ErrorBoundary>
                <Orders />
              </ErrorBoundary>
            )}
            {page === "inventory" && (
              <ErrorBoundary>
                <Inventory />
              </ErrorBoundary>
            )}
            {page === "vendors" && (
              <ErrorBoundary>
                <VendorsRoom />
              </ErrorBoundary>
            )}
            {page === "reports" && (
              <ErrorBoundary>
                <ReportsPage />
              </ErrorBoundary>
            )}
            {page === "lab" && (
              <ErrorBoundary>
                <LabPage />
              </ErrorBoundary>
            )}
            {page === "tasks" && (
              <ErrorBoundary>
                <TasksListPage />
              </ErrorBoundary>
            )}
            {page === "vault" && (
              <ErrorBoundary>
                <ArchivePage />
              </ErrorBoundary>
            )}
            {page === "calendar" && (
              <ErrorBoundary>
                <CalendarPage />
              </ErrorBoundary>
            )}
            {page === "profile" && (
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            )}
            {page === "invoice" && (
              <ErrorBoundary>
                <Marketplace />
              </ErrorBoundary>
            )}
            <Footer />
          </div>
          </main>
      </div>
      {/* Global Floating Assistant */}
      <AssistantLauncher />
    </div>
    </AssistantProvider>
  );
}

// VendorsRoom: simplified shell with placeholders
function VendorsRoom() {
  // Render the full Vendors page implementation instead of placeholders
  return <Vendors />;
}
function OrdersRoom() { return <Orders />; }
function InventoryRoom() { return <Inventory />; }

function ReportsRoom() { return <ReportsPage />; }
// Lab removed per user request
