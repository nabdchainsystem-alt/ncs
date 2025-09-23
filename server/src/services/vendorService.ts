import { prisma } from '../prisma';

function buildVendorCode(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  if (base.length === 0) {
    return `VENDOR-${Date.now()}`;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function upsertVendorByName(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const existing = await prisma.vendor.findFirst({ where: { name: trimmed } });
  if (existing) return existing;

  return prisma.vendor.create({
    data: {
      name: trimmed,
      code: buildVendorCode(trimmed),
      categoriesJson: JSON.stringify(['Uncategorized']),
      status: 'Active',
    },
  });
}
