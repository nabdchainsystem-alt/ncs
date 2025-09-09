import React, { useMemo, useState } from "react";
import { createRequest } from "../lib/api";

type ItemRow = {
  id: string;
  name: string;
  code: string;
  qty: number;
  unit: string;
};

export default function NewRequestModal({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: {
    orderNo?: string;
    type?: string;
    department?: string;
    vendor?: string;
    notes?: string;
    items?: ItemRow[];
  };
  onClose: () => void;
  onSubmit: (payload: {
    orderNo: string;        // API expects orderNo (UI label is Request No)
    type: string;
    department: string;
    vendor?: string;
    notes?: string;
    items: ItemRow[];
  }) => Promise<void> | void;
}) {
  const [requestNo, setRequestNo] = useState("");
  const [type, setType] = useState("Purchase");
  const [department, setDepartment] = useState("IT");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), name: "", code: "", qty: 1, unit: "pcs" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    // If `initial` provided → edit mode; otherwise fresh form
    setRequestNo(initial?.orderNo ?? "");
    setType(initial?.type ?? "Purchase");
    setDepartment(initial?.department ?? "IT");
    setVendor(initial?.vendor ?? "");
    setNotes(initial?.notes ?? "");
    setItems(
      initial?.items && initial.items.length > 0
        ? initial.items.map(it => ({ ...it, id: it.id || crypto.randomUUID() }))
        : [{ id: crypto.randomUUID(), name: "", code: "", qty: 1, unit: "pcs" }]
    );
  }, [open, initial?.orderNo, initial?.type, initial?.department, initial?.vendor, initial?.notes, initial?.items]);

  const canSubmit = useMemo(() => {
    if (!requestNo.trim()) return false;
    if (items.length === 0) return false;
    for (const it of items) {
      if (!it.name.trim()) return false;
      if (it.qty <= 0) return false;
      if (!it.unit.trim()) return false;
    }
    return true;
  }, [requestNo, items]);

  function addItem() {
    setItems((arr) => [
      ...arr,
      { id: crypto.randomUUID(), name: "", code: "", qty: 1, unit: "pcs" },
    ]);
  }
  function removeItem(id: string) {
    setItems((arr) => arr.filter((x) => x.id !== id));
  }
  function updateItem(id: string, patch: Partial<ItemRow>) {
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function handleSubmit() {
    setError(null);
    if (!canSubmit) return;
    try {
      setSaving(true);
      await createRequest({
        orderNo: requestNo.trim(),
        type,
        department,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map(it => ({
          name: it.name,
          code: it.code || undefined,
          qty: Number(it.qty || 0),
          unit: it.unit || undefined,
        })),
      });
      // Optional: keep parent hook if it relies on onSubmit to refresh UI state
      await onSubmit({
        orderNo: requestNo.trim(),
        type,
        department,
        vendor,
        notes: notes.trim() || undefined,
        items,
      });
      window.dispatchEvent(new CustomEvent('ncs:requests:created'));
      setSaving(false);
      onClose();
      location.reload();
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || "Failed to create request");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white w-[780px] max-w-[95vw] rounded-lg shadow-lg border border-gray-200">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">{initial ? "Edit Request" : "New Request"}</div>
          <button onClick={onClose} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error ? (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          ) : null}

          {/* Main fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <div className="text-gray-700 mb-1">Request No</div>
              <input
                value={requestNo}
                onChange={(e) => setRequestNo(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. REQ-20250903-001"
              />
            </label>
            <label className="text-sm">
              <div className="text-gray-700 mb-1">Type</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option>Purchase</option>
                <option>Maintenance</option>
                <option>Service</option>
                <option>Other</option>
              </select>
            </label>
            <label className="text-sm">
              <div className="text-gray-700 mb-1">Department</div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option>IT</option>
                <option>Operations</option>
                <option>Finance</option>
                <option>HR</option>
                <option>Logistics</option>
              </select>
            </label>
            <label className="text-sm">
              <div className="text-gray-700 mb-1">Vendor</div>
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Vendor name"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <div className="text-gray-700 mb-1">Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-20 border rounded px-3 py-2"
                placeholder="Optional notes for this request"
              />
            </label>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Line Items</div>
              <button onClick={addItem} className="px-3 py-1.5 text-sm rounded bg-slate-800 text-white">
                + Add item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Code</th>
                    <th className="px-2 py-2">Qty</th>
                    <th className="px-2 py-2">Unit</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="px-2 py-2">
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(it.id, { name: e.target.value })}
                          className="w-full border rounded px-2 py-1"
                          placeholder="Item name"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={it.code}
                          onChange={(e) => updateItem(it.id, { code: e.target.value })}
                          className="w-full border rounded px-2 py-1"
                          placeholder="SKU / Code"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          value={it.qty}
                          onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) })}
                          className="w-24 border rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={it.unit}
                          onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                          className="w-28 border rounded px-2 py-1"
                        >
                          <option value="pcs">pcs</option>
                          <option value="box">box</option>
                          <option value="kg">kg</option>
                          <option value="m">m</option>
                          <option value="l">l</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeItem(it.id)}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-6 text-center text-gray-400">
                        No items. Click “Add item”.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm border rounded hover:bg-gray-50" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="px-3 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {saving ? (initial ? "Saving..." : "Creating...") : (initial ? "Save Changes" : "Create Request")}
          </button>
        </div>
      </div>
    </div>
  );
}
