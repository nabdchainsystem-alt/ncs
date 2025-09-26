import { type InventoryItemDTO, type InventoryWarehouse } from '../../../lib/api';

export const INVENTORY_ITEM_UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'bag', 'm', 'cm', 'mm'] as const;
export type InventoryItemUnit = (typeof INVENTORY_ITEM_UNITS)[number];
export type InventoryItemStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export type InventoryTableItem = {
  id: string;
  serverId: number | null;
  pictureUrl: string | null;
  category: string;
  categoryParent: string | null;
  code: string;
  name: string;
  qty: number;
  lowQty: number;
  unit: InventoryItemUnit;
  bigUnit: string | null;
  warehouse: string | null;
  storeId: number | null;
  store: string | null;
  storeCode: string | null;
  status: InventoryItemStatus;
  unitCost: number | null;
  lastMovementAt: string | null;
};

function ensureString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function ensureNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function pickPictureUrl(dto: InventoryItemDTO): string | null {
  const fromDto = (dto as unknown as { pictureUrl?: unknown; imageUrl?: unknown; thumbnail?: unknown });
  const candidates = [fromDto?.pictureUrl, fromDto?.imageUrl, fromDto?.thumbnail];
  for (const candidate of candidates) {
    const url = ensureString(candidate, '');
    if (url) return url;
  }
  return null;
}

const UNIT_LOOKUP = new Map<string, InventoryItemUnit>(
  INVENTORY_ITEM_UNITS.map((unit) => [unit.toLowerCase(), unit]),
);

function normalizeUnit(raw: unknown): InventoryItemUnit {
  const str = ensureString(raw, '').toLowerCase();
  if (!str) return 'pcs';
  if (UNIT_LOOKUP.has(str)) return UNIT_LOOKUP.get(str)!;
  // allow matching case-insensitively for mixed-case units like "mL"
  const exact = INVENTORY_ITEM_UNITS.find((unit) => unit.toLowerCase() === str);
  return exact ?? 'pcs';
}

function normalizeWarehouse(dto: InventoryItemDTO): string | null {
  const label = ensureString((dto as { warehouse?: unknown; warehouseLabel?: unknown }).warehouseLabel, '')
    || ensureString((dto as { warehouse?: unknown }).warehouse, '');
  if (label) return label;

  const raw = (dto as { warehouse?: InventoryWarehouse | null }).warehouse;
  if (!raw) return null;
  if (typeof raw === 'string') {
    const value = ensureString(raw);
    return value || null;
  }
  if (typeof raw === 'object') {
    const name = ensureString((raw as { name?: string })?.name, '');
    const code = ensureString((raw as { code?: string })?.code, '');
    return name || code || null;
  }
  return null;
}

function normalizeStatus(raw: unknown, qty: number, lowQty: number): InventoryItemStatus {
  if (typeof raw === 'string') {
    const value = raw.trim().toLowerCase();
    if (value.includes('out')) return 'out-of-stock';
    if (value.includes('low')) return 'low-stock';
    if (value.includes('in')) return 'in-stock';
  }
  if (qty <= 0) return 'out-of-stock';
  if (qty > 0 && qty <= lowQty) return 'low-stock';
  return 'in-stock';
}

function makeTempId(): string {
  try {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      if (typeof crypto.getRandomValues === 'function') {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        if (arr[0]) return `inventory-item-${arr[0].toString(16)}`;
      }
    }
  } catch {
    // ignore
  }
  return `inventory-item-${Math.random().toString(36).slice(2)}`;
}

function resolveId(dto: InventoryItemDTO): string {
  const direct = (dto as { id?: unknown }).id;
  const codeField = (dto as { itemCode?: unknown }).itemCode;
  const material = (dto as { materialNo?: unknown }).materialNo;
  const code = (dto as { code?: unknown }).code;
  const base = ensureString(direct ?? codeField ?? material ?? code, '');
  if (base) return base;
  return makeTempId();
}

function normalizeCategory(dto: InventoryItemDTO): string {
  const category = ensureString((dto as { category?: unknown }).category, '');
  if (category) return category;
  const fallback = ensureString((dto as any)?.group, '');
  return fallback || 'Uncategorized';
}

export function adaptInventoryItem(dto: InventoryItemDTO): InventoryTableItem {
  const directId = (dto as { id?: unknown }).id;
  const serverId = typeof directId === 'number' && Number.isFinite(directId) ? Math.trunc(directId) : null;
  const id = resolveId(dto);
  const code = ensureString((dto as { itemCode?: unknown; materialNo?: unknown; code?: unknown }).itemCode ?? (dto as { materialNo?: unknown }).materialNo ?? (dto as { code?: unknown }).code, 'N/A');
  const name = ensureString((dto as { itemDescription?: unknown; name?: unknown }).itemDescription ?? (dto as { name?: unknown }).name, 'Unnamed Item');
  const qty = Math.max(0, ensureNumber((dto as { qty?: unknown; qtyOnHand?: unknown; quantity?: unknown }).qty ?? (dto as { qtyOnHand?: unknown }).qtyOnHand ?? (dto as { quantity?: unknown }).quantity, 0));
  const lowQtyRaw = (dto as { reorder?: unknown; reorderPoint?: unknown; lowQty?: unknown; minLevel?: unknown }).reorder ?? (dto as { reorderPoint?: unknown }).reorderPoint ?? (dto as { lowQty?: unknown }).lowQty ?? (dto as { minLevel?: unknown }).minLevel;
  const lowQty = Math.max(0, ensureNumber(lowQtyRaw, 0));
  const unit = normalizeUnit((dto as { unit?: unknown }).unit);
  const status = normalizeStatus((dto as { status?: unknown }).status, qty, lowQty);
  const category = ensureString((dto as { category?: unknown }).category, normalizeCategory(dto));
  const explicitParent = ensureString((dto as { categoryParent?: unknown }).categoryParent, '');
  const categoryParent = explicitParent || (category.includes(' - ') ? category.split(' - ')[0]?.trim() || null : null);
  const normalizedCategory = category.trim().toLowerCase();
  let pictureUrl = pickPictureUrl(dto);
  const overrideImage = (() => {
    const mapping: Record<string, string> = {
      'raw material': '/Preform.png',
      'raw material - preform': '/Raw%20Material%20Preform.png',
      'raw materials - preform': '/Raw%20Material%20Preform.png',
      'raw material preform': '/Raw%20Material%20Preform.png',
      'raw material - cap': '/Raw%20Mateial%20Cap.png',
      'raw materials - cap': '/Raw%20Mateial%20Cap.png',
      'raw material cap': '/Raw%20Mateial%20Cap.png',
      minerals: '/Minerals.png',
      chemicals: '/Chemicals.png',
      spm: '/Sparepartsmachine.png',
    };
    return mapping[normalizedCategory] ?? null;
  })();
  if (overrideImage) {
    pictureUrl = overrideImage;
  }
  const rawLastMovement = (dto as { lastMovementAt?: unknown }).lastMovementAt;
  const lastMovementAt = (() => {
    if (!rawLastMovement) return null;
    if (rawLastMovement instanceof Date) return rawLastMovement.toISOString();
    const str = ensureString(rawLastMovement, '');
    if (!str) return null;
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  })();
  const warehouse = normalizeWarehouse(dto);
  const storeIdRaw = (dto as { storeId?: unknown }).storeId;
  const resolvedStoreId = Number.isFinite(Number(storeIdRaw)) ? Number(storeIdRaw) : null;
  const storeLabel = ensureString((dto as { store?: unknown }).store, '') || null;
  const storeCode = ensureString((dto as { storeCode?: unknown }).storeCode, '') || null;
  const bigUnit = ensureString((dto as { bigUnit?: unknown }).bigUnit, '') || null;
  const unitCostRaw = (dto as { unitCost?: unknown }).unitCost;
  const normalizedUnitCost = typeof unitCostRaw === 'number' && Number.isFinite(unitCostRaw)
    ? unitCostRaw
    : Number.isFinite(Number(unitCostRaw))
      ? Number(unitCostRaw)
      : null;

  return {
    id,
    serverId,
    pictureUrl,
    category,
    categoryParent: categoryParent || null,
    code,
    name,
    qty,
    lowQty,
    unit,
    bigUnit,
    warehouse,
    storeId: resolvedStoreId,
    store: storeLabel ?? (storeCode ? storeCode : null),
    storeCode,
    status,
    unitCost: normalizedUnitCost,
    lastMovementAt,
  };
}

export function adaptInventoryItems(items: InventoryItemDTO[] | null | undefined): InventoryTableItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(adaptInventoryItem);
}
