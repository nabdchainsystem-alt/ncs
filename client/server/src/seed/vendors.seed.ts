import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding vendors…');

  type SeedVendor = {
    code: string;
    name: string;
    status: 'Approved' | 'Pending' | 'On-Hold' | 'Suspended';
    categories: string[];
    regions: string[];
    metrics: {
      onTimePct: number;
      leadTimeAvgDays: number;
      qualityPpm: number;
      priceIndex: number;
      quoteRespHrs: number;
      trustScore: number;
    };
    shipModes: string[];
    docs: { type: string; number: string; expiry: string; valid: boolean }[];
    perf: { month: string; onTimePct: number; qualityPpm: number; disputes: number; quotesCount: number; avgRespHrs: number; trustScore: number }[];
    products: { itemCode: string; price: number; currency?: string; moq?: number; leadTimeDays?: number }[];
  };

  const data: SeedVendor[] = [
    {
      code: 'V-100',
      name: 'Alpha Supplies Co.',
      status: 'Approved',
      categories: ['Mechanical'],
      regions: ['Riyadh'],
      metrics: { onTimePct: 92, leadTimeAvgDays: 12, qualityPpm: 500, priceIndex: 102, quoteRespHrs: 24, trustScore: 85 },
      shipModes: ['Ground', 'Air'],
      docs: [
        { type: 'CR', number: '12345', expiry: '2026-01-01', valid: true },
        { type: 'ISO9001', number: 'ISO-9001-ALPHA', expiry: '2025-12-01', valid: true },
      ],
      perf: [
        { month: '2025-06-01', onTimePct: 90, qualityPpm: 600, disputes: 1, quotesCount: 5, avgRespHrs: 24, trustScore: 82 },
        { month: '2025-07-01', onTimePct: 93, qualityPpm: 400, disputes: 0, quotesCount: 6, avgRespHrs: 20, trustScore: 87 },
      ],
      products: [
        { itemCode: 'ITEM-001', price: 100, currency: 'SAR', moq: 10, leadTimeDays: 7 },
        { itemCode: 'ITEM-003', price: 145, currency: 'SAR', moq: 20, leadTimeDays: 10 },
      ],
    },
    {
      code: 'V-101',
      name: 'Beta Electrics Ltd.',
      status: 'Pending',
      categories: ['Electrical'],
      regions: ['Jeddah'],
      metrics: { onTimePct: 88, leadTimeAvgDays: 20, qualityPpm: 1200, priceIndex: 98, quoteRespHrs: 48, trustScore: 75 },
      shipModes: ['Sea', 'Ground'],
      docs: [
        { type: 'CR', number: '67890', expiry: '2024-11-01', valid: false },
        { type: 'ISO14001', number: 'ISO-14001-BETA', expiry: '2026-04-01', valid: true },
      ],
      perf: [
        { month: '2025-06-01', onTimePct: 85, qualityPpm: 1500, disputes: 2, quotesCount: 3, avgRespHrs: 48, trustScore: 72 },
        { month: '2025-07-01', onTimePct: 89, qualityPpm: 1100, disputes: 1, quotesCount: 4, avgRespHrs: 40, trustScore: 77 },
      ],
      products: [
        { itemCode: 'ITEM-002', price: 200, currency: 'SAR', moq: 5, leadTimeDays: 14 },
        { itemCode: 'ITEM-004', price: 230, currency: 'SAR', moq: 10, leadTimeDays: 21 },
      ],
    },
    {
      code: 'V-102',
      name: 'Gamma Metals KSA',
      status: 'Approved',
      categories: ['Metals'],
      regions: ['Dammam', 'Riyadh'],
      metrics: { onTimePct: 94, leadTimeAvgDays: 9, qualityPpm: 380, priceIndex: 101, quoteRespHrs: 20, trustScore: 88 },
      shipModes: ['Ground'],
      docs: [
        { type: 'CR', number: '55555', expiry: '2027-03-01', valid: true },
        { type: 'ISO9001', number: 'ISO-9001-GAMMA', expiry: '2026-02-01', valid: true },
      ],
      perf: [
        { month: '2025-06-01', onTimePct: 93, qualityPpm: 420, disputes: 0, quotesCount: 7, avgRespHrs: 20, trustScore: 87 },
        { month: '2025-07-01', onTimePct: 95, qualityPpm: 350, disputes: 0, quotesCount: 8, avgRespHrs: 18, trustScore: 90 },
      ],
      products: [
        { itemCode: 'STEEL-PLATE-A36', price: 520, currency: 'SAR', moq: 2, leadTimeDays: 5 },
        { itemCode: 'AL-6061-SHEET', price: 410, currency: 'SAR', moq: 4, leadTimeDays: 6 },
      ],
    },
    {
      code: 'V-103',
      name: 'Delta Logistics',
      status: 'On-Hold',
      categories: ['Logistics'],
      regions: ['Riyadh', 'Jeddah'],
      metrics: { onTimePct: 76, leadTimeAvgDays: 18, qualityPpm: 2100, priceIndex: 105, quoteRespHrs: 60, trustScore: 62 },
      shipModes: ['Air', 'Ground'],
      docs: [
        { type: 'CR', number: '88888', expiry: '2026-06-01', valid: true },
      ],
      perf: [
        { month: '2025-06-01', onTimePct: 74, qualityPpm: 2300, disputes: 3, quotesCount: 4, avgRespHrs: 62, trustScore: 60 },
        { month: '2025-07-01', onTimePct: 78, qualityPpm: 1900, disputes: 2, quotesCount: 5, avgRespHrs: 54, trustScore: 65 },
      ],
      products: [
        { itemCode: 'FREIGHT-GROUND', price: 1.8, currency: 'SAR', moq: 1, leadTimeDays: 2 },
        { itemCode: 'FREIGHT-AIR', price: 6.5, currency: 'SAR', moq: 1, leadTimeDays: 1 },
      ],
    },
  ];

  // Upsert vendors
  const created = [] as { id: number; code: string }[];
  for (const v of data) {
    const vend = await prisma.vendor.upsert({
      where: { code: v.code },
      update: {
        name: v.name,
        status: v.status,
        categoriesJson: JSON.stringify(v.categories),
        regionsJson: JSON.stringify(v.regions),
        onTimePct: v.metrics.onTimePct,
        leadTimeAvgDays: v.metrics.leadTimeAvgDays,
        qualityPpm: v.metrics.qualityPpm,
        priceIndex: v.metrics.priceIndex,
        quoteRespHrs: v.metrics.quoteRespHrs,
        trustScore: v.metrics.trustScore,
        shipModesJson: JSON.stringify(v.shipModes),
      },
      create: {
        code: v.code,
        name: v.name,
        status: v.status,
        categoriesJson: JSON.stringify(v.categories),
        regionsJson: JSON.stringify(v.regions),
        onTimePct: v.metrics.onTimePct,
        leadTimeAvgDays: v.metrics.leadTimeAvgDays,
        qualityPpm: v.metrics.qualityPpm,
        priceIndex: v.metrics.priceIndex,
        quoteRespHrs: v.metrics.quoteRespHrs,
        trustScore: v.metrics.trustScore,
        shipModesJson: JSON.stringify(v.shipModes),
      },
    });
    created.push({ id: vend.id, code: v.code });
  }

  // Seed per-vendor performance, docs, products
  for (const v of data) {
    const id = created.find((x) => x.code === v.code)!.id;

    // performance history (clean then insert)
    await prisma.vendorPerformanceHistory.deleteMany({ where: { vendorId: id } });
    await prisma.vendorPerformanceHistory.createMany({
      data: v.perf.map((p) => ({
        vendorId: id,
        month: new Date(p.month),
        onTimePct: p.onTimePct,
        qualityPpm: p.qualityPpm,
        disputes: p.disputes,
        quotesCount: p.quotesCount,
        avgRespHrs: p.avgRespHrs,
        trustScore: p.trustScore,
      })),
    });

    // documents (clean selected types older than 3y? here just clean all for demo)
    await prisma.vendorDocument.deleteMany({ where: { vendorId: id } });
    await prisma.vendorDocument.createMany({
      data: v.docs.map((d) => ({
        vendorId: id,
        type: d.type,
        number: d.number,
        expiry: new Date(d.expiry),
        valid: d.valid,
      })),
    });

    // products upsert
    for (const p of v.products) {
      await prisma.vendorProduct.upsert({
        where: { vendorId_itemCode: { vendorId: id, itemCode: p.itemCode } },
        update: { price: p.price, currency: p.currency ?? 'SAR', lastQuotedAt: new Date(), moq: p.moq ?? 1, leadTimeDays: p.leadTimeDays ?? 7 },
        create: { vendorId: id, itemCode: p.itemCode, price: p.price, currency: p.currency ?? 'SAR', lastQuotedAt: new Date(), moq: p.moq ?? 1, leadTimeDays: p.leadTimeDays ?? 7 },
      });
    }
  }

  console.log(`Vendors seed completed. Upserted: ${created.length} vendors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });