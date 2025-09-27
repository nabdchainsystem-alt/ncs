import React from 'react';
import axios from 'axios';

import MaterialAutocomplete from '../../components/MaterialAutocomplete';
import type { MaterialSuggestion } from '../../lib/api/materials';
import StoreSelect from '../../components/StoreSelect';
import { ENFORCE_RM_PREFIX, RM_PREFIX_PATTERN } from '../../config/inventory';
import { createInventoryItem, type CreateItemPayload } from '../../lib/api/items';
import { Button } from '../../components/ui/Button';

export type AddItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryOptions: readonly string[];
  unitOptions: readonly string[];
  existingCodes: Set<string>;
};

type FormState = {
  materialName: string;
  materialId?: number;
  code: string;
  category: string;
  unit: string;
  storeId: number | null;
  reorderPoint: string;
  qtyOnHand: string;
};

const DEFAULT_FORM_STATE = (categoryOptions: readonly string[], unitOptions: readonly string[]): FormState => ({
  materialName: '',
  code: '',
  category: categoryOptions[0] ?? 'General',
  unit: unitOptions[0] ?? 'pcs',
  storeId: null,
  reorderPoint: '',
  qtyOnHand: '',
});

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function AddItemModal({
  open,
  onClose,
  onSuccess,
  categoryOptions,
  unitOptions,
  existingCodes,
}: AddItemModalProps) {
  const [form, setForm] = React.useState<FormState>(() => DEFAULT_FORM_STATE(categoryOptions, unitOptions));
  const [selectedMaterial, setSelectedMaterial] = React.useState<MaterialSuggestion | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [codeTouched, setCodeTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm(DEFAULT_FORM_STATE(categoryOptions, unitOptions));
    setSelectedMaterial(null);
    setError(null);
    setCodeTouched(false);
  }, [open, categoryOptions, unitOptions]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMaterialChange = (next: string) => {
    const trimmed = next;
    updateForm('materialName', trimmed);
    if (!selectedMaterial || selectedMaterial.name !== trimmed) {
      setSelectedMaterial(null);
      updateForm('materialId', undefined);
    }
  };

  const handleMaterialSelect = (hit?: MaterialSuggestion) => {
    if (!hit) {
      setSelectedMaterial(null);
      updateForm('materialId', undefined);
      return;
    }
    setSelectedMaterial(hit);
    updateForm('materialName', hit.name);
    updateForm('materialId', hit.id);
  };

  const codeValue = form.code.trim();
  const duplicateCode = codeTouched && !!codeValue && existingCodes.has(codeValue.toLowerCase());
  const showPrefixError = Boolean(form.materialName) && ENFORCE_RM_PREFIX && !RM_PREFIX_PATTERN.test(form.materialName);

  const disableSubmit =
    submitting
    || !form.materialName.trim()
    || showPrefixError
    || duplicateCode;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disableSubmit) return;

    const normalizedName = normalizeWhitespace(form.materialName);
    if (!normalizedName) {
      setError('Material Name is required.');
      return;
    }

    if (ENFORCE_RM_PREFIX && !RM_PREFIX_PATTERN.test(normalizedName)) {
      setError('Material names must start with “RM”.');
      return;
    }

    const payload: CreateItemPayload = {
      materialName: normalizedName,
      materialId: form.materialId,
      code: codeValue ? codeValue : undefined,
      category: form.category || null,
      unit: form.unit || null,
      storeId: form.storeId ?? undefined,
      reorderPoint: form.reorderPoint ? Number(form.reorderPoint) : undefined,
      qtyOnHand: form.qtyOnHand ? Number(form.qtyOnHand) : undefined,
    };

    setSubmitting(true);
    setError(null);
    try {
      await createInventoryItem(payload);
      onSuccess();
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 0;
        const apiError = (err.response?.data as any)?.error;
        if (status === 409) {
          if (apiError === 'inventory_item_duplicate' || apiError === 'material_code_duplicate' || apiError === 'material_duplicate') {
            setError('Material already exists. Try another code or name.');
          } else if (apiError === 'material_name_duplicate') {
            setError('Material name already exists.');
          } else if (apiError === 'store_code_duplicate') {
            setError('Duplicate store code.');
          } else {
            setError('Duplicate detected. Please adjust your inputs.');
          }
        } else if (status === 422 || apiError === 'material_prefix_required') {
          setError('Material names must start with “RM”.');
        } else if (status === 400 && apiError === 'store_not_found') {
          setError('Selected store is no longer available.');
        } else if (typeof err.response?.data?.error === 'string') {
          setError(err.response.data.error);
        } else if (typeof err.message === 'string' && err.message) {
          setError(err.message);
        } else {
          setError('Failed to add item');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to add item');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return open ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Item</h2>
            <p className="mt-1 text-sm text-gray-500">Link or create a raw material and make it available in inventory.</p>
          </div>
          <button
            type="button"
            className="text-gray-500 transition hover:text-gray-700"
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Material Name</label>
            <MaterialAutocomplete
              value={form.materialName}
              onChange={handleMaterialChange}
              onSelect={handleMaterialSelect}
              enforceRMPrefix={ENFORCE_RM_PREFIX}
              disabled={submitting}
              className="mt-2"
              placeholder="e.g. RM-00123 Copper Cable"
            />
            <p className="mt-1 text-xs text-gray-400">Type “RM” to see existing materials.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Material Code <span className="text-gray-400">(optional)</span></label>
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.code}
              onChange={(event) => updateForm('code', event.currentTarget.value)}
              onBlur={() => setCodeTouched(true)}
              placeholder="Autogenerated if left blank"
              disabled={submitting}
            />
            {duplicateCode ? (
              <span className="mt-1 block text-xs text-red-600">This code already exists.</span>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.category}
                onChange={(event) => updateForm('category', event.currentTarget.value)}
                disabled={submitting}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.unit}
                onChange={(event) => updateForm('unit', event.currentTarget.value)}
                disabled={submitting}
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Initial Quantity <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                min={0}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.qtyOnHand}
                onChange={(event) => updateForm('qtyOnHand', event.currentTarget.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reorder Point <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                min={0}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.reorderPoint}
                onChange={(event) => updateForm('reorderPoint', event.currentTarget.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Store <span className="text-gray-400">(optional)</span></label>
            <StoreSelect
              value={form.storeId}
              onChange={(next) => updateForm('storeId', next)}
              disabled={submitting}
              placeholder="Select destination store"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {submitting ? 'Saving…' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
}

export default AddItemModal;
