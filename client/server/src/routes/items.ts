import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { ENFORCE_RM_PREFIX, RM_PREFIX_PATTERN } from '../constants';
import { asyncHandler, HttpError } from '../utils/http';
import prisma from '../lib/prisma';
import { ensureUniqueMaterialNo, upsertMaterial } from '../services/materials';
import { normalizeName, sanitizeCode, toNullableString } from '../utils/strings';

export const itemsRouter = Router();

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

itemsRouter.post('/', asyncHandler(async (req, res) => {
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

export default itemsRouter;
