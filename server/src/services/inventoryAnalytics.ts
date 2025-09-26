import { Prisma } from '@prisma/client';
import { differenceInCalendarDays, eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';

import { prisma } from '../prisma';

type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

type InventoryItemMetrics = {
  id: number;
  materialNo: string;
  name: string;
  category: string;
  warehouseName: string;
  warehouseId: number | null;
  storeName: string;
  storeId: number | null;
  qtyOnHand: number;
  reorderPoint: number;
  avgCost: number;
  value: number;
  status: InventoryStatus;
  lastMovementAt: Date | null;
  ageDays: number | null;
};

type InventoryContext = {
  items: InventoryItemMetrics[];
  avgCostByItemId: Map<number, number>;
  avgCostByMaterial: Map<string, number>;
};

type RecentMovementParams = {
  page: number;
  pageSize: number;
  type?: string;
  warehouse?: string;
  store?: string;
  sortBy?: 'date' | 'qty' | 'value';
  sortDir?: 'asc' | 'desc';
};

type ItemsFromOrdersParams = {
  page: number;
  pageSize: number;
  status?: string;
  warehouse?: string;
  category?: string;
  q?: string;
};

type InventoryItemsFromOrdersRow = {
  code: string;
  name: string;
  category: string;
  warehouse: string;
  qty: number;
  reorder: number;
  value: number;
  status: InventoryStatus;
  ageDays: number | null;
};

const DEFAULT_WAREHOUSE_CAPACITY: Record<string, number> = {
  Riyadh: 1600,
  Jeddah: 1600,
  Dammam: 1600,
};

const DEFAULT_CAPACITY_FALLBACK = 1200;
const DEFAULT_WAREHOUSE_ORDER = ['Riyadh', 'Jeddah', 'Dammam'];
const SLOW_MOVEMENT_THRESHOLD_DAYS = 60;
const EXCESS_STOCK_MULTIPLIER = 1.5;
const EXCESS_ABSOLUTE_THRESHOLD = 100;
const DAILY_MOVEMENT_WINDOW_DAYS = 6; // inclusive with today => 7 days total
const ACTIVITY_BY_TYPE_WINDOW_DAYS = 29; // inclusive with today => 30 days total

function normalizeString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeCode(value?: string | null): string | undefined {
  const trimmed = normalizeString(value);
  return trimmed ? trimmed.toUpperCase() : undefined;
}

function safeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeStatus(qty: number, reorder: number): InventoryStatus {
  if (qty <= 0) return 'Out of Stock';
  if (reorder > 0 && qty <= reorder) return 'Low Stock';
  return 'In Stock';
}

function preferredWarehouseSortKey(name: string): string {
  const index = DEFAULT_WAREHOUSE_ORDER.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return index === -1 ? `~${name.toLowerCase()}` : `0${index}`;
}

function sortWarehouseEntries(entries: Array<[string, number]>): Array<[string, number]> {
  return entries.sort((a, b) => {
    const aKey = preferredWarehouseSortKey(a[0]);
    const bKey = preferredWarehouseSortKey(b[0]);
    if (aKey === bKey) return a[0].localeCompare(b[0]);
    return aKey.localeCompare(bKey);
  });
}

function computeAveragePriceMap(products: Array<{ itemCode: string | null; price: number | null }>): Map<string, number> {
  const totals = new Map<string, { sum: number; count: number }>();

  products.forEach((product) => {
    const code = normalizeCode(product.itemCode);
    const price = safeNumber(product.price);
    if (!code || price <= 0) return;

    const current = totals.get(code) ?? { sum: 0, count: 0 };
    current.sum += price;
    current.count += 1;
    totals.set(code, current);
  });

  const averages = new Map<string, number>();
  totals.forEach((value, key) => {
    const average = value.count > 0 ? value.sum / value.count : 0;
    averages.set(key, roundCurrency(average));
  });

  return averages;
}

async function loadInventoryContext(): Promise<InventoryContext> {
  const [itemsRaw, vendorProducts] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { isDeleted: false },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        store: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.vendorProduct.findMany({
      select: { itemCode: true, price: true },
    }),
  ]);

  const avgCostByMaterial = computeAveragePriceMap(vendorProducts);
  const avgCostByItemId = new Map<number, number>();
  const now = new Date();

  const items = itemsRaw.map<InventoryItemMetrics>((item) => {
    const qtyRaw = safeNumber(item.qtyOnHand);
    const qtyOnHand = qtyRaw > 0 ? qtyRaw : 0;
    const reorderPoint = safeNumber(item.reorderPoint);
    const materialCode = normalizeCode(item.materialNo) ?? item.materialNo;
    const explicitUnitCost = Number.isFinite(item.unitCost) ? Number(item.unitCost) : null;
    const avgCost = explicitUnitCost ?? (materialCode ? avgCostByMaterial.get(materialCode) ?? 0 : 0);
    const value = roundCurrency(qtyOnHand * avgCost);
    const status = computeStatus(qtyOnHand, reorderPoint);
    const category = normalizeString(item.category) ?? 'Uncategorized';
    const warehouseName = normalizeString(item.warehouse?.name) ?? 'Unassigned';
    const storeName = normalizeString(item.store?.name) ?? normalizeString(item.store?.code) ?? 'Unassigned';
    const lastMovementAt = item.lastMovementAt ?? null;
    const ageDays = lastMovementAt ? differenceInCalendarDays(now, lastMovementAt) : null;

    const metrics: InventoryItemMetrics = {
      id: item.id,
      materialNo: normalizeString(item.materialNo) ?? `ITEM-${item.id}`,
      name: normalizeString(item.name) ?? `Item ${item.id}`,
      category,
      warehouseName,
      warehouseId: item.warehouseId ?? null,
      storeName,
      storeId: item.storeId ?? null,
      qtyOnHand,
      reorderPoint: reorderPoint > 0 ? reorderPoint : 0,
      avgCost,
      value,
      status,
      lastMovementAt,
      ageDays,
    };

    avgCostByItemId.set(item.id, avgCost);
    if (materialCode && !avgCostByMaterial.has(materialCode)) {
      avgCostByMaterial.set(materialCode, avgCost);
    }

    return metrics;
  });

  return { items, avgCostByItemId, avgCostByMaterial };
}

function normalizeMoveType(value?: string | null): 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUST' | 'OTHER' {
  const normalized = normalizeString(value)?.toUpperCase();
  if (!normalized) return 'OTHER';
  if (normalized === 'IN' || normalized === 'INBOUND' || normalized === 'RECEIPT') return 'INBOUND';
  if (normalized === 'OUT' || normalized === 'OUTBOUND' || normalized === 'ISSUE') return 'OUTBOUND';
  if (normalized === 'TRANSFER' || normalized === 'MOVE' || normalized === 'XFER') return 'TRANSFER';
  if (normalized === 'ADJUST' || normalized === 'ADJUSTMENT') return 'ADJUST';
  return 'OTHER';
}

function toDisplayMoveType(value?: string | null): string {
  switch (normalizeMoveType(value)) {
    case 'INBOUND':
      return 'Inbound';
    case 'OUTBOUND':
      return 'Outbound';
    case 'TRANSFER':
      return 'Transfer';
    case 'ADJUST':
      return 'Adjust';
    default:
      return 'Other';
  }
}

export async function getInventoryKpis() {
  const { items } = await loadInventoryContext();

  const totalItems = items.length;
  let lowStock = 0;
  let outOfStock = 0;
  let inventoryValue = 0;

  const stores = new Map<string, {
    storeId: number | null;
    store: string;
    qty: number;
    value: number;
    items: number;
    lowStock: number;
    outOfStock: number;
  }>();

  items.forEach((item) => {
    const status = item.status;
    if (status === 'Low Stock') lowStock += 1;
    if (status === 'Out of Stock') outOfStock += 1;

    inventoryValue += item.value;

    const storeId = item.storeId ?? null;
    const storeLabel = normalizeString(item.storeName) ?? 'Unassigned';
    const key = `${storeId ?? 'null'}::${storeLabel.toLowerCase()}`;
    const summary = stores.get(key) ?? {
      storeId,
      store: storeLabel,
      qty: 0,
      value: 0,
      items: 0,
      lowStock: 0,
      outOfStock: 0,
    };

    summary.qty += item.qtyOnHand;
    summary.value += item.value;
    summary.items += 1;
    if (status === 'Low Stock') summary.lowStock += 1;
    if (status === 'Out of Stock') summary.outOfStock += 1;

    stores.set(key, summary);
  });

  const storeSnapshots = Array.from(stores.values())
    .sort((a, b) => b.value - a.value)
    .map((snapshot) => ({
      storeId: snapshot.storeId,
      store: snapshot.store,
      qty: snapshot.qty,
      value: roundCurrency(snapshot.value),
      items: snapshot.items,
      lowStock: snapshot.lowStock,
      outOfStock: snapshot.outOfStock,
    }));

  return {
    lowStock,
    outOfStock,
    inventoryValue: roundCurrency(inventoryValue),
    totalItems,
    stores: storeSnapshots,
  };
}

export async function getStockHealthBreakdown() {
  const { items } = await loadInventoryContext();

  const lowStock = items.filter((item) => item.status === 'Low Stock').length;
  const outOfStock = items.filter((item) => item.status === 'Out of Stock').length;

  return [
    { name: 'Low Stock', value: lowStock },
    { name: 'Out of Stock', value: outOfStock },
  ];
}

export async function getItemsByWarehouseBar() {
  const { items } = await loadInventoryContext();

  const totals = new Map<string, number>();
  items.forEach((item) => {
    totals.set(item.warehouseName, (totals.get(item.warehouseName) ?? 0) + 1);
  });

  const entries = sortWarehouseEntries(Array.from(totals.entries()));
  const categories = entries.map(([name]) => name);
  const data = entries.map(([, count]) => count);

  return {
    categories,
    series: [
      {
        name: 'Items',
        data,
      },
    ],
  };
}

export async function getValueByCategoryBar() {
  const { items } = await loadInventoryContext();

  const totals = new Map<string, number>();
  items.forEach((item) => {
    totals.set(item.category, roundCurrency((totals.get(item.category) ?? 0) + item.value));
  });

  const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const categories = entries.map(([category]) => category);
  const data = entries.map(([, value]) => value);

  return {
    categories,
    series: [
      {
        name: 'Value (SAR)',
        data,
      },
    ],
  };
}

export async function getCriticalKpis() {
  const { items } = await loadInventoryContext();

  const criticalItemsList = items.filter((item) => item.reorderPoint > 0 && (item.status === 'Low Stock' || item.status === 'Out of Stock'));
  const criticalItems = criticalItemsList.length;
  const criticalOOS = criticalItemsList.filter((item) => item.status === 'Out of Stock').length;
  const criticalLow = criticalItemsList.filter((item) => item.status === 'Low Stock').length;

  let linkedRequests = 0;
  const materialCodes = criticalItemsList
    .map((item) => normalizeCode(item.materialNo))
    .filter((code): code is string => Boolean(code));

  if (materialCodes.length) {
    const requestItems = await prisma.requestItem.findMany({
      where: { code: { in: materialCodes } },
      select: { requestId: true },
    });
    const uniqueRequests = new Set(requestItems.map((requestItem) => requestItem.requestId));
    linkedRequests = uniqueRequests.size;
  }

  return { criticalItems, criticalOOS, criticalLow, linkedRequests };
}

export async function getCriticalByCategoryPie() {
  const { items } = await loadInventoryContext();
  const totals = new Map<string, number>();

  items
    .filter((item) => item.reorderPoint > 0 && (item.status === 'Low Stock' || item.status === 'Out of Stock'))
    .forEach((item) => {
      totals.set(item.category, (totals.get(item.category) ?? 0) + 1);
    });

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export async function getCriticalByWarehouseBar() {
  const { items } = await loadInventoryContext();
  const totals = new Map<string, number>();

  items
    .filter((item) => item.reorderPoint > 0 && (item.status === 'Low Stock' || item.status === 'Out of Stock'))
    .forEach((item) => {
      totals.set(item.warehouseName, (totals.get(item.warehouseName) ?? 0) + 1);
    });

  const entries = sortWarehouseEntries(Array.from(totals.entries()));
  const categories = entries.map(([warehouse]) => warehouse);
  const data = entries.map(([, count]) => count);

  return {
    categories,
    series: [
      {
        name: 'Critical SKUs',
        data,
      },
    ],
  };
}

function isSlowMoving(item: InventoryItemMetrics): boolean {
  if (item.qtyOnHand <= 0) return false;
  if (item.ageDays == null) return true;
  return item.ageDays >= SLOW_MOVEMENT_THRESHOLD_DAYS;
}

function isExcessStock(item: InventoryItemMetrics): boolean {
  if (item.qtyOnHand <= 0) return false;
  if (item.reorderPoint > 0) {
    return item.qtyOnHand > item.reorderPoint * EXCESS_STOCK_MULTIPLIER;
  }
  return item.qtyOnHand >= EXCESS_ABSOLUTE_THRESHOLD;
}

export async function getSlowExcessKpis() {
  const { items } = await loadInventoryContext();

  const slowItems = items.filter(isSlowMoving);
  const excessItems = items.filter(isExcessStock);

  const slowCount = slowItems.length;
  const slowValue = roundCurrency(slowItems.reduce((sum, item) => sum + item.value, 0));
  const excessCount = excessItems.length;
  const excessValue = roundCurrency(excessItems.reduce((sum, item) => sum + item.value, 0));

  return { slowCount, slowValue, excessCount, excessValue };
}

export async function getExcessByCategoryPie() {
  const { items } = await loadInventoryContext();
  const totals = new Map<string, number>();

  items
    .filter(isExcessStock)
    .forEach((item) => {
      totals.set(item.category, roundCurrency((totals.get(item.category) ?? 0) + item.value));
    });

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export async function getTopSlowMovingBar(limit = 5) {
  const { items } = await loadInventoryContext();

  const entries = items
    .filter(isSlowMoving)
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const categories = entries.map((item) => item.name);
  const data = entries.map((item) => roundCurrency(item.value));

  return {
    categories,
    series: [
      {
        name: 'Value at risk (SAR)',
        data,
      },
    ],
  };
}

export async function getActivityKpis() {
  const todayStart = startOfDay(new Date());
  const [{ avgCostByItemId }, movements] = await Promise.all([
    loadInventoryContext(),
    prisma.stockMovement.findMany({
      where: { createdAt: { gte: todayStart } },
      select: {
        id: true,
        itemId: true,
        moveType: true,
        qty: true,
        valueSar: true,
        storeId: true,
        store: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  let inboundToday = 0;
  let outboundToday = 0;
  let transfersToday = 0;
  let movementValue = 0;
  let inboundValue = 0;
  let outboundValue = 0;

  const stores = new Map<string, {
    storeId: number | null;
    store: string;
    inboundQty: number;
    outboundQty: number;
    inboundValue: number;
    outboundValue: number;
  }>();

  movements.forEach((movement) => {
    const qty = Math.abs(safeNumber(movement.qty));
    if (qty <= 0) return;

    const normalizedType = normalizeMoveType(movement.moveType);
    const avgCost = movement.itemId ? avgCostByItemId.get(movement.itemId) ?? 0 : 0;
    const fallbackValue = roundCurrency(qty * avgCost);
    const rawValue = Number.isFinite(movement.valueSar)
      ? Number(movement.valueSar)
      : (() => {
          switch (normalizedType) {
            case 'OUTBOUND':
              return -fallbackValue;
            case 'INBOUND':
              return fallbackValue;
            default:
              return fallbackValue;
          }
        })();

    const absValue = Math.abs(rawValue || 0);

    const storeId = movement.store?.id ?? movement.storeId ?? null;
    const storeLabel = normalizeString(movement.store?.name)
      ?? normalizeString(movement.store?.code)
      ?? 'Unassigned';
    const storeKey = `${storeId ?? 'null'}::${storeLabel.toLowerCase()}`;
    const storeSnapshot = stores.get(storeKey) ?? {
      storeId,
      store: storeLabel,
      inboundQty: 0,
      outboundQty: 0,
      inboundValue: 0,
      outboundValue: 0,
    };

    switch (normalizedType) {
      case 'INBOUND':
        inboundToday += qty;
        inboundValue += absValue;
        storeSnapshot.inboundQty += qty;
        storeSnapshot.inboundValue += absValue;
        movementValue += rawValue;
        break;
      case 'OUTBOUND':
        outboundToday += qty;
        outboundValue += absValue;
        storeSnapshot.outboundQty += qty;
        storeSnapshot.outboundValue += absValue;
        movementValue += rawValue;
        break;
      case 'TRANSFER':
        transfersToday += qty;
        break;
      default:
        movementValue += rawValue;
        break;
    }

    stores.set(storeKey, storeSnapshot);
  });

  const storeSummaries = Array.from(stores.values())
    .map((snapshot) => ({
      storeId: snapshot.storeId,
      store: snapshot.store,
      inboundQty: snapshot.inboundQty,
      outboundQty: snapshot.outboundQty,
      inboundValue: roundCurrency(snapshot.inboundValue),
      outboundValue: roundCurrency(snapshot.outboundValue),
      netValue: roundCurrency(snapshot.inboundValue - snapshot.outboundValue),
    }))
    .sort((a, b) => b.netValue - a.netValue);

  return {
    inboundToday,
    outboundToday,
    transfersToday,
    movementValue: roundCurrency(movementValue),
    inboundValue: roundCurrency(inboundValue),
    outboundValue: roundCurrency(outboundValue),
    stores: storeSummaries,
  };
}

export async function getActivityByTypePie() {
  const windowStart = startOfDay(subDays(new Date(), ACTIVITY_BY_TYPE_WINDOW_DAYS));
  const movements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: windowStart } },
    select: { moveType: true, qty: true },
  });

  let inbound = 0;
  let outbound = 0;
  let transfer = 0;

  movements.forEach((movement) => {
    const qty = Math.abs(safeNumber(movement.qty));
    switch (normalizeMoveType(movement.moveType)) {
      case 'INBOUND':
        inbound += qty;
        break;
      case 'OUTBOUND':
        outbound += qty;
        break;
      case 'TRANSFER':
        transfer += qty;
        break;
      default:
        break;
    }
  });

  return [
    { name: 'Inbound', value: inbound },
    { name: 'Outbound', value: outbound },
    { name: 'Transfer', value: transfer },
  ];
}

export async function getDailyMovementsBar() {
  const today = new Date();
  const start = startOfDay(subDays(today, DAILY_MOVEMENT_WINDOW_DAYS));
  const end = startOfDay(today);
  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: new Date(end.getTime() + (24 * 60 * 60 * 1000) - 1),
      },
    },
    select: { createdAt: true, qty: true },
  });

  const days = eachDayOfInterval({ start, end: today });
  const totals = new Map<string, number>();
  days.forEach((day) => {
    totals.set(format(day, 'MMM d'), 0);
  });

  movements.forEach((movement) => {
    if (!movement.createdAt) return;
    const label = format(movement.createdAt, 'MMM d');
    if (!totals.has(label)) return;
    const qty = Math.abs(safeNumber(movement.qty));
    totals.set(label, (totals.get(label) ?? 0) + qty);
  });

  const categories = days.map((day) => format(day, 'MMM d'));
  const data = categories.map((category) => totals.get(category) ?? 0);

  return {
    categories,
    series: [
      {
        name: 'Movements',
        data,
      },
    ],
  };
}

function normalizeStatusFilter(value?: string | null): InventoryStatus | undefined {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes('out')) return 'Out of Stock';
  if (normalized.includes('low')) return 'Low Stock';
  if (normalized.includes('in')) return 'In Stock';
  return undefined;
}

export async function getInventoryItemsFromOrders(params: ItemsFromOrdersParams) {
  const context = await loadInventoryContext();
  const itemsByMaterial = new Map<string, InventoryItemMetrics>();
  context.items.forEach((item) => {
    const code = normalizeCode(item.materialNo);
    if (code) itemsByMaterial.set(code, item);
  });

  const orders = await prisma.order.findMany({
    include: {
      request: {
        select: {
          warehouse: true,
          department: true,
          items: {
            select: {
              code: true,
              name: true,
              qty: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  const statusFilter = normalizeStatusFilter(params.status);
  const warehouseFilter = normalizeString(params.warehouse)?.toLowerCase();
  const categoryFilter = normalizeString(params.category)?.toLowerCase();
  const searchTerm = normalizeString(params.q)?.toLowerCase();

  const aggregated: InventoryItemsFromOrdersRow[] = [];
  const seen = new Map<string, InventoryItemsFromOrdersRow>();

  orders.forEach((order) => {
    const requestItems = order.request?.items ?? [];
    if (!requestItems.length) return;

    const totalOrderQty = requestItems.reduce((sum, item) => sum + safeNumber(item.qty), 0) || 1;
    const unitValue = safeNumber(order.totalValue) > 0
      ? roundCurrency(safeNumber(order.totalValue) / totalOrderQty)
      : 0;

    requestItems.forEach((requestItem) => {
      const materialCode = normalizeCode(requestItem.code);
      const lookup = materialCode ? itemsByMaterial.get(materialCode) : undefined;

      const qty = safeNumber(requestItem.qty);
      const qtyOnHand = qty > 0 ? qty : 0;
      const reorderPoint = lookup?.reorderPoint ?? 0;
      const status = lookup?.status ?? computeStatus(qtyOnHand, reorderPoint);
      const warehouseName = lookup?.warehouseName
        ?? normalizeString(order.request?.warehouse)
        ?? 'Unassigned';
      const category = lookup?.category
        ?? normalizeString(order.request?.department)
        ?? 'Uncategorized';
      const avgCost = lookup?.avgCost ?? unitValue;
      const value = roundCurrency(qtyOnHand * avgCost);
      const ageDays = lookup?.ageDays ?? null;
      const key = materialCode ?? normalizeString(requestItem.code) ?? `${order.id}-${requestItem.name ?? 'item'}`;

      const record: InventoryItemsFromOrdersRow = {
        code: materialCode ?? normalizeString(requestItem.code) ?? 'N/A',
        name: normalizeString(requestItem.name) ?? 'Unnamed Item',
        category,
        warehouse: warehouseName,
        qty: qtyOnHand,
        reorder: reorderPoint,
        value,
        status,
        ageDays,
      };

      // merge duplicates by keeping highest qty/value from latest appearance
      const existing = seen.get(key);
      if (existing) {
        existing.qty += record.qty;
        existing.value = roundCurrency(existing.value + record.value);
        existing.status = record.status;
        seen.set(key, existing);
      } else {
        seen.set(key, record);
        aggregated.push(record);
      }
    });
  });

  // ensure every inventory item appears even if no order references it yet
  context.items.forEach((item) => {
    const key = normalizeCode(item.materialNo) ?? normalizeString(item.materialNo) ?? `item-${item.id}`;
    if (!key) return;
    if (seen.has(key)) return;
    const record: InventoryItemsFromOrdersRow = {
      code: normalizeString(item.materialNo) ?? key,
      name: item.name,
      category: item.category,
      warehouse: item.warehouseName,
      qty: item.qtyOnHand,
      reorder: item.reorderPoint,
      value: item.value,
      status: item.status,
      ageDays: item.ageDays,
    };
    seen.set(key, record);
    aggregated.push(record);
  });

  if (!aggregated.length && itemsByMaterial.size) {
    // fallback to raw inventory items if no orders matched
    itemsByMaterial.forEach((item, code) => {
      aggregated.push({
        code,
        name: item.name,
        category: item.category,
        warehouse: item.warehouseName,
        qty: item.qtyOnHand,
        reorder: item.reorderPoint,
        value: item.value,
        status: item.status,
        ageDays: item.ageDays,
      });
    });
  }

  const filtered = aggregated.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false;
    if (warehouseFilter && row.warehouse.toLowerCase() !== warehouseFilter) return false;
    if (categoryFilter && row.category.toLowerCase() !== categoryFilter) return false;
    if (searchTerm) {
      const haystacks = [row.code, row.name, row.category, row.warehouse]
        .map((value) => String(value ?? '').toLowerCase());
      if (!haystacks.some((value) => value.includes(searchTerm))) return false;
    }
    return true;
  });

  const total = filtered.length;
  const startIndex = (params.page - 1) * params.pageSize;
  const endIndex = startIndex + params.pageSize;
  const itemsPage = filtered.slice(startIndex, endIndex);

  return { items: itemsPage, total };
}

export async function getRecentMovements(params: RecentMovementParams) {
  const { avgCostByItemId } = await loadInventoryContext();

  const typeFilter = normalizeMoveType(params.type);
  const warehouseFilter = normalizeString(params.warehouse);
  const storeFilter = normalizeString(params.store);
  const sortBy = params.sortBy ?? 'date';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';

  const where: Prisma.StockMovementWhereInput = {};
  const andConditions: Prisma.StockMovementWhereInput[] = [];

  if (params.type && typeFilter !== 'OTHER') {
    where.moveType = {
      equals:
        typeFilter === 'INBOUND'
          ? 'IN'
          : typeFilter === 'OUTBOUND'
            ? 'OUT'
            : typeFilter === 'TRANSFER'
              ? 'TRANSFER'
              : typeFilter === 'ADJUST'
                ? 'ADJUST'
                : params.type,
    };
  }

  if (warehouseFilter) {
    where.item = {
      warehouse: {
        name: warehouseFilter,
      },
    };
  }

  if (storeFilter) {
    andConditions.push({
      OR: [
        { store: { name: { equals: storeFilter } } },
        { store: { code: { equals: storeFilter } } },
        { destinationStore: { name: { equals: storeFilter } } },
        { destinationStore: { code: { equals: storeFilter } } },
        { sourceStore: { name: { equals: storeFilter } } },
        { sourceStore: { code: { equals: storeFilter } } },
        { item: { store: { name: { equals: storeFilter } } } },
        { item: { store: { code: { equals: storeFilter } } } },
      ],
    });
  }

  if (andConditions.length) {
    where.AND = andConditions;
  }

  const skip = (params.page - 1) * params.pageSize;
  const take = params.pageSize;

  const orderBy: Prisma.StockMovementOrderByWithRelationInput = (() => {
    switch (sortBy) {
      case 'qty':
        return { qty: sortDir };
      case 'value':
        return { valueSar: sortDir };
      default:
        return { createdAt: sortDir };
    }
  })();

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            materialNo: true,
            category: true,
            warehouse: { select: { name: true } },
            store: { select: { name: true, code: true } },
          },
        },
        order: { select: { id: true, orderNo: true } },
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        sourceStore: { select: { id: true, name: true, code: true } },
        destinationStore: { select: { id: true, name: true, code: true } },
        store: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  const items = movements.map((movement) => {
    const qty = Math.abs(safeNumber(movement.qty));
    const avgCost = movement.item?.id ? avgCostByItemId.get(movement.item.id) ?? 0 : 0;
    const fallbackValue = roundCurrency(qty * avgCost);
    const type = normalizeMoveType(movement.moveType);
    const rawValue = Number.isFinite(movement.valueSar)
      ? Number(movement.valueSar)
      : (() => {
          switch (type) {
            case 'OUTBOUND':
              return -fallbackValue;
            case 'INBOUND':
              return fallbackValue;
            default:
              return fallbackValue;
          }
        })();
    const value = Math.abs(rawValue || 0);

    const sourceWarehouseName = normalizeString(movement.sourceWarehouse?.name)
      ?? movement.sourceWarehouseLabel
      ?? (movement.moveType === 'OUT' ? normalizeString(movement.item?.warehouse?.name) : null);
    const destinationWarehouseName = normalizeString(movement.destinationWarehouse?.name)
      ?? movement.destinationWarehouseLabel
      ?? (movement.moveType === 'IN' ? normalizeString(movement.item?.warehouse?.name) : null);

    const storeLabel = normalizeString(movement.store?.name)
      ?? normalizeString(movement.store?.code)
      ?? normalizeString(movement.destinationStore?.name)
      ?? normalizeString(movement.destinationStore?.code)
      ?? normalizeString(movement.item?.store?.name)
      ?? normalizeString(movement.item?.store?.code)
      ?? null;

    const category = normalizeString(movement.item?.category) ?? 'Uncategorized';
    const itemCode = normalizeString(movement.item?.materialNo) ?? null;

    return {
      date: movement.createdAt?.toISOString() ?? new Date().toISOString(),
      item: movement.item?.name ?? 'Unknown Item',
      warehouse: destinationWarehouseName ?? 'Unassigned',
      type: toDisplayMoveType(movement.moveType),
      qty,
      value,
      source: sourceWarehouseName ?? 'External',
      destination: destinationWarehouseName ?? 'External',
      orderNo: movement.order?.orderNo ?? null,
      store: storeLabel,
      category,
      itemCode,
    };
  });

  return { items, total };
}

function buildWarehouseCapacityMap(names: string[]): Map<string, number> {
  const map = new Map<string, number>();
  names.forEach((name) => {
    const capacity = DEFAULT_WAREHOUSE_CAPACITY[name] ?? DEFAULT_CAPACITY_FALLBACK;
    map.set(name, capacity);
  });
  return map;
}

export async function getUtilizationKpis() {
  const { items } = await loadInventoryContext();
  const warehouses = await prisma.warehouse.findMany({ select: { name: true } });

  const warehouseNames = warehouses.length
    ? warehouses.map((warehouse) => normalizeString(warehouse.name) ?? 'Unassigned')
    : Object.keys(DEFAULT_WAREHOUSE_CAPACITY);

  const capacityMap = buildWarehouseCapacityMap(warehouseNames);
  const usageMap = new Map<string, number>();

  items.forEach((item) => {
    const name = item.warehouseName;
    usageMap.set(name, (usageMap.get(name) ?? 0) + item.qtyOnHand);
    if (!capacityMap.has(name)) {
      capacityMap.set(name, DEFAULT_CAPACITY_FALLBACK);
    }
  });

  const totalCapacity = Array.from(capacityMap.values()).reduce((sum, value) => sum + value, 0);
  const usedCapacity = Array.from(usageMap.entries()).reduce((sum, [name, value]) => {
    const capacity = capacityMap.get(name) ?? DEFAULT_CAPACITY_FALLBACK;
    return sum + Math.min(value, capacity);
  }, 0);
  const freeCapacity = Math.max(totalCapacity - usedCapacity, 0);
  const utilizationPct = totalCapacity > 0 ? roundCurrency((usedCapacity / totalCapacity) * 100) : 0;

  return { totalCapacity, usedCapacity, freeCapacity, utilizationPct };
}

export async function getUtilizationSharePie() {
  const { items } = await loadInventoryContext();
  const usageMap = new Map<string, number>();

  items.forEach((item) => {
    usageMap.set(item.warehouseName, (usageMap.get(item.warehouseName) ?? 0) + item.qtyOnHand);
  });

  return sortWarehouseEntries(Array.from(usageMap.entries()))
    .map(([name, value]) => ({ name, value }));
}

export async function getCapacityVsUsedBar() {
  const { items } = await loadInventoryContext();
  const warehouses = await prisma.warehouse.findMany({ select: { name: true } });

  const warehouseNames = new Set<string>();
  warehouses.forEach((warehouse) => {
    const name = normalizeString(warehouse.name) ?? 'Unassigned';
    warehouseNames.add(name);
  });
  items.forEach((item) => warehouseNames.add(item.warehouseName));
  if (!warehouseNames.size) DEFAULT_WAREHOUSE_ORDER.forEach((name) => warehouseNames.add(name));

  const orderedWarehouses = sortWarehouseEntries(Array.from(warehouseNames).map((name) => [name, 0]))
    .map(([name]) => name);

  const capacityMap = buildWarehouseCapacityMap(orderedWarehouses);
  const usedMap = new Map<string, number>();
  items.forEach((item) => {
    usedMap.set(item.warehouseName, (usedMap.get(item.warehouseName) ?? 0) + item.qtyOnHand);
  });

  const capacityData = orderedWarehouses.map((name) => capacityMap.get(name) ?? DEFAULT_CAPACITY_FALLBACK);
  const usedData = orderedWarehouses.map((name) => usedMap.get(name) ?? 0);

  return {
    categories: orderedWarehouses,
    series: [
      { name: 'Capacity', data: capacityData },
      { name: 'Used', data: usedData },
    ],
  };
}
