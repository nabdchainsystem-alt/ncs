import { useEffect, useMemo, useState } from "react";
import { createRequest, getRequests } from "./lib/api";
import type { RequestItem, Priority, Status } from "./types";

/** API base (fallback to localhost:4000 if .env not set) */
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

/** Inline helper to update request status */
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

/** Vault helpers */
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

export default function App() {
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
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return list.filter(r => {
      const okDept = filterDept === "All" || r.department === filterDept;
      const okStatus = filterStatus === "All" || r.status === filterStatus;
      return okDept && okStatus;
    });
  }, [list, filterDept, filterStatus]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createRequest({ title, type, department, priority, quantity, specs });
      setTitle(""); setSpecs(""); setQuantity(1);
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

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">NCS — Requests Room</h1>
        <button onClick={load} className="px-3 py-2 rounded bg-gray-900 text-white text-sm">Refresh</button>
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
          <span className="ml-auto text-sm text-gray-600">{filtered.length} / {list.length} items</span>
        </div>
      </section>

      {/* Requests Table */}
      <section className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Dept</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Vault</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.title}</td>
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
