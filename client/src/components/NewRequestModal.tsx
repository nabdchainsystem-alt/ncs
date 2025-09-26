import React from "react";
import { toast } from "react-hot-toast";
import { createRequest, updateRequest, getStores, type RequestDTO, type RequestPriority, type StoreDTO } from "../lib/api";
import { DEPARTMENTS } from "../lib/constants";

export type NewRequestSubmitPayload = {
  requestId?: string | number;
  requestNo: string;
  description: string;
  department?: string;
  warehouse?: string;
  machine?: string;
  priority: RequestPriority;
  requiredDate?: string;
  items: Array<{ id?: string; code?: string; description: string; qty: number; unit?: string; storeId?: number }>;
  storeId?: number;
};

type ItemRow = {
  id: string;
  code: string;
  description: string;
  qty: number;
  unit: string;
};

type NewRequestModalProps = {
  open: boolean;
  initial?: Partial<NewRequestSubmitPayload> & {
    id?: string | number;
    items?: Array<{ id?: string | number; code?: string; description?: string; name?: string; qty?: number; unit?: string }>;
  };
  onClose: () => void;
  onSubmit?: (payload: NewRequestSubmitPayload, result: RequestDTO, ctx: { mode: "create" | "edit" }) => Promise<void> | void;
};

const PRIORITY_OPTIONS: RequestPriority[] = ["Low", "Normal", "High"];

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tmp-${Math.random().toString(36).slice(2, 9)}`;
};

const toInputDate = (value?: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const toPriority = (value?: string): RequestPriority => {
  const v = (value || "").toLowerCase();
  if (v === "low") return "Low";
  if (v === "high" || v === "urgent" || v === "emergency") return "High";
  return "Normal";
};

const toNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function NewRequestModal({ open, initial, onClose, onSubmit }: NewRequestModalProps) {
  const requestId = (initial as any)?.id ?? initial?.requestId;
  const isEdit = requestId != null;

  const initialItems = React.useMemo<ItemRow[]>(() => {
    if (Array.isArray(initial?.items) && initial.items.length) {
      return initial.items.map((it: any) => ({
        id: String(it?.id ?? makeId()),
        code: it?.code ?? "",
        description: it?.description ?? it?.name ?? "",
        qty: Math.max(1, toNumber(it?.qty ?? 1, 1)),
        unit: it?.unit ?? "",
      }));
    }
    return [{ id: makeId(), code: "", description: "", qty: 1, unit: "" }];
  }, [initial?.items]);

  const [requestNo, setRequestNo] = React.useState(initial?.requestNo ?? (initial as any)?.orderNo ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? (initial as any)?.title ?? "");
  const [department, setDepartment] = React.useState(initial?.department ?? "");
  const [warehouse, setWarehouse] = React.useState(initial?.warehouse ?? "");
  const [machine, setMachine] = React.useState(initial?.machine ?? "");
  const [priority, setPriority] = React.useState<RequestPriority>(toPriority(initial?.priority as string));
  const [requiredDate, setRequiredDate] = React.useState(toInputDate(initial?.requiredDate));
  const [storeId, setStoreId] = React.useState<string>(initial?.storeId != null ? String(initial.storeId) : "");
  const [stores, setStores] = React.useState<StoreDTO[]>([]);
  const [loadingStores, setLoadingStores] = React.useState(false);
  const [items, setItems] = React.useState<ItemRow[]>(initialItems);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoadingStores(true);
    getStores()
      .then((list) => {
        if (!mounted) return;
        setStores(list);
        if (!initial?.storeId && !storeId && list.length) {
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
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    setRequestNo(initial?.requestNo ?? (initial as any)?.orderNo ?? "");
    setDescription(initial?.description ?? (initial as any)?.title ?? "");
    setDepartment(initial?.department ?? "");
    setWarehouse(initial?.warehouse ?? "");
    setMachine(initial?.machine ?? "");
    setPriority(toPriority(initial?.priority as string));
    setRequiredDate(toInputDate(initial?.requiredDate));
    setStoreId(initial?.storeId != null ? String(initial.storeId) : "");
    setItems(initialItems);
    setErrors([]);
  }, [open, initial?.requestNo, initial?.description, initial?.department, initial?.warehouse, initial?.machine, initial?.priority, initial?.requiredDate, initial?.storeId, initialItems]);

  const updateItem = (id: string, patch: Partial<ItemRow>) => {
    setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addItem = () => {
    setItems((rows) => [...rows, { id: makeId(), code: "", description: "", qty: 1, unit: "" }]);
  };

  const removeItem = (id: string) => {
    setItems((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  };

  const validate = () => {
    const issues: string[] = [];
    if (!requestNo.trim()) issues.push("Request number is required.");
    if (!description.trim()) issues.push("Request description is required.");
    if (!storeId) issues.push("Store selection is required.");
    if (!items.length) issues.push("At least one item is required.");
    items.forEach((item, index) => {
      if (!item.description.trim()) issues.push(`Item ${index + 1}: description is required.`);
      if (toNumber(item.qty, 0) <= 0) issues.push(`Item ${index + 1}: quantity must be greater than zero.`);
    });
    if (requiredDate && !/^\d{4}-\d{2}-\d{2}$/.test(requiredDate)) {
      issues.push("Required date must use yyyy-mm-dd format.");
    }
    setErrors(issues);
    return issues.length === 0;
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!validate()) return;
    const payload: NewRequestSubmitPayload = {
      requestId,
      requestNo: requestNo.trim(),
      description: description.trim(),
      department: department || undefined,
      warehouse: warehouse || undefined,
      machine: machine || undefined,
      priority,
      requiredDate: requiredDate || undefined,
      storeId: storeId ? Number(storeId) : undefined,
      items: items.map((item) => ({
        id: item.id,
        code: item.code.trim() || undefined,
        description: item.description.trim(),
        qty: Math.max(0, toNumber(item.qty, 0)),
        unit: item.unit.trim() || undefined,
        storeId: storeId ? Number(storeId) : undefined,
      })),
    };

    try {
      setSaving(true);
      const result = isEdit && payload.requestId != null
        ? await updateRequest(String(payload.requestId), {
            requestNo: payload.requestNo,
            description: payload.description,
            department: payload.department,
            warehouse: payload.warehouse,
            machine: payload.machine,
            priority: payload.priority,
            requiredDate: payload.requiredDate,
            storeId: payload.storeId,
            items: payload.items.map((it) => ({
              id: it.id,
              code: it.code,
              name: it.description,
              qty: it.qty,
              unit: it.unit,
              storeId: it.storeId,
            })),
          })
        : await createRequest({
            requestNo: payload.requestNo,
            description: payload.description,
            department: payload.department,
            warehouse: payload.warehouse,
            machine: payload.machine,
            priority: payload.priority,
            requiredDate: payload.requiredDate,
            storeId: payload.storeId,
            items: payload.items.map((it) => ({
              code: it.code,
              name: it.description,
              qty: it.qty,
              unit: it.unit,
              storeId: it.storeId,
            })),
          });

      toast.success(isEdit ? "Request updated successfully" : "Request created successfully");
      window.dispatchEvent(new CustomEvent(isEdit ? "ncs:requests:updated" : "ncs:requests:created", { detail: result }));
      await onSubmit?.(payload, result, { mode: isEdit ? "edit" : "create" });
      setSaving(false);
      onClose();
    } catch (err: any) {
      setSaving(false);
      setErrors([err?.message || "Failed to save request."]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[min(980px,95vw)] max-h-[88vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-lg font-semibold">{isEdit ? "Edit Request" : "New Request"}</div>
            <div className="text-sm text-gray-500">{isEdit ? "Update request header and items" : "Create a new purchase request"}</div>
          </div>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            Close
          </button>
        </div>

        <div className="flex max-h-[calc(88vh-120px)] flex-col gap-4 overflow-auto px-5 py-4">
          {errors.length ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <ul className="list-disc space-y-1 pl-4">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Request No<span className="text-red-500">*</span></span>
              <input
                value={requestNo}
                onChange={(event) => setRequestNo(event.target.value)}
                placeholder="e.g. REQ-2025-0001"
                className="h-10 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-1">
              <span className="font-medium text-gray-700">Department</span>
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="h-10 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-1">
              <span className="font-medium text-gray-700">Store<span className="text-red-500">*</span></span>
              <select
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                className="h-10 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            <label className="flex flex-col gap-1 text-sm md:col-span-1">
              <span className="font-medium text-gray-700">Warehouse</span>
              <input
                value={warehouse}
                onChange={(event) => setWarehouse(event.target.value)}
                placeholder="Warehouse"
                className="h-10 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-1">
              <span className="font-medium text-gray-700">Machine</span>
              <input
                value={machine}
                onChange={(event) => setMachine(event.target.value)}
                placeholder="Machine"
                className="h-10 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-1">
              <span className="font-medium text-gray-700">Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as RequestPriority)}
                className="h-10 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-1">
              <span className="font-medium text-gray-700">Required Date</span>
              <input
                type="date"
                value={requiredDate}
                onChange={(event) => setRequiredDate(event.target.value)}
                className="h-10 rounded-lg border px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="font-medium text-gray-700">Request Description<span className="text-red-500">*</span></span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the request"
                rows={3}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </section>

          <section>
            <div className="flex items-center justify-between pb-2">
              <div className="text-sm font-semibold text-gray-700">Items</div>
              <button onClick={addItem} className="rounded-md border px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-50">
                Add Item
              </button>
            </div>
            <div className="overflow-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Material Code</th>
                    <th className="px-3 py-2 text-left">Material Description</th>
                    <th className="px-3 py-2 text-center">Quantity</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t text-sm">
                      <td className="px-3 py-2">
                        <input
                          value={item.code}
                          onChange={(event) => updateItem(item.id, { code: event.target.value })}
                          placeholder="Code"
                          className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={item.description}
                          onChange={(event) => updateItem(item.id, { description: event.target.value })}
                          placeholder="Description"
                          className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={item.qty}
                          onChange={(event) => updateItem(item.id, { qty: Math.max(0, toNumber(event.target.value, item.qty)) })}
                          className="w-20 rounded border px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={item.unit}
                          onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                          placeholder="Unit"
                          className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          disabled={items.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {isEdit ? "Save Changes" : "Create Request"}
          </button>
        </div>
      </div>

    </div>
  );
}
