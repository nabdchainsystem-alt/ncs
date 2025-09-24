import { Prisma } from '@prisma/client';
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

const parseNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toBoolean = (value: any): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

const mapItem = (item: any) => ({
  id: item.id,
  materialNo: item.materialNo,
  name: item.name,
  category: item.category,
  unit: item.unit,
  qtyOnHand: item.qtyOnHand,
  reorderPoint: item.reorderPoint,
  lowStock: item.qtyOnHand <= item.reorderPoint,
  lastMovementAt: item.lastMovementAt,
  warehouse: item.warehouse
    ? { id: item.warehouse.id, code: item.warehouse.code, name: item.warehouse.name }
    : null,
});

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
      if (Array.isArray(value)) return value[0];
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
          { name: { contains: search, mode: 'insensitive' } },
          { materialNo: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const warehouseNumeric = parseNumber(warehouseId);
    if (warehouseNumeric) {
      andClauses.push({ warehouseId: warehouseNumeric });
    }

    if (warehouse && warehouse.trim()) {
      andClauses.push({
        warehouse: {
          OR: [
            { code: { equals: warehouse.trim(), mode: 'insensitive' } },
            { name: { equals: warehouse.trim(), mode: 'insensitive' } },
          ],
        },
      });
    }

    if (category && category.trim()) {
      andClauses.push({ category: { equals: category.trim(), mode: 'insensitive' } });
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
        include: { warehouse: true },
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
        include: { warehouse: true },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    res.json({ items: items.map(mapItem), total, page: pageNum, pageSize: take });
  } catch (error) {
    console.error('[inventory] list failed', error);
    res.status(500).json({ error: 'inventory_list_failed' });
  }
});

router.post('/items', async (req: Request, res: Response) => {
  try {
    const {
      materialNo,
      code,
      name,
      unit,
      category,
      reorderPoint,
      warehouseId,
      warehouse,
      qty,
      qtyOnHand,
      quantity,
    } = req.body ?? {};

    const rawMaterialNo = typeof materialNo === 'string' && materialNo.trim()
      ? materialNo.trim()
      : (typeof code === 'string' ? code.trim() : '');

    if (!rawMaterialNo) {
      return res.status(400).json({ error: 'inventory_create_invalid_materialNo' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'inventory_create_invalid_name' });
    }

    const rpValue = reorderPoint === undefined || reorderPoint === null || reorderPoint === '' ? 0 : Number(reorderPoint);
    if (!Number.isFinite(rpValue)) {
      return res.status(400).json({ error: 'inventory_create_invalid_reorderPoint' });
    }

    const data: Prisma.InventoryItemCreateInput = {
      materialNo: rawMaterialNo,
      name: name.trim(),
      unit: typeof unit === 'string' ? unit.trim() || null : unit ?? null,
      category: typeof category === 'string' ? (category.trim() || null) : category ?? null,
      reorderPoint: Math.max(0, Math.round(rpValue)),
    };

    const qtyValue = qty ?? qtyOnHand ?? quantity;
    if (qtyValue !== undefined && qtyValue !== null && qtyValue !== '') {
      const numericQty = Number(qtyValue);
      if (Number.isFinite(numericQty)) {
        data.qtyOnHand = Math.max(0, Math.round(numericQty));
      }
    }

    const warehouseNumeric = parseNumber(warehouseId);
    if (warehouseNumeric) {
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseNumeric } });
      if (warehouse) {
        data.warehouse = { connect: { id: warehouseNumeric } };
      }
    } else if (typeof warehouse === 'string' && warehouse.trim()) {
      const trimmed = warehouse.trim();
      const existing = await prisma.warehouse.findFirst({
        where: {
          OR: [
            { code: { equals: trimmed, mode: 'insensitive' } },
            { name: { equals: trimmed, mode: 'insensitive' } },
          ],
        },
      });
      if (existing) {
        data.warehouse = { connect: { id: existing.id } };
      }
    }

    const created = await prisma.inventoryItem.create({
      data,
      include: { warehouse: true },
    });

    res.status(201).json(mapItem(created));
  } catch (error) {
    console.error('[inventory] create failed', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'inventory_create_duplicate_materialNo' });
      }
      if (error.code === 'P2025') {
        return res.status(400).json({ error: 'inventory_create_invalid_warehouse' });
      }
    }
    res.status(500).json({ error: 'inventory_create_failed' });
  }
});

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

    await prisma.inventoryItem.update({
      where: { id },
      data: { isDeleted: true },
    });

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
