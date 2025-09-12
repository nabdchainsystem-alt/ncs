import { PrismaClient, Vendor } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ---------- Trust Score 360 ----------
 * We work on a 0–100 scale for every metric, then apply weights:
 *   OTD (on-time delivery %) .......... 35%
 *   Quality (PPM -> score) ............ 25%
 *   Quote Response Time (hours) ....... 15%
 *   Price Index (distance from 100) ... 15%
 *   Penalty (disputes/NCR/etc) ........ 10% (deduction)
 */

// --- helpers: map raw metrics to 0..100 ---
export function scoreOTD(otd?: number | null): number {
  if (otd == null || isNaN(otd)) return 0;
  return clamp(otd, 0, 100);
}

/**
 * Convert quality PPM (parts per million) to a 0..100 quality score.
 * Lower PPM is better. We use a soft cap so extremely large PPM doesn't dominate.
 */
export function scoreQualityFromPPM(ppm?: number | null, targetPPM = 1000): number {
  if (ppm == null || isNaN(ppm)) return 0;
  // 0 ppm => 100, targetPPM => 0; beyond target, keep at 0
  const ratio = clamp(ppm / Math.max(1, targetPPM), 0, 2); // limit extreme
  const score = 100 - clamp(ratio * 100, 0, 100);
  return round2(score);
}

/**
 * Quote response SLA (hours) to score. 24h -> ~100, 48h -> ~80, 72h -> ~60, >=120 -> ~20.
 */
export function scoreResponseHours(hours?: number | null): number {
  if (hours == null || isNaN(hours)) return 0;
  const h = Math.max(0, hours);
  if (h <= 24) return 100;
  if (h <= 48) return 80;
  if (h <= 72) return 60;
  if (h <= 96) return 40;
  if (h <= 120) return 20;
  return 10;
}

/**
 * Price index: 100 is market baseline (best). The further from 100, the lower the score.
 */
export function scorePriceIndex(idx?: number | null): number {
  if (idx == null || isNaN(idx)) return 0;
  const delta = Math.abs(idx - 100); // 0 => best
  const score = 100 - clamp(delta, 0, 100);
  return round2(score);
}

/** Deduct penalty percentage from 0..100 (e.g., 0 = none, 100 = max) to 0..100 points. */
export function scorePenalty(pct?: number | null): number {
  if (pct == null || isNaN(pct)) return 0;
  return clamp(pct, 0, 100);
}

export interface TrustScoreInputs {
  onTimePct?: number | null;
  qualityPpm?: number | null;
  quoteRespHrs?: number | null;
  priceIndex?: number | null;
  penaltyPct?: number | null; // derived from disputes/NCR/etc.
}

/** Normalize a Vendor row into TrustScoreInputs (handles missing/undefined gracefully). */
export function normalizeVendor(v: Vendor | null | undefined): TrustScoreInputs {
  return {
    onTimePct: v?.onTimePct ?? null,
    qualityPpm: v?.qualityPpm ?? null,
    quoteRespHrs: v?.quoteRespHrs ?? null,
    priceIndex: v?.priceIndex ?? null,
    // penaltyPct derived separately (disputes/NCR/docs). Keep null here.
    penaltyPct: null,
  };
}

export function computeTrustScore(inputs: TrustScoreInputs): number {
  const otd = scoreOTD(inputs.onTimePct);
  const quality = scoreQualityFromPPM(inputs.qualityPpm);
  const resp = scoreResponseHours(inputs.quoteRespHrs);
  const price = scorePriceIndex(inputs.priceIndex);
  const penalty = scorePenalty(inputs.penaltyPct);

  // Weighted sum. Penalty deducts from the 10% bucket.
  const score = 0.35 * otd + 0.25 * quality + 0.15 * resp + 0.15 * price + 0.10 * (100 - penalty);
  return round2(clamp(score, 0, 100));
}

// --------- recompute services ---------
export async function recomputeVendorScore(id: number): Promise<number> {
  const v = await prisma.vendor.findUnique({ where: { id } });
  if (!v) throw new Error('vendor_not_found');
  const penaltyPct = await derivePenaltyPct(v);
  const base = normalizeVendor(v);
  const score = computeTrustScore({ ...base, penaltyPct });
  await prisma.vendor.update({ where: { id: v.id }, data: { trustScore: score } });
  return score;
}

export async function recomputeAll(): Promise<{ updated: number }> {
  const list = await prisma.vendor.findMany();
  const ops = list.map(async (v) => {
    const penaltyPct = await derivePenaltyPct(v);
    const base = normalizeVendor(v);
    const score = computeTrustScore({ ...base, penaltyPct });
    await prisma.vendor.update({ where: { id: v.id }, data: { trustScore: score } });
  });
  await Promise.all(ops);
  return { updated: list.length };
}

// Optionally derive penalty based on vendor performance history / documents
async function derivePenaltyPct(v: Vendor): Promise<number> {
  // Example heuristic: missing/expired compliance docs -> +20 penalty; low OTD -> +10; very high PPM -> +20
  let penalty = 0;
  const soon = new Date();
  soon.setMonth(soon.getMonth() + 1);

  const expiringCount = await prisma.vendorDocument.count({
    where: { vendorId: v.id, OR: [{ expiry: { lte: soon } }, { valid: false }] },
  });
  if (expiringCount > 0) penalty += 20;
  if ((v.onTimePct ?? 100) < 80) penalty += 10;
  if ((v.qualityPpm ?? 0) > 3000) penalty += 20;

  return clamp(penalty, 0, 100);
}

// --- utils ---
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}