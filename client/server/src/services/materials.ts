import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

import { HttpError } from '../utils/http';

export type UpsertMaterialParams = {
  materialId?: number;
  name: string;
  code?: string | null | undefined;
};

export type UpsertMaterialResult = {
  material: { id: number; name: string; code: string | null };
  created: boolean;
};

export async function upsertMaterial(
  tx: Prisma.TransactionClient,
  params: UpsertMaterialParams,
): Promise<UpsertMaterialResult> {
  const { materialId, name } = params;
  const codeInput = params.code;
  const normalizedCode = codeInput === undefined ? undefined : codeInput;

  if (materialId) {
    const existing = await tx.material.findUnique({ where: { id: materialId } });
    if (!existing) {
      throw new HttpError(400, 'material_not_found', { details: { materialId } });
    }
    const updateData: Prisma.MaterialUpdateInput = {};
    if (existing.name !== name) updateData.name = name;
    if (codeInput !== undefined) {
      updateData.code = normalizedCode ?? null;
    }
    if (!Object.keys(updateData).length) {
      return { material: existing, created: false };
    }
    const updated = await tx.material.update({ where: { id: existing.id }, data: updateData });
    return { material: updated, created: false };
  }

  const existing = await findMaterialByNameInsensitive(tx, name);
  if (existing) {
    const updateData: Prisma.MaterialUpdateInput = {};
    if (existing.name !== name) updateData.name = name;
    if (codeInput !== undefined) updateData.code = normalizedCode ?? null;
    if (!Object.keys(updateData).length) {
      return { material: existing, created: false };
    }
    const updated = await tx.material.update({ where: { id: existing.id }, data: updateData });
    return { material: updated, created: false };
  }

  const created = await tx.material.create({
    data: {
      name,
      ...(codeInput !== undefined ? { code: normalizedCode ?? null } : {}),
    },
  });
  return { material: created, created: true };
}

export function slugifyMaterialForCode(value: string): string {
  const upper = value.toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned.slice(0, 12) || 'ITEM';
}

export async function ensureUniqueMaterialNo(
  tx: Prisma.TransactionClient,
  base: string,
): Promise<string> {
  const seed = slugifyMaterialForCode(base);
  let attempt = 0;
  while (attempt < 8) {
    const suffix = attempt === 0 ? '' : `-${randomInt(100, 1000)}`;
    const candidate = `${seed}${suffix}`;
    const existing = await tx.inventoryItem.findUnique({ where: { materialNo: candidate } });
    if (!existing) {
      return candidate;
    }
    attempt += 1;
  }
  throw new HttpError(409, 'material_code_conflict');
}

export async function findMaterialByNameInsensitive(
  tx: Prisma.TransactionClient,
  name: string,
) {
  const [match] = await tx.$queryRaw<Array<{ id: number; name: string; code: string | null }>>`
    SELECT id, name, code
    FROM Material
    WHERE LOWER(name) = ${name.toLowerCase()}
    LIMIT 1
  `;
  return match ?? null;
}
