import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getStores, updateRequest, type StoreDTO } from '../../lib/api';
import { Button } from '../ui/Button';
import { REQUEST_TYPES, DEPARTMENTS } from '../../lib/constants';

export type RequestForEdit = {
  id: number;
  requestNo?: string;
  vendor?: string;
  department?: string;
  warehouse?: string;
  machine?: string;
  date?: string; // ISO date
  type?: string;
  items?: any[];
  storeId?: number;
  storeName?: string;
};

interface EditRequestModalProps {
  open: boolean;
  onClose: () => void;
  request: RequestForEdit;
  onUpdated?: () => void; // refresh callback
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

/**
 * EditRequestModal – small, dependency-light modal to update or delete a request.
 *
 * Expectations about API shape:
 * - `updateRequest(id, payload)` updates header fields and replaces items.
 * - `deleteRequest(id)` deletes the request.
 *
 * The payload we send is intentionally flexible (loosely typed) so it can adapt to
 * the current server DTO while we stabilize the schema.
 */
const EditRequestModal: React.FC<EditRequestModalProps> = ({ open, onClose, request, onUpdated }) => {
  const [requestNo, setRequestNo] = useState<string>(request.requestNo ?? (request as any).orderNo ?? '');
  const [vendor, setVendor] = useState<string>(request.vendor ?? '');
  const [department, setDepartment] = useState<string>(request.department ?? '');
  const [warehouse, setWarehouse] = useState<string>(request.warehouse ?? '');
  const [machine, setMachine] = useState<string>((request as any).machine ?? '');
  const [requiredDate, setRequiredDate] = useState<string>(
    toDateInput((request as any)?.requiredDate || request?.date || (request as any)?.createdAt)
  );
  const [type, setType] = useState<string>(request.type ?? 'Purchase');
  const [storeId, setStoreId] = useState<string>(request.storeId != null ? String(request.storeId) : '');
  const [stores, setStores] = useState<StoreDTO[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoadingStores(true);
    getStores()
      .then((list) => {
        if (!mounted) return;
        setStores(list);
        if (!request.storeId && !storeId && list.length) {
          setStoreId(String(list[0].id));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setStores([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingStores(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset form when request or modal open changes
  useEffect(() => {
    if (!open) return;
    setRequestNo(request.requestNo ?? (request as any).orderNo ?? '');
    setVendor(request.vendor ?? '');
    setDepartment(request.department ?? '');
    setWarehouse(request.warehouse ?? '');
    setMachine((request as any).machine ?? '');
    setRequiredDate(toDateInput((request as any)?.requiredDate || request?.date || (request as any)?.createdAt));
    setType(request.type ?? 'Purchase');
    setStoreId(request.storeId != null ? String(request.storeId) : '');
  }, [open, request]);

  const canSave = useMemo(() => {
    const okNo = (requestNo?.trim().length ?? 0) > 0;
    const okStore = storeId !== '';
    return okNo && okStore && !saving;
  }, [requestNo, storeId, saving]);

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      // Build flexible payload compatible with current server expectations
      const no = requestNo?.trim() || undefined;
      const payload: any = {
        orderNo: no,
        vendor: vendor?.trim() || undefined,
        department,
        warehouse,
        machine: machine?.trim() || undefined,
        requiredDate: requiredDate || undefined,
        type,
        storeId: storeId ? Number(storeId) : undefined,
      };

      console.debug('EditRequestModal: PATCH header for id=', request.id, payload);
      await updateRequest(String(request.id), payload as any);
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error('updateRequest failed', err);
      alert('Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-[min(980px,92vw)] rounded-2xl border bg-white shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Edit Request</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* Basic Data */}
          <section>
            <div className="mb-3 text-sm font-medium text-neutral-700">Basic Data</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Request No</span>
                <input value={requestNo} onChange={(e) => setRequestNo(e.target.value)} className="input" placeholder="REQ-2025-0001" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Vendor</span>
                <input value={vendor} onChange={(e) => setVendor(e.target.value)} className="input" placeholder="Vendor" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Department</span>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Store</span>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="input"
                  disabled={loadingStores}
                >
                  <option value="">{loadingStores ? 'Loading stores…' : 'Select store'}</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Warehouse</span>
                <input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="input" placeholder="26 - Production" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Machine</span>
                <input value={machine} onChange={(e) => setMachine(e.target.value)} className="input" placeholder="Machine" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Date</span>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input"
                >
                  <option value="">Select type</option>
                  {REQUEST_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <Button onClick={onClose} size="sm" title="Cancel editing">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
            title="Save changes"
            className="flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRequestModal;

// ---- small style helpers (rely on your Tailwind theme) ----
// These classnames are used across the project (as per previous setup).
// If you have a shared Button/Input component, feel free to swap them in.
declare global {
  // Allow className shortcuts via JSX by declaring module augmentation
  namespace JSX {
    interface IntrinsicElements {
      // none – just here as a placeholder if needed later
    }
  }
}

// Utility classes (can be overridden by project-wide CSS)
// input
// btn
// btn-primary
// are expected to exist in your tailwind setup.
