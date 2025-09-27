import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { z } from 'zod';

import { asyncHandler, HttpError } from '../errors';
import { prisma } from '../prisma';
import { normalizeName, sanitizeCode, toNullableString } from '../utils/strings';

export const storesRouter = Router();

const listQuerySchema = z.object({
  q: z.string().trim().min(1).max(255).optional(),
  activeOnly: z
    .union([
      z.literal('0'),
      z.literal('1'),
      z.literal('true'),
      z.literal('false'),
      z.literal(''),
    ])
    .optional(),
  includeCounts: z.union([z.literal('1'), z.literal('true')]).optional(),
});

const createStoreSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().trim().min(1).max(64).optional(),
  location: z.string().trim().max(160).optional(),
  description: z.string().trim().max(500).optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
});

const updateStoreSchema = createStoreSchema.partial().extend({
  isActive: z.boolean().optional(),
});

type StoreWithCounts = Prisma.StoreGetPayload<{ include: { _count: { select: { warehouses: true; inventory: true } } } }>;

type StoreSummary = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  deletedAt: string | null;
  location: string | null;
  description: string | null;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
  warehouseCount?: number;
  inventoryCount?: number;
};

function mapStore(store: StoreWithCounts): StoreSummary {
  return {
    id: store.id,
    name: store.name,
    code: store.code,
    isActive: store.isActive,
    deletedAt: store.deletedAt ? store.deletedAt.toISOString() : null,
    location: store.location ?? null,
    description: store.description ?? null,
    capacity: store.capacity ?? null,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
    warehouseCount: store._count.warehouses,
    inventoryCount: store._count.inventory,
  };
}

function slugifyStoreCode(value: string): string {
  const upper = value.toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const base = cleaned ? cleaned.slice(0, 12) : 'STORE';
  return base.startsWith('STR-') ? base : `STR-${base}`;
}

async function ensureUniqueStoreCode(code: string, excludeId?: number): Promise<string> {
  const sanitized = code.toUpperCase();
  let attempt = 0;
  while (attempt < 10) {
    const suffix = attempt === 0 ? '' : `-${randomInt(100, 1000)}`;
    const candidate = `${sanitized}${suffix}`;
    const conflict = await prisma.store.findFirst({
      where: {
        code: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!conflict) {
      return candidate;
    }
    attempt += 1;
  }
  throw new HttpError(409, 'store_code_generation_failed');
}

storesRouter.get('/', asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_store_query', { details: parsed.error.flatten() });
  }

  const query = parsed.data;
  const search = query.q;
  const activeOnly = query.activeOnly === undefined
    ? true
    : query.activeOnly === '1' || query.activeOnly === 'true';

  const where: Prisma.StoreWhereInput = {};
  if (activeOnly) {
    where.isActive = true;
    where.deletedAt = null;
  }
  const stores = await prisma.store.findMany({
    where,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    include: {
      _count: { select: { warehouses: true, inventory: true } },
    },
  });

  const filtered = search
    ? stores.filter((store) => {
        const term = search.toLowerCase();
        return (
          store.name.toLowerCase().includes(term)
          || store.code.toLowerCase().includes(term)
          || (store.location ?? '').toLowerCase().includes(term)
        );
      })
    : stores;

  res.json({ items: filtered.map(mapStore) });
}));

storesRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = createStoreSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_store_payload', { details: parsed.error.flatten() });
  }

  const normalizedName = normalizeName(parsed.data.name);
  if (!normalizedName) {
    throw new HttpError(400, 'store_name_required');
  }

  const [existingByName] = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM Store WHERE LOWER(name) = ${normalizedName.toLowerCase()} LIMIT 1
  `;
  if (existingByName) {
    throw new HttpError(409, 'store_name_duplicate');
  }

  const requestedCode = parsed.data.code ? sanitizeCode(parsed.data.code)?.toUpperCase() ?? null : null;
  const baseCode = requestedCode ?? slugifyStoreCode(normalizedName);
  const code = await ensureUniqueStoreCode(baseCode);

  try {
    const store = await prisma.store.create({
      data: {
        name: normalizedName,
        code,
        isActive: true,
        deletedAt: null,
        location: toNullableString(parsed.data.location),
        description: toNullableString(parsed.data.description),
        capacity: parsed.data.capacity ?? null,
      },
      include: { _count: { select: { warehouses: true, inventory: true } } },
    });

    res.status(201).json(mapStore(store));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      const targets = Array.isArray(target)
        ? target
        : typeof target === 'string'
          ? [target]
          : [];
      if (targets.includes('uq_store_name')) {
        throw new HttpError(409, 'store_name_duplicate');
      }
      if (targets.includes('Store_code_key')) {
        throw new HttpError(409, 'store_code_duplicate');
      }
      throw new HttpError(409, 'store_conflict');
    }
    throw error;
  }
}));

storesRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'invalid_store_id');
  }

  const parsed = updateStoreSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_store_payload', { details: parsed.error.flatten() });
  }

  if (!Object.keys(parsed.data).length) {
    throw new HttpError(400, 'store_update_empty');
  }

  const normalizedName = parsed.data.name !== undefined ? normalizeName(parsed.data.name) : undefined;
  if (normalizedName !== undefined && !normalizedName) {
    throw new HttpError(400, 'store_name_required');
  }

  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'store_not_found');
  }

  if (normalizedName && normalizedName.toLowerCase() !== existing.name.toLowerCase()) {
    const [nameConflict] = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM Store WHERE LOWER(name) = ${normalizedName.toLowerCase()} AND id <> ${id} LIMIT 1
    `;
    if (nameConflict) {
      throw new HttpError(409, 'store_name_duplicate');
    }
  }

  const codeInput = parsed.data.code ? sanitizeCode(parsed.data.code)?.toUpperCase() ?? null : undefined;
  let codeToUse: string | null | undefined = undefined;
  if (codeInput !== undefined) {
    codeToUse = codeInput ?? null;
    if (codeToUse) {
      codeToUse = await ensureUniqueStoreCode(codeToUse, id);
    }
  }

  const data: Prisma.StoreUpdateInput = {};
  if (normalizedName !== undefined && normalizedName !== existing.name) data.name = normalizedName;
  if (parsed.data.location !== undefined) data.location = { set: toNullableString(parsed.data.location) };
  if (parsed.data.description !== undefined) data.description = { set: toNullableString(parsed.data.description) };
  if (parsed.data.capacity !== undefined) data.capacity = { set: parsed.data.capacity ?? null };
  if (codeToUse) data.code = codeToUse;
  if (parsed.data.isActive !== undefined) {
    data.isActive = parsed.data.isActive;
    data.deletedAt = { set: parsed.data.isActive ? null : new Date() };
  }

  try {
    if (!Object.keys(data).length) {
      const fresh = await prisma.store.findUnique({
        where: { id },
        include: { _count: { select: { warehouses: true, inventory: true } } },
      });
      if (!fresh) {
        throw new HttpError(404, 'store_not_found');
      }
      res.json(mapStore(fresh));
      return;
    }

    const updated = await prisma.store.update({
      where: { id },
      data,
      include: { _count: { select: { warehouses: true, inventory: true } } },
    });
    res.json(mapStore(updated));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      const targets = Array.isArray(target)
        ? target
        : typeof target === 'string'
          ? [target]
          : [];
      if (targets.includes('uq_store_name')) {
        throw new HttpError(409, 'store_name_duplicate');
      }
      if (targets.includes('Store_code_key')) {
        throw new HttpError(409, 'store_code_duplicate');
      }
      throw new HttpError(409, 'store_conflict');
    }
    throw error;
  }
}));

storesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'invalid_store_id');
  }

  const store = await prisma.store.findUnique({
    where: { id },
    include: { _count: { select: { warehouses: true, inventory: true } } },
  });

  if (!store) {
    throw new HttpError(404, 'store_not_found');
  }

  await prisma.store.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  res.status(204).send();
}));

export default storesRouter;
