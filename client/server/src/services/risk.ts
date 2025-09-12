import { PrismaClient, Vendor } from '@prisma/client';

const prisma = new PrismaClient();

export type RiskAlert =
  | 'LOW_OTD'
  | 'HIGH_LEAD_TIME'
  | 'HIGH_PPM'
  | 'EXPIRING_DOCS'
  | 'AIR_FREIGHT_HEAVY'
  | 'SINGLE_SOURCE_RISK';

export interface VendorRisk {
  id: number;
  name: string;
  code: string;
  riskScore: number; // 0..100 (higher = riskier)
  alerts: RiskAlert[];
  factors: {
    otd: number; // 0..100 On-time%
    leadDays: number; // avg days
    ppm: number; // defects ppm
    docsExpiring: number; // count within 30d
    airBias: number; // 0..100 share of air usage (heuristic)
    singleSource: number; // 0..100 (100 = single-source confirmed)
    seasonal: number; // 0..100 seasonality factor for next month
  };
}

/**
 * Main entry: assess all vendors for next-month delay risk.
 * Risk is a weighted blend of recent performance + compliance + seasonality + logistics.
 */
export async function assessVendorsRisk(): Promise<VendorRisk[]> {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });

  // Preload supporting data
  const soon = addDays(new Date(), 30);
  const docs = await prisma.vendorDocument.groupBy({
    by: ['vendorId'],
    _count: { _all: true },
    where: { OR: [{ expiry: { lte: soon } }, { valid: false }] },
  });
  const expiringMap = new Map<number, number>(docs.map((d) => [d.vendorId, d._count._all]));

  // Perf history last 3 months for seasonality proxy
  const from = addMonths(startOfMonth(new Date()), -3);
  const hist = await prisma.vendorPerformanceHistory.findMany({
    where: { month: { gte: from } },
  });
  const histByVendor = new Map<number, typeof hist>();
  for (const row of hist) {
    const arr = histByVendor.get(row.vendorId) || [];
    arr.push(row);
    histByVendor.set(row.vendorId, arr);
  }

  // Detect single-source risk heuristically by product catalog overlap
  const prods = await prisma.vendorProduct.findMany();
  const byItem = new Map<string, number[]>();
  for (const p of prods) {
    const arr = byItem.get(p.itemCode) || [];
    arr.push(p.vendorId);
    byItem.set(p.itemCode, arr);
  }
  const singleSourceMap = new Map<number, number>();
  for (const [_, vIds] of byItem) {
    if (vIds.length === 1) {
      singleSourceMap.set(vIds[0], (singleSourceMap.get(vIds[0]) || 0) + 1);
    }
  }

  const results: VendorRisk[] = vendors.map((v) => {
    const otd = clamp(v.onTimePct ?? 100, 0, 100);
    const leadDays = v.leadTimeAvgDays ?? 0;
    const ppm = v.qualityPpm ?? 0;
    const docsExpiring = expiringMap.get(v.id) || 0;
    const airBias = inferAirBias(v) * 100; // 0..100
    const seasonal = inferSeasonalFactor(histByVendor.get(v.id)); // 0..100
    const singleSource = normalizeSingleSource(singleSourceMap.get(v.id) || 0); // 0..100

    const alerts: RiskAlert[] = [];
    if (otd < 80) alerts.push('LOW_OTD');
    if (leadDays > 30) alerts.push('HIGH_LEAD_TIME');
    if (ppm > 3000) alerts.push('HIGH_PPM');
    if (docsExpiring > 0) alerts.push('EXPIRING_DOCS');
    if (airBias > 50) alerts.push('AIR_FREIGHT_HEAVY');
    if (singleSource >= 80) alerts.push('SINGLE_SOURCE_RISK');

    // Compute final risk score (0..100). Higher = riskier.
    // Weights: OTD 30% (inverse), Lead 20%, Quality 15%, Docs 10%, Air 10%, SingleSource 5%, Seasonality 10%.
    const invOTD = 100 - otd; // lower OTD => higher risk
    const leadScore = scale(leadDays, 0, 60); // 0..100 over 0..60 days
    const qualityScore = scale(ppm, 0, 6000); // 0..100 over 0..6000 ppm
    const docsScore = clamp(docsExpiring * 20, 0, 100); // 1 doc => +20 up to 100
    const airScore = clamp(airBias, 0, 100);
    const singleScore = clamp(singleSource, 0, 100);
    const seasonalScore = clamp(seasonal, 0, 100);

    const riskScore =
      0.30 * invOTD +
      0.20 * leadScore +
      0.15 * qualityScore +
      0.10 * docsScore +
      0.10 * airScore +
      0.05 * singleScore +
      0.10 * seasonalScore;

    return {
      id: v.id,
      name: v.name,
      code: v.code,
      riskScore: round2(riskScore),
      alerts,
      factors: { otd, leadDays, ppm, docsExpiring, airBias, singleSource, seasonal },
    };
  });

  // Sort descending by risk
  results.sort((a, b) => b.riskScore - a.riskScore);
  return results;
}

// ---- heuristics helpers ----
function inferAirBias(v: Vendor): number {
  try {
    const arr: string[] = JSON.parse(v.shipModesJson || '[]');
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const air = arr.filter((m) => /air/i.test(m)).length;
    return air / arr.length;
  } catch {
    return 0;
  }
}

function inferSeasonalFactor(rows?: { month: Date; onTimePct: number | null }[]): number {
  if (!rows || rows.length === 0) return seasonalityForNextMonth();
  // lower OTD recently -> increase seasonal risk baseline
  const avgOTD = rows.reduce((s, r) => s + (r.onTimePct ?? 100), 0) / rows.length;
  const base = seasonalityForNextMonth();
  const adj = clamp((100 - avgOTD) * 0.5, 0, 30); // add up to +30 based on recent low OTD
  return clamp(base + adj, 0, 100);
}

function seasonalityForNextMonth(date = new Date()): number {
  const next = addMonths(date, 1);
  const m = next.getMonth() + 1; // 1..12
  // Example KSA seasonality (heuristic):
  // Ramadan/Hajj/Year-end logistics pressure raise risk.
  // (You may replace with live calendar later.)
  const high = [3, 4, 5, 6, 12]; // Mar–Jun, Dec
  const med = [1, 2, 7, 8];
  if (high.includes(m)) return 70;
  if (med.includes(m)) return 40;
  return 20;
}

function normalizeSingleSource(count: number): number {
  // 0 items single-sourced => 0; 5+ => ~100 (cap)
  return clamp(count * 20, 0, 100);
}

// ---- utils ----
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function addMonths(d: Date, m: number) { const c = new Date(d); c.setMonth(c.getMonth() + m); return c; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d: Date, days: number) { const c = new Date(d); c.setDate(c.getDate() + days); return c; }
function scale(v: number, min: number, max: number) {
  const cl = clamp(v, min, max);
  return ((cl - min) / (max - min)) * 100;
}

/**
 * Predictive risk forecast for vendor delays in the coming month.
 * Uses assessVendorsRisk and may be extended later.
 */
export async function predictNextMonthRisks() {
  const assessed = await assessVendorsRisk();
  return assessed.map(r => ({
    id: r.id,
    name: r.name,
    code: r.code,
    riskScore: r.riskScore,
    alerts: r.alerts,
    factors: r.factors,
    forecastMonth: addMonths(new Date(), 1),
  }));
}