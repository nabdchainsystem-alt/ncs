import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

export type ItemDraft = {
  id?: number;
  code?: string;
  name: string;
  qty: number;
  unit?: string;
  note?: string; // free-form / JSON string if you like
};

export type ManageItemsModalProps = {
  open: boolean;
  onClose: () => void;
  requestId: number | string;
  initialItems?: ItemDraft[];
  onSave?: (items: ItemDraft[]) => void; // callback only – لا API calls هنا
};

// مكون مستقل لإدارة المواد – بدون ربط API الآن.
// عند الضغط Save يمرر العناصر الصحيحة للأب عبر onSave.
export default function ManageItemsModal({ open, onClose, requestId, initialItems, onSave }: ManageItemsModalProps) {
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setItems(() => (initialItems && Array.isArray(initialItems) ? initialItems.map(safeCast) : []));
    }
  }, [open, initialItems]);

  const canSave = useMemo(() => {
    const hasValid = items.some(isValidRow);
    return hasValid && !saving;
  }, [items, saving]);

  function safeCast(row: Partial<ItemDraft>): ItemDraft {
    return {
      id: row.id,
      code: (row.code ?? '').toString(),
      name: (row.name ?? '').toString(),
      qty: Number(row.qty ?? 0),
      unit: (row.unit ?? '').toString(),
      note: typeof row.note === 'string' ? row.note : (row.note ? JSON.stringify(row.note) : ''),
    };
  }

  function isValidRow(r: ItemDraft) {
    if (!r) return false;
    const nameOk = (r.name?.trim().length ?? 0) > 0;
    const qtyOk = Number(r.qty) > 0;
    return nameOk && qtyOk; // الحد الأدنى
  }

  function addLine() {
    setItems((prev) => [
      ...prev,
      { name: '', qty: 1, code: '', unit: '', note: '' },
    ]);
  }

  function updateLine(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeLine(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    try {
      setSaving(true);
      const cleaned = items.map(safeCast).filter(isValidRow);
      onSave?.(cleaned);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-[101] w-[min(980px,96vw)] max-h-[90vh] overflow-hidden rounded-2xl border bg-white shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold">Manage Items</div>
            <div className="text-xs text-gray-500">Request #{String(requestId)}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-auto">
          {/* Toolbar */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">Add / edit request items. (No API calls – local only)</div>
            <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={addLine} title="Add new line">
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-3 py-2 w-[120px]">Code</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 w-[120px]">Qty</th>
                  <th className="px-3 py-2 w-[140px]">Unit</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2 w-[70px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No items. Click “Add line”.</td>
                  </tr>
                )}
                {items.map((row, idx) => {
                  const valid = isValidRow(row);
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2 align-top">
                        <input
                          className="h-9 w-full rounded-lg border px-2 text-sm input-focus"
                          value={row.code ?? ''}
                          onChange={(e) => updateLine(idx, { code: e.currentTarget.value })}
                          placeholder="e.g. M-1001"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          className="h-9 w-full rounded-lg border px-2 text-sm input-focus"
                          value={row.name}
                          onChange={(e) => updateLine(idx, { name: e.currentTarget.value })}
                          placeholder="Item name"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          min={0}
                          className="h-9 w-full rounded-lg border px-2 text-sm input-focus"
                          value={Number.isFinite(row.qty) ? row.qty : 0}
                          onChange={(e) => updateLine(idx, { qty: Number(e.currentTarget.value) })}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          className="h-9 w-full rounded-lg border px-2 text-sm input-focus"
                          value={row.unit ?? ''}
                          onChange={(e) => updateLine(idx, { unit: e.currentTarget.value })}
                          placeholder="PCS"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          className="h-9 w-full rounded-lg border px-2 text-sm input-focus"
                          value={row.note ?? ''}
                          onChange={(e) => updateLine(idx, { note: e.currentTarget.value })}
                          placeholder="Note (optional)"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-gray-50"
                          title="Remove line"
                          onClick={() => removeLine(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {!valid && (
                          <div className="mt-1 text-[11px] text-amber-600">Name & Qty required</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <Button onClick={onClose} size="sm">Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!canSave} className="flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
