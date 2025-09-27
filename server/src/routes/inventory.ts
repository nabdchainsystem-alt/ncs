import { Router } from 'express';
import { eachMonthOfInterval, endOfYear, format, startOfYear } from 'date-fns';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { asyncHandler, HttpError } from '../errors';
import { prisma } from '../prisma';
import { ENFORCE_RM_PREFIX, RM_PREFIX_PATTERN } from '../constants';
import { ensureUniqueMaterialNo, upsertMaterial } from '../services/materials';
import { normalizeName, sanitizeCode } from '../utils/strings';
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
  store: z.string().trim().optional(),
  sortBy: z.enum(['date', 'qty', 'value']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
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
  orderId: z.coerce.number().int().positive().optional(),
  sourceWarehouseId: z.coerce.number().int().positive().optional(),
  destinationWarehouseId: z.coerce.number().int().positive().optional(),
  sourceWarehouse: z.string().trim().optional(),
  destinationWarehouse: z.string().trim().optional(),
  sourceStoreId: z.coerce.number().int().positive().optional(),
  destinationStoreId: z.coerce.number().int().positive().optional(),
});

const createItemSchema = z.object({
  itemCode: z.string().trim().optional(),
  materialNo: z.string().trim().optional(),
  itemDescription: z.string().trim().optional(),
  name: z.string().trim().optional(),
  materialId: z.coerce.number().int().positive().optional(),
  category: z.string().trim().min(1, 'category_required'),
  categoryParent: z.string().trim().optional(),
  picture: z.string().trim().optional(),
  unit: z.string().trim().min(1, 'unit_required'),
  bigUnit: z.string().trim().optional(),
  unitCost: z.coerce.number().nonnegative().optional(),
  qtyOnHand: z.coerce.number().int().nonnegative().optional(),
  qty: z.coerce.number().int().nonnegative().optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  reorderPoint: z.coerce.number().int().nonnegative().optional(),
  reorder: z.coerce.number().int().nonnegative().optional(),
  lowQty: z.coerce.number().int().nonnegative().optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
  warehouse: z.string().trim().min(1).optional(),
  warehouseLabel: z.string().trim().optional(),
  storeId: z.coerce.number().int().positive().optional(),
});

type InventoryItemWithRelations = Prisma.InventoryItemGetPayload<{
  include: {
    warehouse: { select: { id: true; name: true; code: true } };
    store: { select: { id: true; code: true; name: true; isActive: true } };
    material: true;
  };
}>;

function mapInventoryItem(item: InventoryItemWithRelations) {
  const qty = item.qtyOnHand ?? 0;
  const reorder = item.reorderPoint ?? 0;
  const category = item.category ?? '';
  const derivedCategoryParent = category.includes(' - ')
    ? category.split(' - ')[0]?.trim() || null
    : null;
  const warehouseName = item.warehouseLabel
    ?? item.warehouse?.name
    ?? item.warehouse?.code
    ?? 'Unassigned';
  const storeName = item.store?.name
    ?? item.store?.code
    ?? 'Unassigned';
  const materialName = item.material?.name ?? item.name;

  return {
    id: item.id,
    itemCode: item.materialNo,
    materialNo: item.materialNo,
    itemDescription: materialName,
    picture: item.picture,
    category,
    categoryParent: item.categoryParent ?? derivedCategoryParent,
    unit: item.unit ?? '',
    bigUnit: item.bigUnit ?? null,
    unitCost: item.unitCost ?? null,
    qty,
    reorder,
    qtyOnHand: qty,
    reorderPoint: reorder,
    warehouse: warehouseName,
    warehouseId: item.warehouse?.id ?? null,
    storeId: item.storeId ?? item.store?.id ?? null,
    storeCode: item.store?.code ?? null,
    store: storeName,
    material: item.material
      ? { id: item.material.id, name: item.material.name, code: item.material.code ?? null }
      : null,
    storeEntity: item.store
      ? { id: item.store.id, name: item.store.name, code: item.store.code ?? null, isActive: item.store.isActive }
      : null,
    lowStock: qty > 0 && reorder > 0 ? qty <= reorder : qty <= 0,
    lastMovementAt: item.lastMovementAt?.toISOString() ?? null,
  };
}

const monthLabels = (year: number) =>
  eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  }).map((date) => format(date, 'MMM'));

inventoryRouter.get('/items', asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
  const categoryFilter = typeof req.query.category === 'string' ? req.query.category.trim() : '';

  const where: Prisma.InventoryItemWhereInput = {
    isDeleted: false,
  };

  if (search) {
    where.OR = [
      { materialNo: { contains: search } },
      { name: { contains: search } },
      { category: { contains: search } },
      { categoryParent: { contains: search } },
      { warehouseLabel: { contains: search } },
      { warehouse: { is: { name: { contains: search } } } },
      { warehouse: { is: { code: { contains: search } } } },
    ];
  }

  if (categoryFilter) {
    where.category = { contains: categoryFilter };
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      store: { select: { id: true, code: true, name: true, isActive: true } },
      material: true,
    },
  });

  const mapped = items.map(mapInventoryItem);

  const filteredByStatus = status && status !== 'all'
    ? mapped.filter((item) => {
        if (status === 'out-of-stock') return item.qty <= 0;
        if (status === 'low-stock') return item.qty > 0 && item.reorder > 0 && item.qty <= item.reorder;
        if (status === 'in-stock') return item.qty > 0 && (item.reorder <= 0 || item.qty > item.reorder);
        return true;
      })
    : mapped;

  const requestedAll = typeof req.query.all === 'string'
    && ['1', 'true', 'yes'].includes(req.query.all.toLowerCase());

  if (requestedAll) {
    res.json(filteredByStatus);
    return;
  }

  res.json({
    items: filteredByStatus,
    total: filteredByStatus.length,
    page: 1,
    pageSize: filteredByStatus.length || 1,
  });
}));

inventoryRouter.post('/items', asyncHandler(async (req, res) => {
  const payload = createItemSchema.parse(req.body ?? {});
  const rawCode = payload.itemCode ?? payload.materialNo ?? '';
  const rawName = payload.itemDescription ?? payload.name ?? '';

  const sanitizedCode = sanitizeCode(rawCode);
  const normalizedName = normalizeName(rawName);

  if (!sanitizedCode || !normalizedName) {
    throw new HttpError(400, 'item_code_and_description_required');
  }
  if (ENFORCE_RM_PREFIX && !RM_PREFIX_PATTERN.test(normalizedName)) {
    throw new HttpError(422, 'material_prefix_required');
  }

  const canonicalName = normalizedName.toLowerCase().startsWith('rm')
    ? `RM${normalizedName.slice(2)}`
    : normalizedName;

  const category = payload.category.trim();
  const categoryParent = payload.categoryParent?.trim()
    ?? (category.includes(' - ') ? category.split(' - ')[0]?.trim() || null : null);
  const unit = payload.unit.trim();
  const bigUnit = payload.bigUnit?.trim() || null;
  const unitCost = Number.isFinite(payload.unitCost) ? payload.unitCost : null;
  const qtyOnHand = Math.max(0, payload.qtyOnHand ?? payload.qty ?? payload.quantity ?? 0);
  const reorderPoint = Math.max(0, payload.reorderPoint ?? payload.reorder ?? payload.lowQty ?? 0);
  const warehouseLabel = payload.warehouseLabel?.trim() || payload.warehouse?.trim() || null;
  const picture = payload.picture?.trim() || null;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const { material } = await upsertMaterial(tx, {
        materialId: payload.materialId,
        name: canonicalName,
        code: sanitizedCode,
      });

      let storeRelation: Prisma.StoreWhereUniqueInput | null = null;
      if (payload.storeId) {
        const store = await tx.store.findFirst({ where: { id: payload.storeId, isActive: true } });
        if (!store) {
          throw new HttpError(400, 'store_not_found', { details: { storeId: payload.storeId } });
        }
        storeRelation = { id: store.id };
      }

      const warehouse = payload.warehouseId
        ? await tx.warehouse.findUnique({ where: { id: payload.warehouseId } })
        : null;
      if (payload.warehouseId && !warehouse) {
        throw new HttpError(400, 'warehouse_not_found', { details: { warehouseId: payload.warehouseId } });
      }

      if (!storeRelation && warehouse?.storeId) {
        storeRelation = { id: warehouse.storeId };
      }

      if (!storeRelation) {
        const fallbackStore = await tx.store.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } });
        if (fallbackStore) {
          storeRelation = { id: fallbackStore.id };
        }
      }

      const materialNo = sanitizedCode ?? material.code ?? await ensureUniqueMaterialNo(tx, canonicalName);

      const item = await tx.inventoryItem.create({
        data: {
          materialNo,
          name: canonicalName,
          category,
          categoryParent,
          picture,
          unit,
          bigUnit,
          unitCost,
          qtyOnHand,
          reorderPoint,
          warehouseLabel,
          material: { connect: { id: material.id } },
          ...(storeRelation ? { store: { connect: storeRelation } } : {}),
          ...(warehouse ? { warehouse: { connect: { id: warehouse.id } } } : {}),
        },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          store: { select: { id: true, code: true, name: true, isActive: true } },
          material: true,
        },
      });

      return item;
    });

    res.status(201).json(mapInventoryItem(created));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'inventory_item_duplicate');
    }
    throw error;
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
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          store: { select: { id: true, code: true, name: true, isActive: true } },
          material: true,
        },
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

      const sourceWarehouseRecord = payload.sourceWarehouseId
        ? await tx.warehouse.findUnique({ where: { id: payload.sourceWarehouseId } })
        : null;
      const destinationWarehouseRecord = payload.destinationWarehouseId
        ? await tx.warehouse.findUnique({ where: { id: payload.destinationWarehouseId } })
        : null;

      const sourceStoreRecord = payload.sourceStoreId
        ? await tx.store.findUnique({ where: { id: payload.sourceStoreId }, select: { id: true, name: true, code: true } })
        : null;
      let destinationStoreRecord = payload.destinationStoreId
        ? await tx.store.findUnique({ where: { id: payload.destinationStoreId }, select: { id: true, name: true, code: true } })
        : null;

      const orderContext = payload.orderId
        ? await tx.order.findUnique({
            where: { id: payload.orderId },
            include: {
              store: { select: { id: true, name: true, code: true } },
              request: {
                include: {
                  store: { select: { id: true, name: true, code: true } },
                  items: {
                    select: {
                      qty: true,
                      storeId: true,
                      store: { select: { id: true, name: true, code: true } },
                    },
                  },
                },
              },
            },
          })
        : null;

      const orderStoreCandidate = orderContext?.store
        ?? orderContext?.request?.store
        ?? orderContext?.request?.items.find((entry) => entry.store)?.store
        ?? null;
      if (!destinationStoreRecord && orderStoreCandidate) {
        destinationStoreRecord = orderStoreCandidate;
      }

      const destinationStoreId = destinationStoreRecord?.id ?? orderStoreCandidate?.id ?? null;

      const sourceWarehouseLabel = sourceWarehouseRecord?.name
        ?? (payload.sourceWarehouse?.length ? payload.sourceWarehouse : null);
      const destinationWarehouseLabel = destinationWarehouseRecord?.name
        ?? (payload.destinationWarehouse?.length ? payload.destinationWarehouse : null);

      const currentUnitCost = item.unitCost ?? 0;
      let derivedUnitCost = currentUnitCost;
      if (payload.moveType === 'IN' && orderContext?.totalValue != null) {
        const aggregatedQty = orderContext.request?.items?.reduce((sum, entry) => {
          const qtyValue = Number(entry.qty ?? 0);
          return Number.isFinite(qtyValue) ? sum + Math.max(0, qtyValue) : sum;
        }, 0) ?? 0;
        if (aggregatedQty > 0) {
          derivedUnitCost = orderContext.totalValue / aggregatedQty;
        } else if (payload.qty > 0) {
          derivedUnitCost = orderContext.totalValue / payload.qty;
        }
      }
      if (!Number.isFinite(derivedUnitCost) || derivedUnitCost <= 0) {
        derivedUnitCost = currentUnitCost;
      }

      const unitCostForValue = derivedUnitCost > 0 ? derivedUnitCost : currentUnitCost;
      let movementValue = 0;
      if (payload.moveType === 'ADJUST') {
        const deltaQty = nextQty - item.qtyOnHand;
        movementValue = deltaQty * unitCostForValue;
      } else {
        const direction = payload.moveType === 'OUT' ? -1 : 1;
        movementValue = direction * payload.qty * unitCostForValue;
      }

      const itemStoreId = item.storeId ?? null;
      const effectiveStoreId = (() => {
        if (payload.moveType === 'IN') {
          return destinationStoreId ?? itemStoreId ?? orderStoreCandidate?.id ?? null;
        }
        if (payload.moveType === 'OUT') {
          return sourceStoreRecord?.id ?? itemStoreId ?? null;
        }
        return destinationStoreId ?? itemStoreId ?? null;
      })();

      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          moveType: payload.moveType,
          qty: payload.qty,
          note: payload.note ?? null,
          orderId: payload.orderId ?? null,
          sourceWarehouseId: sourceWarehouseRecord?.id ?? null,
          destinationWarehouseId: destinationWarehouseRecord?.id ?? null,
          sourceWarehouseLabel,
          destinationWarehouseLabel,
          sourceStoreId: sourceStoreRecord?.id ?? null,
          destinationStoreId,
          storeId: effectiveStoreId,
          valueSar: Number.isFinite(movementValue) ? movementValue : null,
        },
      });

      const updateData: Prisma.InventoryItemUpdateInput = {
        qtyOnHand: nextQty,
        lastMovementAt: movement.createdAt,
      };

      if (payload.moveType === 'IN') {
        if (destinationWarehouseRecord?.id) {
          updateData.warehouse = { connect: { id: destinationWarehouseRecord.id } };
          updateData.warehouseLabel = destinationWarehouseRecord.name;
          if (destinationWarehouseRecord.storeId) {
            updateData.store = { connect: { id: destinationWarehouseRecord.storeId } };
          }
        } else if (destinationWarehouseLabel) {
          updateData.warehouseLabel = destinationWarehouseLabel;
        }

        if (!updateData.store && destinationStoreId) {
          updateData.store = { connect: { id: destinationStoreId } };
        }

        if (!updateData.store && !item.storeId) {
          const defaultStore = await tx.store.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } });
          if (defaultStore) {
            updateData.store = { connect: { id: defaultStore.id } };
          }
        }

        if (unitCostForValue > 0) {
          const incomingValue = unitCostForValue * payload.qty;
          const currentValue = currentUnitCost * item.qtyOnHand;
          const combinedQty = Math.max(0, nextQty);
          const weightedCost = combinedQty > 0 ? (currentValue + incomingValue) / combinedQty : unitCostForValue;
          if (Number.isFinite(weightedCost) && weightedCost > 0) {
            updateData.unitCost = weightedCost;
          }
        }
      } else if (payload.moveType === 'ADJUST' && unitCostForValue > 0) {
        updateData.unitCost = unitCostForValue;
      }

      return tx.inventoryItem.update({
        where: { id: item.id },
        data: updateData,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          store: { select: { id: true, code: true, name: true, isActive: true } },
          material: true,
        },
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
    store: query.store,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
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
