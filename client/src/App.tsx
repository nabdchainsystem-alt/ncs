import { useEffect, useMemo, useState } from "react";
import { createRequest, getRequests } from "./lib/api";
import type { RequestItem, Priority, Status } from "./types";

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
  New: "bg-gray-200 text-gray-800",
  "Under Review": "bg-yellow-200 text-yellow-800",
  Quotation: "bg-blue-200 text-blue-800",
  Approved: "bg-green-200 text-green-800",
};

function StatusBadge({ value }: { value: Status }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[value]}`}>
      {value}
    </span>
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
  const [page, setPage] = useState<Page>("requests");

  const [list, setList] = useState<RequestItem[]>([]);
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

  const filtered = useMemo(() => {
    return list.filter((r) => {
      const okDept = filterDept === "All" || r.department === filterDept;
      const okStatus = filterStatus === "All" || r.status === filterStatus;
      const okQuery = query.trim().length === 0 ||
        [r.title, r.type, r.department].some((v) => v.toLowerCase().includes(query.toLowerCase()));
      const okCompleted = !onlyCompleted || !!r.completed;
      return okDept && okStatus && okQuery && okCompleted;
    });
  }, [list, filterDept, filterStatus, query, onlyCompleted]);

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
    try {
      await apiUpdateRequestStatus(id, status);
      await load();
    } catch (e: any) {
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

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(["New", "Under Review", "Quotation", "Approved"] as Status[]).map((st) => {
            const c = list.filter((x) => x.status === st).length;
            return (
              <div key={st} className="bg-white rounded-lg shadow p-3">
                <div className="text-xs text-gray-500">Requests — {st}</div>
                <div className="text-2xl font-semibold">{c}</div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Payments Overview</div>
            <div className="h-32 w-full bg-gradient-to-t from-blue-100 to-transparent rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({length:12}).map((_,i)=>{
                  const h = 20 + ((i*37)%70);
                  return <div key={i} className="flex-1 bg-blue-400/60" style={{height: `${h}%`}}/>;
                })}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold mb-2">Profit this week</div>
            <div className="h-32 w-full rounded relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 px-2 flex gap-2 items-end h-full">
                {Array.from({length:10}).map((_,i)=>{
                  const a = 20 + ((i*53)%70);
                  const b = 10 + ((i*29)%60);
                  return (
                    <div key={i} className="flex-1 flex gap-1 items-end">
                      <div className="flex-1 bg-purple-400/70" style={{height: `${a}%`}}/>
                      <div className="flex-1 bg-cyan-400/70" style={{height: `${b}%`}}/>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function RequestsRoom() {
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
            <button onClick={() => setDark((d) => !d)} className="px-2 py-2 border rounded text-sm" title="Toggle theme">{dark ? "🌙" : "☀️"}</button>
            <button onClick={() => load()} className="px-3 py-2 rounded bg-gray-900 text-white text-sm">Refresh</button>
            <button className="px-2 py-2 border rounded text-sm" title="Notifications">🔔</button>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">MA</div>
          </div>
        </header>

        {/* Mini Reports */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {(["New","Under Review","Quotation","Approved"] as Status[]).map(st => {
            const c = list.filter(x => x.status === st).length;
            return (
              <div key={st} className="bg-white rounded-lg shadow p-3">
                <div className="text-xs text-gray-500">Requests — {st}</div>
                <div className="text-2xl font-semibold">{c}</div>
              </div>
            );
          })}
        </section>

        {/* NRT Form */}
        <section className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold mb-3">New Request Tool (NRT)</h2>
          {error && <div className="mb-3 text-sm text-red-600">{String(error)}</div>}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Title *" value={title} onChange={e=>setTitle(e.target.value)} required />
            <select className="border rounded px-3 py-2" value={type} onChange={e=>setType(e.target.value)}>
              <option>Maintenance</option><option>Raw Material</option><option>Packaging</option><option>Service</option>
            </select>
            <select className="border rounded px-3 py-2" value={department} onChange={e=>setDepartment(e.target.value)}>
              <option>Production</option><option>Maintenance</option><option>Quality</option><option>Warehouse</option>
            </select>
            <select className="border rounded px-3 py-2" value={priority} onChange={e=>setPriority(e.target.value as Priority)}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <input type="number" min={1} className="border rounded px-3 py-2" placeholder="Quantity *" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} required />
            <input className="border rounded px-3 py-2 md:col-span-3" placeholder="Specs / Notes" value={specs} onChange={e=>setSpecs(e.target.value)} />
            <div className="md:col-span-3 flex gap-2 justify-end">
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Create Request</button>
            </div>
          </form>
        </section>

        {/* Filters */}
        <section className="bg-white rounded-lg shadow p-4 mb-3">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-700">Filters:</span>
            <select className="border rounded px-3 py-2" value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
              <option value="All">All Departments</option>
              <option>Production</option><option>Maintenance</option><option>Quality</option><option>Warehouse</option>
            </select>
            <select className="border rounded px-3 py-2" value={filterStatus} onChange={e=>setFilterStatus(e.target.value as Status | "All")}>
              <option value="All">All Status</option>
              <option>New</option><option>Under Review</option><option>Quotation</option><option>Approved</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyCompleted} onChange={(e)=>setOnlyCompleted(e.currentTarget.checked)} />
              Completed only
            </label>
            <span className="ml-auto text-sm text-gray-600">{filtered.length} / {list.length} items</span>
          </div>
        </section>

        {/* Requests Table */}
        <section className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-6 text-gray-600">Loading...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left sticky top-0 z-10">
                <tr>
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
                {filtered.map(r => (
                  <tr key={r.id} className={`border-t ${r.completed ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2">{r.completed ? <span className="line-through">{r.title}</span> : r.title}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.department}</td>
                    <td className="px-3 py-2">{r.priority}</td>
                    <td className="px-3 py-2">{r.quantity}</td>
                    <td className="px-3 py-2"><StatusBadge value={r.status} /></td>
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-3">
                        <select
                          className="border rounded px-2 py-1"
                          value={r.status}
                          onChange={e=>onChangeStatus(r.id, e.target.value as Status)}
                        >
                          <option>New</option>
                          <option>Under Review</option>
                          <option>Quotation</option>
                          <option>Approved</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={!!r.completed}
                            onChange={async (e) => {
                              try {
                                await apiToggleCompleted(r.id, e.currentTarget.checked);
                                await load();
                              } catch (err: any) {
                                setError(err?.message || "Failed to mark completed");
                              }
                            }}
                          />
                          Completed
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td className="px-3 py-6 text-gray-500" colSpan={9}>No requests yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </section>

        {/* Mini Tracker */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Mini Tracker</h3>
          <div className="flex gap-2 text-xs">
            <StatusBadge value="New" />
            <StatusBadge value="Under Review" />
            <StatusBadge value="Quotation" />
            <StatusBadge value="Approved" />
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
