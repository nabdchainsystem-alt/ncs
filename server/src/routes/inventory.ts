import { Router } from 'express';
import { eachMonthOfInterval, endOfYear, format, startOfYear } from 'date-fns';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';
import {
  getActivityByTypePie,
  getActivityKpis,
  getCapacityVsUsedBar,
  getCriticalByCategoryPie,
  getCriticalByWarehouseBar,
  getCriticalKpis,
  getDailyMovementsBar,
  getExcessByCategoryPie,
  getInventoryItemsFromOrders,
  getInventoryKpis,
  getItemsByWarehouseBar,
  getRecentMovements,
  getSlowExcessKpis,
  getStockHealthBreakdown,
  getTopSlowMovingBar,
  getUtilizationKpis,
  getUtilizationSharePie,
  getValueByCategoryBar,
} from '../services/inventoryAnalytics';

export const inventoryRouter = Router();

const warehouseKindSchema = z.enum(['raw', 'finished']).optional();

const recentMovementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
  type: z.string().trim().optional(),
  warehouse: z.string().trim().optional(),
});

const itemsFromOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
  status: z.string().trim().optional(),
  warehouse: z.string().trim().optional(),
  category: z.string().trim().optional(),
  q: z.string().trim().optional(),
});

const movementPayloadSchema = z.object({
  moveType: z.enum(['IN', 'OUT', 'ADJUST']),
  qty: z.coerce.number().int().positive(),
  note: z.string().trim().optional(),
});

const createItemSchema = z.object({
  materialNo: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  reorderPoint: z.coerce.number().int().nonnegative().optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
});

function mapInventoryItem(item: {
  id: number;
  materialNo: string;
  name: string;
  category: string | null;
  unit: string | null;
  qtyOnHand: number;
  reorderPoint: number;
  lastMovementAt: Date | null;
  warehouse: { id: number; name: string | null; code: string | null } | null;
}) {
  const qty = item.qtyOnHand ?? 0;
  const reorder = item.reorderPoint ?? 0;
  return {
    id: item.id,
    materialNo: item.materialNo,
    name: item.name,
    category: item.category,
    unit: item.unit,
    qtyOnHand: qty,
    reorderPoint: reorder,
    lowStock: qty > 0 && reorder > 0 ? qty <= reorder : qty <= 0,
    lastMovementAt: item.lastMovementAt?.toISOString() ?? null,
    warehouse: item.warehouse
      ? { id: item.warehouse.id, name: item.warehouse.name ?? 'Unassigned', code: item.warehouse.code ?? '' }
      : null,
  };
}

const monthLabels = (year: number) =>
  eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  }).map((date) => format(date, 'MMM'));

inventoryRouter.get('/items', asyncHandler(async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({
    where: { isDeleted: false },
    orderBy: { updatedAt: 'desc' },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });

  const mapped = items.map(mapInventoryItem);
  res.json({ items: mapped, total: mapped.length, page: 1, pageSize: mapped.length || 1 });
}));

inventoryRouter.post('/items', asyncHandler(async (req, res) => {
  const payload = createItemSchema.parse(req.body ?? {});

  const data: Prisma.InventoryItemCreateInput = {
    materialNo: payload.materialNo.trim(),
    name: payload.name.trim(),
    category: payload.category?.trim() || null,
    unit: payload.unit?.trim() || null,
    reorderPoint: Math.max(0, payload.reorderPoint ?? 0),
  };

  if (payload.warehouseId) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: payload.warehouseId } });
    if (warehouse) {
      data.warehouse = { connect: { id: warehouse.id } };
    }
  }

  try {
    const created = await prisma.inventoryItem.create({
      data,
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
    res.status(201).json(mapInventoryItem(created));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[inventory] create failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'inventory_item_duplicate' });
      return;
    }
    res.status(500).json({ error: 'inventory_create_failed' });
  }
}));

inventoryRouter.post('/items/:id/movements', asyncHandler(async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    res.status(400).json({ error: 'inventory_movement_invalid_id' });
    return;
  }

  const payload = movementPayloadSchema.parse(req.body);

  try {
    const updatedItem = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: itemId, isDeleted: false },
        include: { warehouse: { select: { id: true, name: true, code: true } } },
      });
      if (!item) {
        throw new Error('INVENTORY_ITEM_NOT_FOUND');
      }

      let nextQty = item.qtyOnHand;
      if (payload.moveType === 'IN') {
        nextQty = item.qtyOnHand + payload.qty;
      } else if (payload.moveType === 'OUT') {
        nextQty = Math.max(0, item.qtyOnHand - payload.qty);
      } else {
        nextQty = Math.max(0, payload.qty);
      }

      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          moveType: payload.moveType,
          qty: payload.qty,
          note: payload.note ?? null,
        },
      });

      return tx.inventoryItem.update({
        where: { id: item.id },
        data: { qtyOnHand: nextQty, lastMovementAt: movement.createdAt },
        include: { warehouse: { select: { id: true, name: true, code: true } } },
      });
    });

    res.json(mapInventoryItem(updatedItem));
  } catch (error) {
    if (error instanceof Error && error.message === 'INVENTORY_ITEM_NOT_FOUND') {
      res.status(404).json({ error: 'inventory_item_not_found' });
      return;
    }
    res.status(500).json({ error: 'inventory_movement_failed' });
  }
}));

inventoryRouter.get('/movements', asyncHandler(async (_req, res) => {
  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      item: { select: { id: true, name: true, materialNo: true } },
    },
  });

  res.json(movements);
}));

inventoryRouter.get('/kpis', asyncHandler(async (_req, res) => {
  const data = await getInventoryKpis();
  res.json(data);
}));

inventoryRouter.get('/analytics/stock-health', asyncHandler(async (_req, res) => {
  const data = await getStockHealthBreakdown();
  res.json(data);
}));

inventoryRouter.get('/analytics/items-by-warehouse', asyncHandler(async (_req, res) => {
  const data = await getItemsByWarehouseBar();
  res.json(data);
}));

inventoryRouter.get('/analytics/value-by-category', asyncHandler(async (_req, res) => {
  const data = await getValueByCategoryBar();
  res.json(data);
}));

inventoryRouter.get('/analytics/critical-kpis', asyncHandler(async (_req, res) => {
  const data = await getCriticalKpis();
  res.json(data);
}));

inventoryRouter.get('/analytics/critical-by-category', asyncHandler(async (_req, res) => {
  const data = await getCriticalByCategoryPie();
  res.json(data);
}));

inventoryRouter.get('/analytics/critical-by-warehouse', asyncHandler(async (_req, res) => {
  const data = await getCriticalByWarehouseBar();
  res.json(data);
}));

inventoryRouter.get('/analytics/slow-excess-kpis', asyncHandler(async (_req, res) => {
  const data = await getSlowExcessKpis();
  res.json(data);
}));

inventoryRouter.get('/analytics/excess-by-category', asyncHandler(async (_req, res) => {
  const data = await getExcessByCategoryPie();
  res.json(data);
}));

inventoryRouter.get('/analytics/top-slow-moving', asyncHandler(async (_req, res) => {
  const data = await getTopSlowMovingBar();
  res.json(data);
}));

inventoryRouter.get('/activity/kpis', asyncHandler(async (_req, res) => {
  const data = await getActivityKpis();
  res.json(data);
}));

inventoryRouter.get('/activity/by-type', asyncHandler(async (_req, res) => {
  const data = await getActivityByTypePie();
  res.json(data);
}));

inventoryRouter.get('/activity/daily', asyncHandler(async (_req, res) => {
  const data = await getDailyMovementsBar();
  res.json(data);
}));

inventoryRouter.get('/activity/recent', asyncHandler(async (req, res) => {
  const query = recentMovementsQuerySchema.parse(req.query);
  const page = query.page;
  const pageSize = Math.min(query.pageSize, 100);
  const data = await getRecentMovements({
    page,
    pageSize,
    type: query.type,
    warehouse: query.warehouse,
  });
  res.json(data);
}));

inventoryRouter.get('/utilization/kpis', asyncHandler(async (_req, res) => {
  const data = await getUtilizationKpis();
  res.json(data);
}));

inventoryRouter.get('/utilization/share', asyncHandler(async (_req, res) => {
  const data = await getUtilizationSharePie();
  res.json(data);
}));

inventoryRouter.get('/utilization/capacity-vs-used', asyncHandler(async (_req, res) => {
  const data = await getCapacityVsUsedBar();
  res.json(data);
}));

inventoryRouter.get('/items-from-orders', asyncHandler(async (req, res) => {
  const query = itemsFromOrdersQuerySchema.parse(req.query);
  const page = query.page;
  const pageSize = Math.min(query.pageSize, 100);
  const data = await getInventoryItemsFromOrders({
    page,
    pageSize,
    status: query.status,
    warehouse: query.warehouse,
    category: query.category,
    q: query.q,
  });
  res.json(data);
}));

inventoryRouter.get('/analytics/movements', asyncHandler(async (req, res) => {
  const yearParam = req.query.year ? Number(req.query.year) : undefined;
  const now = new Date();
  const year = Number.isFinite(yearParam) ? yearParam! : now.getFullYear();

  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));

  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: { createdAt: true, qty: true, moveType: true },
  });

  const categories = monthLabels(year);
  const inbound = Array(categories.length).fill(0);
  const outbound = Array(categories.length).fill(0);

  movements.forEach((movement) => {
    const index = new Date(movement.createdAt).getMonth();
    const qty = Number(movement.qty ?? 0);
    if (!Number.isFinite(qty)) return;

    if ((movement.moveType ?? '').toUpperCase() === 'IN') inbound[index] += qty;
    else outbound[index] += Math.abs(qty);
  });

  res.json({
    categories,
    series: [
      { name: 'Inbound Receipts', data: inbound },
      { name: 'Outbound Issues', data: outbound },
    ],
  });
}));

inventoryRouter.get('/analytics/stock-status', asyncHandler(async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ select: { qtyOnHand: true, reorderPoint: true } });

  const buckets: Record<'In Stock' | 'Low Stock' | 'Out of Stock', number> = {
    'In Stock': 0,
    'Low Stock': 0,
    'Out of Stock': 0,
  };

  items.forEach((item) => {
    const qty = item.qtyOnHand ?? 0;
    const reorder = item.reorderPoint ?? 0;
    if (qty <= 0) buckets['Out of Stock'] += 1;
    else if (reorder > 0 && qty <= reorder) buckets['Low Stock'] += 1;
    else buckets['In Stock'] += 1;
  });

  res.json(Object.entries(buckets).map(([name, value]) => ({ name, value })));
}));

function resolveWarehouseMeta(item: { id: number; warehouse?: { name: string | null } | null }) {
  const mapping: Record<number, { warehouse: string; kind: 'raw' | 'finished' }> = {
    1: { warehouse: 'WH-A', kind: 'raw' },
    2: { warehouse: 'WH-B', kind: 'raw' },
    3: { warehouse: 'WH-A', kind: 'finished' },
    4: { warehouse: 'WH-C', kind: 'finished' },
    5: { warehouse: 'WH-B', kind: 'finished' },
  };

  const fallbackWarehouse = item.warehouse?.name?.trim() || 'Unassigned';
  return mapping[item.id] ?? { warehouse: fallbackWarehouse, kind: 'raw' };
}

inventoryRouter.get('/analytics/by-warehouse', asyncHandler(async (req, res) => {
  const kind = warehouseKindSchema.parse(req.query.kind) ?? 'raw';

  const items = await prisma.inventoryItem.findMany({
    select: { id: true, qtyOnHand: true, warehouse: { select: { name: true } } },
  });

  const totals = items.reduce<Record<string, number>>((acc, item) => {
    const meta = resolveWarehouseMeta(item);
    if (meta.kind !== kind) return acc;

    const qty = Number(item.qtyOnHand ?? 0);
    if (!Number.isFinite(qty) || qty <= 0) return acc;

    acc[meta.warehouse] = (acc[meta.warehouse] ?? 0) + qty;
    return acc;
  }, {});

  const response = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  res.json(response);
}));

export default inventoryRouter;
