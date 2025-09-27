import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { ENFORCE_RM_PREFIX, MATERIAL_SUGGESTION_DEFAULT_LIMIT, MATERIAL_SUGGESTION_MAX_LIMIT, RM_PREFIX_PATTERN } from '../constants';
import { asyncHandler, HttpError } from '../errors';
import { prisma } from '../prisma';
import { normalizeName, sanitizeCode } from '../utils/strings';
import { findMaterialByNameInsensitive } from '../services/materials';

export const materialsRouter = Router();

const suggestionQuerySchema = z.object({
  prefix: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().positive().max(MATERIAL_SUGGESTION_MAX_LIMIT).optional(),
});

materialsRouter.get('/', asyncHandler(async (req, res) => {
  const parsed = suggestionQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_material_query', { details: parsed.error.flatten() });
  }

  const { prefix, limit } = parsed.data;
  const take = limit ?? MATERIAL_SUGGESTION_DEFAULT_LIMIT;
  const prefixLower = prefix?.toLowerCase().trim() ?? '';

  const sampleSize = prefixLower ? Math.min(take * 5, MATERIAL_SUGGESTION_MAX_LIMIT) : take;
  const candidates = await prisma.material.findMany({
    orderBy: { name: 'asc' },
    take: sampleSize,
  });

  const filtered = prefixLower
    ? candidates.filter((material) => material.name.toLowerCase().startsWith(prefixLower))
    : candidates;

  res.json({
    items: filtered.slice(0, take).map((material) => ({
      id: material.id,
      name: material.name,
      code: material.code ?? null,
    })),
  });
}));

const upsertSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.union([z.string().trim().max(64), z.null()]).optional(),
});

materialsRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_material_payload', { details: parsed.error.flatten() });
  }

  const normalizedName = normalizeName(parsed.data.name);
  if (!normalizedName) {
    throw new HttpError(400, 'material_name_required');
  }
  if (ENFORCE_RM_PREFIX && !RM_PREFIX_PATTERN.test(normalizedName)) {
    throw new HttpError(422, 'material_prefix_required');
  }

  const canonicalName = normalizedName.toLowerCase().startsWith('rm')
    ? `RM${normalizedName.slice(2)}`
    : normalizedName;

  const normalizedCode = parsed.data.code === undefined
    ? undefined
    : sanitizeCode(parsed.data.code);

  try {
    let created = false;
    const material = await prisma.$transaction(async (tx) => {
      const existing = await findMaterialByNameInsensitive(tx, canonicalName);

      if (existing) {
        const updateData: Prisma.MaterialUpdateInput = {};
        if (existing.name !== canonicalName) {
          updateData.name = canonicalName;
        }
        if (parsed.data.code !== undefined) {
          updateData.code = normalizedCode ?? null;
        }
        if (!Object.keys(updateData).length) {
          return existing;
        }
        return tx.material.update({
          where: { id: existing.id },
          data: updateData,
        });
      }

      const createData: Prisma.MaterialCreateInput = { name: canonicalName };
      if (parsed.data.code !== undefined) {
        createData.code = normalizedCode ?? null;
      }
      created = true;
      return tx.material.create({ data: createData });
    });

    res.status(created ? 201 : 200).json({
      id: material.id,
      name: material.name,
      code: material.code ?? null,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      const targets = Array.isArray(target)
        ? target
        : typeof target === 'string'
          ? [target]
          : [];
      if (targets.includes('uq_material_name')) {
        throw new HttpError(409, 'material_name_duplicate');
      }
      if (targets.includes('uq_material_code')) {
        throw new HttpError(409, 'material_code_duplicate');
      }
      throw new HttpError(409, 'material_duplicate');
    }
    throw error;
  }
}));

export default materialsRouter;
