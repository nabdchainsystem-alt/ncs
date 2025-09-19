import React from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { getRequest, type RequestDTO } from "../../lib/api";
import type { Approval } from "../../types";
import useRequestItemsActions from "../../hooks/useRequestItemsActions";

type RequestDetailsModalProps = {
  open: boolean;
  requestId?: string | number;
  request?: RequestDTO | null;
  onClose: () => void;
  onEdit?: (request: RequestDTO) => void;
  onRefresh?: () => Promise<void> | void;
};

const toDateDisplay = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const toTitle = (value?: string | null) => (value && value.trim() ? value : "—");

const ItemCell = ({ children, center }: { children: React.ReactNode; center?: boolean }) => (
  <td className={`px-3 py-2 text-sm ${center ? "text-center" : "text-left"}`}>{children}</td>
);

export default function RequestDetailsModal({ open, requestId, request, onClose, onEdit, onRefresh }: RequestDetailsModalProps) {
  const [data, setData] = React.useState<RequestDTO | null>(request ?? null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const effectiveId = requestId ?? data?.id ?? request?.id;

  const refresh = React.useCallback(async () => {
    if (effectiveId == null) return;
    try {
      setLoading(true);
      const res = await getRequest(effectiveId);
      setData(res);
      setError(null);
      await onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [effectiveId, onRefresh]);

  React.useEffect(() => {
    if (!open) return;
    if (request) {
      setData(request);
      setError(null);
      setLoading(false);
    }
    if (effectiveId) {
      refresh();
    }
  }, [open, effectiveId, request, refresh]);

  const { deleteItem, isBusy } = useRequestItemsActions({
    onRefresh: refresh,
    toast: {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
    },
  });

  const handleDeleteItem = async (itemId: string | number) => {
    if (effectiveId == null) return;
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;
    try {
      const key = String(effectiveId);
      await deleteItem(key, String(itemId));
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete item");
    }
  };

  if (!open) return null;

  const items = data?.items ?? [];
  const requestKey = effectiveId == null ? "" : String(effectiveId);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 backdrop-blur-sm">
      <div className="w-[min(1000px,95vw)] max-h-[88vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-lg font-semibold">Request Details</div>
            <div className="text-sm text-gray-500">Request #{toTitle(data?.requestNo)}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => data && onEdit?.(data)}
              disabled={!data}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" /> Edit Request
            </button>
            <button onClick={onClose} className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(88vh-120px)] overflow-auto px-5 py-4 space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Request No" value={toTitle(data?.requestNo)} />
            <Field label="Description" value={toTitle(data?.description)} />
            <Field label="Department" value={toTitle(data?.department)} />
            <Field label="Warehouse" value={toTitle(data?.warehouse)} />
            <Field label="Machine" value={toTitle(data?.machine)} />
            <Field label="Priority" value={toTitle(data?.priority)} />
            <Field label="Status" value={toTitle(data?.status)} />
            <Field label="Approval" value={formatApproval(data?.approval)} />
            <Field label="Required Date" value={toDateDisplay(data?.requiredDate)} />
            <Field label="Date Requested" value={toDateDisplay(data?.dateRequested)} />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Items ({items.length})</div>
              <button
                onClick={refresh}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-center">Material Code</th>
                    <th className="px-3 py-2 text-center">Material Description</th>
                    <th className="px-3 py-2 text-center">Quantity</th>
                    <th className="px-3 py-2 text-center">Unit</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No items available.</td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const itemKey = item.id === null || item.id === undefined ? undefined : String(item.id);
                      const safeItemKey = itemKey ?? "";
                      const itemBusy = (isBusy as (reqId?: any, itemId?: any) => boolean)(requestKey, safeItemKey);
                      return (
                        <tr key={itemKey ?? `${item.code}-${item.description}`} className="border-t text-sm">
                          <ItemCell center>{toTitle(item.code)}</ItemCell>
                          <ItemCell center>{toTitle(item.description ?? item.name)}</ItemCell>
                          <ItemCell center>{item.qty ?? "—"}</ItemCell>
                          <ItemCell center>{toTitle(item.unit)}</ItemCell>
                          <ItemCell center>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => data && onEdit?.(data)}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                              onClick={() => handleDeleteItem(safeItemKey)}
                              disabled={itemBusy}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                              {itemBusy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Delete
                              </button>
                            </div>
                          </ItemCell>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end border-t px-5 py-4">
          <button onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>

    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

function formatApproval(value?: Approval | string | null) {
  if (!value) return '—';
  const normalized = typeof value === 'string' ? value : String(value);
  return normalized === 'OnHold' ? 'On Hold' : normalized;
}
