import * as React from 'react';
import { Activity, Loader2, Upload, Send, X, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getRfq } from '../lib/api';
import {
  saveRfq,
  saveRfqItem,
  sendRfqToPo,
  refreshRfqs,
} from '../stores/useRfqStore';
import { refreshPurchaseOrders } from '../pages/orders/purchaseOrdersStore';
import type { RfqRecordDTO, RfqItemDTO } from '../lib/api';
import { useApiHealth } from '../context/ApiHealthContext';

const QUOTATION_STATUSES = ['Draft', 'Sent', 'Approved', 'Rejected', 'SentToPO'] as const;
const SHOW_SEND_TO_PO = false;

type QuotationModalProps = {
  rfqId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenComparison?: (requestId: string) => void;
};

type DraftItem = RfqItemDTO & {
  materialNo?: string | null;
  description?: string | null;
  unit?: string | null;
};

type DraftRfq = RfqRecordDTO & {
  items: DraftItem[];
};

function cloneRfq(record: RfqRecordDTO): DraftRfq {
  return {
    ...record,
    locked: Boolean(record.locked),
    items: (record.items || []).map((item) => ({ ...item })),
  };
}

function computeLineTotal(item: DraftItem) {
  const qty = Number(item.qty ?? 0) || 0;
  const unitPrice = Number(item.unitPriceSar ?? 0) || 0;
  return Math.round(qty * unitPrice * 100) / 100;
}

function diffHeader(original: DraftRfq | null, draft: DraftRfq) {
  const payload: Record<string, unknown> = {};
  if (!original || draft.quotationNo !== original.quotationNo) payload.quotationNo = draft.quotationNo ?? null;
  if (!original || draft.status !== original.status) payload.status = draft.status;
  if (!original || draft.vendorName !== original.vendorName) payload.vendorName = draft.vendorName ?? null;
  return payload;
}

function diffItems(original: DraftRfq | null, draft: DraftRfq) {
  if (!original) return draft.items.map((item) => ({ id: item.id, payload: { qty: item.qty, unitPriceSar: item.unitPriceSar, materialNo: item.materialNo ?? null, description: item.description ?? null, unit: item.unit ?? null } }));
  const changes: Array<{ id: string; payload: Record<string, unknown> }> = [];
  draft.items.forEach((item) => {
    const prev = original.items.find((entry) => entry.id === item.id);
    if (!prev) return;
    const payload: Record<string, unknown> = {};
    if (Number(item.qty ?? 0) !== Number(prev.qty ?? 0)) payload.qty = Number(item.qty ?? 0) || 0;
    if (Number(item.unitPriceSar ?? 0) !== Number(prev.unitPriceSar ?? 0)) payload.unitPriceSar = Number(item.unitPriceSar ?? 0) || 0;
    if ((item.materialNo ?? null) !== (prev.materialNo ?? null)) payload.materialNo = item.materialNo ?? null;
    if ((item.description ?? null) !== (prev.description ?? null)) payload.description = item.description ?? null;
    if ((item.unit ?? null) !== (prev.unit ?? null)) payload.unit = item.unit ?? null;
    if (Object.keys(payload).length) {
      changes.push({ id: item.id, payload });
    }
  });
  return changes;
}

export default function QuotationModal({ rfqId, open, onClose, onOpenComparison }: QuotationModalProps) {
  const [draft, setDraft] = React.useState<DraftRfq | null>(null);
  const [original, setOriginal] = React.useState<DraftRfq | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [poNumber, setPoNumber] = React.useState('');
  const [poPrompt, setPoPrompt] = React.useState(false);
  const { healthy, disableWrites } = useApiHealth();

  React.useEffect(() => {
    let cancelled = false;
    if (open && rfqId) {
      if (!healthy) {
        setDraft(null);
        setOriginal(null);
        setPoPrompt(false);
        setPoNumber('');
        setLoading(false);
      } else {
        setLoading(true);
        getRfq(rfqId)
          .then((record) => {
            if (cancelled) return;
            const cloned = cloneRfq(record);
            setDraft(cloned);
            setOriginal(cloneRfq(record));
          })
          .catch((error: any) => {
            toast.error(error?.message ?? 'Failed to load RFQ');
            setDraft(null);
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      }
    } else {
      setDraft(null);
      setOriginal(null);
      setPoPrompt(false);
      setPoNumber('');
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [healthy, open, rfqId]);

  React.useEffect(() => {
    if (disableWrites) {
      setPoPrompt(false);
    }
  }, [disableWrites]);

  const total = React.useMemo(() => {
    if (!draft) return 0;
    return draft.items.reduce((sum, item) => sum + computeLineTotal(item), 0);
  }, [draft?.items]);

  const handleItemChange = (id: string, key: keyof DraftItem, value: string | number) => {
    if (draft?.locked) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
      };
    });
  };

  const handleSave = async () => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    if (draft?.locked) {
      toast.error('This RFQ is locked because the purchase order was completed');
      return;
    }
    if (!rfqId || !draft) return;
    setSaving(true);
    try {
      const headerDiff = diffHeader(original, draft);
      if (Object.keys(headerDiff).length) {
        await saveRfq(rfqId, headerDiff as any);
      }
      const itemDiffs = diffItems(original, draft);
      for (const change of itemDiffs) {
        await saveRfqItem(rfqId, change.id, change.payload as any);
      }
      await refreshRfqs();
      toast.success('Quotation updated');
      setOriginal(cloneRfq(draft));
      onClose();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToPo = async () => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    if (draft?.locked) {
      toast.error('This RFQ is locked because the purchase order was completed');
      return;
    }
    if (!rfqId) return;
    if (!poNumber.trim()) {
      toast.error('Please provide a PO number');
      return;
    }
    setSaving(true);
    try {
      await sendRfqToPo(rfqId, { orderNo: poNumber.trim() });
      await Promise.allSettled([refreshRfqs(), refreshPurchaseOrders()]);
      toast.success(`Sent to Purchase Order ${poNumber.trim()}`);
      setPoPrompt(false);
      setPoNumber('');
      onClose();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to send to PO');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40">
      <div className="w-[min(1020px,95vw)] max-h-[92vh] overflow-hidden rounded-2xl border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">Quotation Details</div>
            <div className="text-sm text-gray-500">
              {draft?.request?.orderNo ? `Request ${draft.request.orderNo}` : 'Review supplier quotation'}
            </div>
            {draft?.locked ? (
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <Lock className="h-3 w-3" /> Locked by completed purchase order
              </div>
            ) : null}
            {!healthy ? (
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Backend unavailable
              </div>
            ) : null}
          </div>
          <button onClick={onClose} className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-160px)] overflow-auto px-5 py-4 space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading quotation…
            </div>
          ) : draft ? (
            <>
              <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quotation No</span>
                  <input
                    value={draft.quotationNo ?? ''}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, quotationNo: event.target.value } : prev))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Enter quotation number"
                    disabled={draft.locked || disableWrites}
                  />
                </label>
                <InfoCard label="Request No" value={draft.request?.orderNo ?? '—'} />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vendor</span>
                  <input
                    value={draft.vendorName ?? ''}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, vendorName: event.target.value } : prev))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Vendor name"
                    disabled={draft.locked || disableWrites}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</span>
                  <select
                    value={draft.status}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, status: event.target.value } : prev))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    disabled={draft.locked || disableWrites}
                  >
                    {QUOTATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status === 'SentToPO' ? 'Sent to PO' : status}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Items</div>
                    <div className="text-xs text-gray-500">Update unit prices to calculate totals</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Total: {total.toLocaleString()} SAR</div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Material NO</th>
                        <th className="px-3 py-2 text-left">Material Description</th>
                        <th className="px-3 py-2 text-center">Quantity</th>
                        <th className="px-3 py-2 text-center">Unit</th>
                        <th className="px-3 py-2 text-center">Unit Price</th>
                        <th className="px-3 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2 align-middle text-sm text-gray-700">{item.materialNo || '—'}</td>
                          <td className="px-3 py-2 align-middle text-sm text-gray-700">{item.description || '—'}</td>
                          <td className="px-3 py-2 text-center align-middle">
                        <input
                          type="number"
                          min={0}
                          value={item.qty}
                          onChange={(event) => handleItemChange(item.id, 'qty', Number(event.target.value) || 0)}
                          className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-sky-500"
                          disabled={draft.locked || disableWrites}
                        />
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        <input
                          value={item.unit ?? ''}
                          onChange={(event) => handleItemChange(item.id, 'unit', event.target.value)}
                          className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Unit"
                          disabled={draft.locked || disableWrites}
                        />
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPriceSar ?? 0}
                          onChange={(event) => handleItemChange(item.id, 'unitPriceSar', Number(event.target.value) || 0)}
                          className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="0.00"
                          disabled={draft.locked || disableWrites}
                        />
                      </td>
                          <td className="px-3 py-2 text-right align-middle text-sm font-semibold text-gray-700">
                            {computeLineTotal(item).toLocaleString()} SAR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Attachments</div>
                    <div className="text-xs text-gray-500">Upload supplier offers (PDF / JPEG)</div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-400">
                    <Upload className="h-3.5 w-3.5" /> Coming soon
                  </span>
                </div>
              </section>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-500">No quotation selected.</div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-5 py-4">
          <div className="flex items-center gap-2">
            {draft?.requestId ? (
              <button
                onClick={() => onOpenComparison?.(draft.requestId as string)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                <Activity className="h-3.5 w-3.5" /> Comparison
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
            {!draft?.locked ? (
              <>
                {SHOW_SEND_TO_PO ? (
                  <button
                    onClick={() => setPoPrompt(true)}
                    disabled={!draft || saving || disableWrites}
                    className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Send to PO
                  </button>
                ) : null}
                <button
                  onClick={handleSave}
                  disabled={saving || loading || !draft || disableWrites}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {poPrompt ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border bg-white p-5 shadow-2xl">
            <div className="text-lg font-semibold text-gray-900">Send to Purchase Order</div>
            <p className="mt-1 text-sm text-gray-500">Provide a PO number to issue the purchase order.</p>
            <label className="mt-4 flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">PO Number</span>
              <input
                value={poNumber}
                onChange={(event) => setPoNumber(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="PO-2024-001"
              />
            </label>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setPoPrompt(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleSendToPo}
                disabled={saving || disableWrites}
                className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type InfoCardProps = {
  label: string;
  value: React.ReactNode;
};

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
