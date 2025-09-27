import { apiClient } from '../api';

export type CreateItemPayload = {
  materialName: string;
  materialId?: number;
  code?: string | null;
  storeId?: number | null;
  warehouseId?: number | null;
  unit?: string | null;
  bigUnit?: string | null;
  category?: string | null;
  categoryParent?: string | null;
  picture?: string | null;
  warehouseLabel?: string | null;
  unitCost?: number | null;
  reorderPoint?: number | null;
  qtyOnHand?: number | null;
};

export type InventoryStoreRef = {
  id: number;
  name: string | null;
  code: string | null;
  isActive?: boolean;
};

export type InventoryMaterialRef = {
  id: number;
  name: string;
  code: string | null;
};

export type CreatedInventoryItem = {
  id: number;
  materialNo: string;
  name: string;
  qtyOnHand: number;
  reorderPoint: number;
  unit: string | null;
  warehouseLabel: string | null;
  material: InventoryMaterialRef | null;
  store: InventoryStoreRef | null;
  warehouse?: { id: number; name: string | null; code: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function createInventoryItem(payload: CreateItemPayload): Promise<CreatedInventoryItem> {
  const sanitized: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    sanitized[key] = value;
  });

  const { data } = await apiClient.post<CreatedInventoryItem>('/api/items', sanitized);
  return data;
}
