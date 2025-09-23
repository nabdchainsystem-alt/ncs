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

router.get('/items', async (req: Request, res: Response) => {
  try {
    const { search, warehouseId, page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const lowStockOnly = toBoolean(req.query.lowStockOnly);

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Math.min(100, Number(pageSize) || 20));
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

    let where: Prisma.InventoryItemWhereInput = baseWhere;
    if (andClauses.length) {
      where = { AND: [baseWhere, ...andClauses] };
    }

    if (lowStockOnly) {
      const allItems = await prisma.inventoryItem.findMany({
        where,
        include: { warehouse: true },
        orderBy: [{ updatedAt: 'desc' }],
      });
      const filtered = allItems.filter((item) => item.qtyOnHand <= item.reorderPoint);
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
    const { materialNo, name, unit, category, reorderPoint, warehouseId } = req.body ?? {};

    if (!materialNo || typeof materialNo !== 'string') {
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
      materialNo: materialNo.trim(),
      name: name.trim(),
      unit: typeof unit === 'string' ? unit.trim() || null : unit ?? null,
      category: typeof category === 'string' ? (category.trim() || null) : category ?? null,
      reorderPoint: Math.max(0, Math.round(rpValue)),
    };

    const warehouseNumeric = parseNumber(warehouseId);
    if (warehouseNumeric) {
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseNumeric } });
      if (warehouse) {
        data.warehouse = { connect: { id: warehouseNumeric } };
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
