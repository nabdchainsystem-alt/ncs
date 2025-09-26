import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';

type StoreWithMeta = Prisma.StoreGetPayload<{ include: { warehouses: { select: { id: true; name: true; code: true } }; _count: { select: { warehouses: true; inventory: true } } } }>;

export const storesRouter = Router();

const upsertStoreSchema = z.object({
  code: z.string().trim().min(1, 'code_required').max(64),
  name: z.string().trim().min(1, 'name_required').max(120),
  location: z.string().trim().max(160).optional(),
  description: z.string().trim().max(500).optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
});

const updateStoreSchema = upsertStoreSchema.partial().extend({
  code: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(120).optional(),
});

storesRouter.get('/', asyncHandler(async (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const stores: StoreWithMeta[] = await prisma.store.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { location: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: 'asc' },
    include: {
      warehouses: { select: { id: true, name: true, code: true } },
      _count: { select: { warehouses: true, inventory: true } },
    },
  });

  res.json(stores.map((store) => ({
    id: store.id,
    code: store.code,
    name: store.name,
    location: store.location ?? null,
    description: store.description ?? null,
    capacity: store.capacity ?? null,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
    warehouseCount: store._count.warehouses,
    inventoryCount: store._count.inventory,
    warehouses: store.warehouses,
  })));
}));

storesRouter.post('/', asyncHandler(async (req, res) => {
  const payload = upsertStoreSchema.parse(req.body ?? {});

  const data = {
    code: payload.code.trim(),
    name: payload.name.trim(),
    location: payload.location?.trim() || null,
    description: payload.description?.trim() || null,
    capacity: payload.capacity ?? null,
  };

  try {
    const created = await prisma.store.create({ data });
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'store_code_duplicate' });
      return;
    }
    throw error;
  }
}));

storesRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid_store_id' });
    return;
  }

  const payload = updateStoreSchema.parse(req.body ?? {});
  const data: Record<string, unknown> = {};

  if (payload.code !== undefined) data.code = payload.code.trim();
  if (payload.name !== undefined) data.name = payload.name.trim();
  if (payload.location !== undefined) data.location = payload.location.trim() || null;
  if (payload.description !== undefined) data.description = payload.description.trim() || null;
  if (payload.capacity !== undefined) data.capacity = payload.capacity;

  try {
    const updated = await prisma.store.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'store_not_found' });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'store_code_duplicate' });
      return;
    }
    throw error;
  }
}));

storesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid_store_id' });
    return;
  }

  const store = await prisma.store.findUnique({
    where: { id },
    include: { _count: { select: { warehouses: true, inventory: true } } },
  });

  if (!store) {
    res.status(404).json({ error: 'store_not_found' });
    return;
  }

  if (store._count.warehouses > 0 || store._count.inventory > 0) {
    res.status(400).json({ error: 'store_in_use' });
    return;
  }

  await prisma.store.delete({ where: { id } });
  res.status(204).send();
}));

export default storesRouter;
