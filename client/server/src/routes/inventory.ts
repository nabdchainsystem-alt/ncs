import { Prisma } from '@prisma/client';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { ENFORCE_RM_PREFIX, RM_PREFIX_PATTERN } from '../constants';
import { asyncHandler, HttpError } from '../utils/http';
import { ensureUniqueMaterialNo, upsertMaterial } from '../services/materials';
import { normalizeName, sanitizeCode, toNullableString } from '../utils/strings';
import prisma from '../lib/prisma';

const router = Router();

const createItemSchema = z.object({
  materialName: z.string().min(2).max(255),
  materialId: z.coerce.number().int().positive().optional(),
  code: z.string().trim().max(64).optional(),
  storeId: z.coerce.number().int().positive().optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
  unit: z.string().trim().max(64).optional(),
  bigUnit: z.string().trim().max(64).optional(),
  category: z.string().trim().max(255).optional(),
  categoryParent: z.string().trim().max(255).optional(),
  picture: z.string().trim().max(1024).optional(),
  warehouseLabel: z.string().trim().max(255).optional(),
  unitCost: z.coerce.number().nonnegative().optional(),
  reorderPoint: z.coerce.number().int().nonnegative().optional(),
  qtyOnHand: z.coerce.number().int().nonnegative().optional(),
});

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

type InventoryItemWithRelations = Prisma.InventoryItemGetPayload<{
  include: {
    warehouse: { select: { id: true; name: true; code: true } };
    store: { select: { id: true; code: true; name: true; isActive: true } };
    material: true;
  };
}>;

const mapItem = (item: InventoryItemWithRelations) => {
  const qty = item.qtyOnHand ?? 0;
  const threshold = item.reorderPoint ?? 0;
  const warehouseName = item.warehouseLabel
    ?? item.warehouse?.name
    ?? item.warehouse?.code
    ?? 'Unassigned';
  const storeName = item.store?.name
    ?? item.store?.code
    ?? 'Unassigned';

  return {
    id: item.id,
    materialNo: item.materialNo,
    name: item.material?.name ?? item.name,
    category: item.category,
    unit: item.unit,
    qtyOnHand: qty,
    reorderPoint: threshold,
    lowStock: qty <= threshold,
    lastMovementAt: item.lastMovementAt,
    warehouse: item.warehouse
      ? { id: item.warehouse.id, code: item.warehouse.code, name: item.warehouse.name }
      : null,
    store: item.store
      ? { id: item.store.id, code: item.store.code, name: item.store.name, isActive: item.store.isActive }
      : null,
    material: item.material
      ? { id: item.material.id, name: item.material.name, code: item.material.code ?? null }
      : null,
    warehouseLabel: warehouseName,
    storeName,
  };
};

const parseIdArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const num = typeof item === 'number' ? item : Number(item);
      return Number.isFinite(num) ? Math.trunc(num) : NaN;
    })
    .filter((num) => Number.isInteger(num) && num > 0);
};

const slugifyWarehouse = (source: string): string => {
  const base = source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'wh';
  return base.slice(0, 24);
};

router.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, scope: 'inventory' });
});

const sendCards = (res: Response, extra: Record<string, unknown> = {}) => {
  res.json({ cards: [], ...extra });
};

const sendChart = (res: Response) => {
  res.json({ series: [], labels: [], table: [], categories: [] });
};

const sendList = (res: Response) => {
  res.json({ items: [], total: 0, page: 1, pageSize: 0 });
};

router.get('/kpis', (_req: Request, res: Response) => {
  sendCards(res, { ok: true, scope: 'inventory' });
});

['/analytics/stock-health', '/analytics/items-by-warehouse', '/analytics/value-by-category', '/analytics/critical-by-category', '/analytics/critical-by-warehouse', '/analytics/excess-by-category', '/analytics/top-slow-moving', '/analytics/utilization'].forEach((path) => {
  router.get(path, (_req: Request, res: Response) => {
    sendChart(res);
  });
});

['/analytics/critical-kpis', '/analytics/slow-excess-kpis'].forEach((path) => {
  router.get(path, (_req: Request, res: Response) => {
    sendCards(res);
  });
});

['/activity/kpis'].forEach((path) => {
  router.get(path, (_req: Request, res: Response) => {
    sendCards(res);
  });
});

['/activity/by-type', '/activity/daily'].forEach((path) => {
  router.get(path, (_req: Request, res: Response) => {
    sendChart(res);
  });
});

router.get('/activity/recent', (_req: Request, res: Response) => {
  sendList(res);
});

router.get('/utilization/kpis', (_req: Request, res: Response) => {
  sendCards(res);
});

['/utilization/share', '/utilization/capacity-vs-used'].forEach((path) => {
  router.get(path, (_req: Request, res: Response) => {
    sendChart(res);
  });
});

router.get('/items-from-orders', (_req: Request, res: Response) => {
  sendList(res);
});

router.get('/items', async (req: Request, res: Response) => {
  try {
    const pickQueryString = (key: string): string | undefined => {
      const value = req.query[key];
      if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
      }
      return typeof value === 'string' ? value : undefined;
    };

    const search = pickQueryString('search');
    const warehouseId = pickQueryString('warehouseId');
    const warehouse = pickQueryString('warehouse');
    const category = pickQueryString('category');
    const status = pickQueryString('status');
    const pageParam = pickQueryString('page') ?? '1';
    const pageSizeParam = pickQueryString('pageSize') ?? '20';
    const lowStockOnly = toBoolean(pickQueryString('lowStockOnly'));

    const parsedPage = Number.parseInt(pageParam, 10);
    const parsedPageSize = Number.parseInt(pageSizeParam, 10);
    const pageNum = Math.max(1, Number.isFinite(parsedPage) ? parsedPage : 1);
    const takeCandidate = Number.isFinite(parsedPageSize) ? parsedPageSize : 20;
    const take = Math.max(1, Math.min(100, takeCandidate));
    const skip = (pageNum - 1) * take;

    const baseWhere: Prisma.InventoryItemWhereInput = { isDeleted: false };
    const andClauses: Prisma.InventoryItemWhereInput[] = [];

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search } },
          { materialNo: { contains: search } },
          { category: { contains: search } },
        ],
      });
    }

    const warehouseNumeric = parseNumber(warehouseId);
    if (warehouseNumeric) {
      andClauses.push({ warehouseId: warehouseNumeric });
    }

    if (warehouse && warehouse.trim()) {
      const trimmed = warehouse.trim();
      andClauses.push({
        warehouse: {
          OR: [
            { code: trimmed },
            { name: trimmed },
          ],
        },
      });
    }

    if (category && category.trim()) {
      andClauses.push({ category: category.trim() });
    }

    let where: Prisma.InventoryItemWhereInput = baseWhere;
    if (andClauses.length) {
      where = { AND: [baseWhere, ...andClauses] };
    }

    const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : undefined;
    const requiresManualFilter = lowStockOnly || normalizedStatus === 'low-stock' || normalizedStatus === 'in-stock';

    if (normalizedStatus === 'out-of-stock') {
      where = { AND: [where, { qtyOnHand: { lte: 0 } }] };
    }

    if (requiresManualFilter) {
      const allItems = await prisma.inventoryItem.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          store: { select: { id: true, code: true, name: true, isActive: true } },
          material: true,
        },
        orderBy: [{ updatedAt: 'desc' }],
      });

      const filtered = allItems.filter((item) => {
        const qty = item.qtyOnHand ?? 0;
        const threshold = Math.max(item.reorderPoint ?? 0, 0);
        if (normalizedStatus === 'in-stock') {
          return qty > threshold;
        }
        if (normalizedStatus === 'low-stock') {
          return qty > 0 && qty <= threshold;
        }
        return qty <= threshold;
      });

      const total = filtered.length;
      const paged = filtered.slice(skip, skip + take).map(mapItem);
      return res.json({ items: paged, total, page: pageNum, pageSize: take });
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          store: { select: { id: true, code: true, name: true, isActive: true } },
          material: true,
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    res.json({ items: items.map(mapItem), total, page: pageNum, pageSize: take });
  } catch (error) {
    console.error('[inventory] list failed', error);
    res.status(500).json({ error: 'inventory_list_failed' });
  }
});

router.get('/warehouses', async (_req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: {},
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    res.json(warehouses);
  } catch (error) {
    console.error('[inventory] warehouses failed', error);
    res.status(500).json({ error: 'inventory_warehouses_failed' });
  }
});

router.patch('/items/bulk', async (req: Request, res: Response) => {
  try {
    const ids = parseIdArray(req.body?.ids);
    const patch = req.body?.patch ?? {};
    if (!ids.length) {
      return res.status(400).json({ error: 'inventory_bulk_invalid_ids' });
    }

    const data: Prisma.InventoryItemUpdateManyMutationInput = {};
    if (typeof patch.unit === 'string' && patch.unit.trim()) data.unit = patch.unit.trim();
    if (patch.lowQty !== undefined) {
      const value = Number(patch.lowQty);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({ error: 'inventory_bulk_invalid_lowQty' });
      }
      data.reorderPoint = Math.max(0, Math.trunc(value));
    }
    if (typeof patch.category === 'string' && patch.category.trim()) data.category = patch.category.trim();

    if (!Object.keys(data).length) {
      return res.status(400).json({ error: 'inventory_bulk_no_fields' });
    }

    const result = await prisma.inventoryItem.updateMany({
      where: { id: { in: ids }, isDeleted: false },
      data,
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('[inventory] bulk update failed', error);
    res.status(500).json({ error: 'inventory_bulk_failed' });
  }
});

router.post('/items/move', async (req: Request, res: Response) => {
  try {
    const ids = parseIdArray(req.body?.ids);
    const destination = typeof req.body?.toWarehouse === 'string' ? req.body.toWarehouse.trim() : '';
    if (!ids.length) {
      return res.status(400).json({ error: 'inventory_move_invalid_ids' });
    }
    if (!destination) {
      return res.status(400).json({ error: 'inventory_move_invalid_destination' });
    }

    const trimmed = destination;
    let warehouse = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { code: trimmed },
          { name: trimmed },
        ],
      },
    });

    if (!warehouse) {
      const baseCode = slugifyWarehouse(trimmed);
      let code = baseCode;
      let attempt = 1;
      while (await prisma.warehouse.findUnique({ where: { code } })) {
        code = `${baseCode}-${attempt}`.slice(0, 32);
        attempt += 1;
      }
      warehouse = await prisma.warehouse.create({ data: { name: trimmed, code } });
    }

    const result = await prisma.inventoryItem.updateMany({
      where: { id: { in: ids }, isDeleted: false },
      data: { warehouseId: warehouse.id },
    });

    res.json({ moved: result.count });
  } catch (error) {
    console.error('[inventory] move failed', error);
    res.status(500).json({ error: 'inventory_move_failed' });
  }
});

router.delete('/items', async (req: Request, res: Response) => {
  try {
    const ids = parseIdArray(req.body?.ids);
    if (!ids.length) {
      return res.status(400).json({ error: 'inventory_delete_invalid_ids' });
    }

    const existing = await prisma.inventoryItem.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const foundIds = new Set(existing.map((item) => item.id));

    if (foundIds.size) {
      await prisma.inventoryItem.deleteMany({ where: { id: { in: Array.from(foundIds) } } });
    }

    const failed = ids
      .filter((id) => !foundIds.has(id))
      .map((id) => ({ id: id.toString(), reason: 'not_found' }));

    res.json({
      deleted: Array.from(foundIds, (id) => id.toString()),
      failed: failed.length ? failed : undefined,
    });
  } catch (error) {
    console.error('[inventory] delete failed', error);
    res.status(500).json({ error: 'inventory_delete_failed' });
  }
});

router.post('/items', asyncHandler(async (req, res) => {
  const parsed = createItemSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_inventory_payload', { details: parsed.error.flatten() });
  }

  const normalizedName = normalizeName(parsed.data.materialName);
  if (!normalizedName) {
    throw new HttpError(400, 'material_name_required');
  }
  if (ENFORCE_RM_PREFIX && !RM_PREFIX_PATTERN.test(normalizedName)) {
    throw new HttpError(422, 'material_prefix_required');
  }

  const canonicalName = normalizedName.toLowerCase().startsWith('rm')
    ? `RM${normalizedName.slice(2)}`
    : normalizedName;

  const normalizedCode = parsed.data.code === undefined ? undefined : sanitizeCode(parsed.data.code);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { material } = await upsertMaterial(tx, {
        materialId: parsed.data.materialId,
        name: canonicalName,
        code: normalizedCode,
      });

      const storeConnect = parsed.data.storeId
        ? await tx.store.findFirst({ where: { id: parsed.data.storeId, isActive: true } })
        : null;
      if (parsed.data.storeId && !storeConnect) {
        throw new HttpError(400, 'store_not_found', { details: { storeId: parsed.data.storeId } });
      }

      const warehouseConnect = parsed.data.warehouseId
        ? await tx.warehouse.findUnique({ where: { id: parsed.data.warehouseId } })
        : null;
      if (parsed.data.warehouseId && !warehouseConnect) {
        throw new HttpError(400, 'warehouse_not_found', { details: { warehouseId: parsed.data.warehouseId } });
      }

      const materialNo = normalizedCode ?? material.code ?? await ensureUniqueMaterialNo(tx, canonicalName);

      const storeRelation = storeConnect
        ? { connect: { id: storeConnect.id } }
        : warehouseConnect?.storeId
          ? { connect: { id: warehouseConnect.storeId } }
          : undefined;

      const item = await tx.inventoryItem.create({
        data: {
          materialNo,
          name: canonicalName,
          category: toNullableString(parsed.data.category),
          categoryParent: toNullableString(parsed.data.categoryParent),
          picture: toNullableString(parsed.data.picture),
          unit: toNullableString(parsed.data.unit),
          bigUnit: toNullableString(parsed.data.bigUnit),
          unitCost: parsed.data.unitCost ?? null,
          qtyOnHand: parsed.data.qtyOnHand ?? 0,
          reorderPoint: parsed.data.reorderPoint ?? 0,
          warehouseLabel: toNullableString(parsed.data.warehouseLabel),
          material: { connect: { id: material.id } },
          ...(storeRelation ? { store: storeRelation } : {}),
          ...(warehouseConnect ? { warehouse: { connect: { id: warehouseConnect.id } } } : {}),
        },
        include: {
          material: true,
          store: { select: { id: true, name: true, code: true, isActive: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      });

      return item;
    });

    res.status(201).json({
      id: result.id,
      materialNo: result.materialNo,
      name: result.name,
      qtyOnHand: result.qtyOnHand,
      reorderPoint: result.reorderPoint,
      unit: result.unit ?? null,
      warehouseLabel: result.warehouseLabel ?? null,
      material: result.material
        ? { id: result.material.id, name: result.material.name, code: result.material.code ?? null }
        : null,
      store: result.store
        ? { id: result.store.id, name: result.store.name, code: result.store.code ?? null, isActive: result.store.isActive }
        : null,
      warehouse: result.warehouse
        ? { id: result.warehouse.id, name: result.warehouse.name ?? result.warehouse.code ?? null, code: result.warehouse.code ?? null }
        : null,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'inventory_item_duplicate');
    }
    throw error;
  }
}));

router.patch('/items/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'inventory_update_invalid_id' });
    }

    const { materialNo, qtyOnHand, ...rest } = req.body ?? {};
    if (materialNo !== undefined) {
      return res.status(400).json({ error: 'inventory_update_materialNo_immutable' });
    }
    if (qtyOnHand !== undefined) {
      return res.status(400).json({ error: 'inventory_update_qty_disallowed' });
    }

    const data: Prisma.InventoryItemUpdateInput = {};

    if (typeof rest.name === 'string') data.name = rest.name.trim();
    if (rest.unit !== undefined) {
      if (rest.unit === null) data.unit = null;
      else if (typeof rest.unit === 'string') data.unit = rest.unit.trim() || null;
      else data.unit = String(rest.unit);
    }
    if (rest.category !== undefined) {
      if (rest.category === null) data.category = null;
      else if (typeof rest.category === 'string') data.category = rest.category.trim() || null;
      else data.category = String(rest.category);
    }
    if (rest.reorderPoint !== undefined) {
      const rp = Number(rest.reorderPoint);
      if (!Number.isFinite(rp)) return res.status(400).json({ error: 'inventory_update_invalid_reorderPoint' });
      data.reorderPoint = Math.max(0, Math.round(rp));
    }

    if (rest.warehouseId !== undefined) {
      const warehouseNumeric = parseNumber(rest.warehouseId);
      if (warehouseNumeric) {
        data.warehouse = { connect: { id: warehouseNumeric } };
      } else if (rest.warehouseId === null) {
        data.warehouse = { disconnect: true };
      }
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data,
      include: { warehouse: true },
    });

    res.json(mapItem(updated));
  } catch (error) {
    console.error('[inventory] update failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'inventory_item_not_found' });
    }
    res.status(500).json({ error: 'inventory_update_failed' });
  }
});

router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'inventory_delete_invalid_id' });
    }

    await prisma.inventoryItem.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('[inventory] delete failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'inventory_item_not_found' });
    }
    res.status(500).json({ error: 'inventory_delete_failed' });
  }
});

router.post('/items/:id/movements', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'inventory_movement_invalid_id' });
    }

    const { moveType, qty, note } = req.body ?? {};
    if (!['IN', 'OUT', 'ADJUST'].includes(moveType)) {
      return res.status(400).json({ error: 'inventory_movement_invalid_type' });
    }
    const qtyNumber = Number(qty);
    if (!Number.isFinite(qtyNumber) || qtyNumber <= 0) {
      return res.status(400).json({ error: 'inventory_movement_invalid_qty' });
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({ where: { id, isDeleted: false } });
      if (!item) {
        throw new Error('INVENTORY_ITEM_NOT_FOUND');
      }

      let nextQty = item.qtyOnHand;
      if (moveType === 'IN') {
        nextQty = item.qtyOnHand + qtyNumber;
      } else if (moveType === 'OUT') {
        nextQty = Math.max(0, item.qtyOnHand - qtyNumber);
      } else {
        const noteLower = typeof note === 'string' ? note.toLowerCase() : '';
        if (noteLower.includes('delta')) {
          const isDecrease = noteLower.includes('delta-') || noteLower.includes('decrease');
          nextQty = isDecrease ? Math.max(0, item.qtyOnHand - qtyNumber) : item.qtyOnHand + qtyNumber;
        } else {
          nextQty = Math.max(0, qtyNumber);
        }
      }

      const movement = await tx.stockMovement.create({
        data: {
          itemId: id,
          moveType,
          qty: qtyNumber,
          note: note ?? null,
        },
      });

      return tx.inventoryItem.update({
        where: { id: item.id },
        data: { qtyOnHand: nextQty, lastMovementAt: movement.createdAt },
        include: { warehouse: true },
      });
    });

    if (!updatedItem) {
      return res.status(404).json({ error: 'inventory_item_not_found' });
    }

    res.json(mapItem(updatedItem));
  } catch (error) {
    console.error('[inventory] movement failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'inventory_item_not_found' });
    }
    if (error instanceof Error && error.message === 'INVENTORY_ITEM_NOT_FOUND') {
      return res.status(404).json({ error: 'inventory_item_not_found' });
    }
    res.status(500).json({ error: 'inventory_movement_failed' });
  }
});

router.get('/items/:id/movements', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'inventory_movements_invalid_id' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const take = Math.max(1, Math.min(100, Number(req.query.pageSize) || 20));
    const skip = (page - 1) * take;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { itemId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.stockMovement.count({ where: { itemId: id } }),
    ]);

    res.json({ movements, total, page, pageSize: take });
  } catch (error) {
    console.error('[inventory] movement list failed', error);
    res.status(500).json({ error: 'inventory_movement_list_failed' });
  }
});

export default router;
