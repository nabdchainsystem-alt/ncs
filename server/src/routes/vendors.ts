import { Router } from 'express';
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from 'date-fns';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';

export const vendorsRouter = Router();

const monthLabels = Array.from({ length: 12 }, (_value, index) => format(new Date(2000, index, 1), 'MMM'));

function classifyTier(trustScore?: number | null): 'Performing' | 'Watchlist' | 'Critical' | 'Other' {
  if (typeof trustScore !== 'number' || Number.isNaN(trustScore)) return 'Other';
  if (trustScore >= 80) return 'Performing';
  if (trustScore >= 60) return 'Watchlist';
  if (trustScore > 0) return 'Critical';
  return 'Other';
}

vendorsRouter.get('/', asyncHandler(async (_req, res) => {
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      categoriesJson: true,
      createdAt: true,
      trustScore: true,
    },
  });

  const normalized = vendors.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    status: vendor.status,
    trustScore: vendor.trustScore,
    category: (() => {
      if (!vendor.categoriesJson) return 'Uncategorized';
      try {
        const parsed = JSON.parse(vendor.categoriesJson) as string[];
        return parsed?.[0] ?? 'Uncategorized';
      } catch {
        return 'Uncategorized';
      }
    })(),
    createdAt: vendor.createdAt,
  }));

  res.json(normalized);
}));

vendorsRouter.get('/kpis', asyncHandler(async (_req, res) => {
  const [vendors, orders] = await Promise.all([
    prisma.vendor.findMany({ select: { id: true, status: true, createdAt: true, trustScore: true } }),
    prisma.order.findMany({ where: { status: { in: ['Completed', 'completed'] } }, select: { totalValue: true } }),
  ]);

  const monthStart = startOfMonth(new Date());

  const active = vendors.filter((vendor) => (vendor.status ?? '').toLowerCase() === 'active').length;
  const newThisMonth = vendors.filter((vendor) => vendor.createdAt >= monthStart).length;
  const trustScores = vendors
    .map((vendor) => vendor.trustScore)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const avgTrustScore = trustScores.length
    ? trustScores.reduce((sum, value) => sum + value, 0) / trustScores.length
    : 0;
  const totalSpend = orders.reduce((sum, order) => sum + (order.totalValue ?? 0), 0);

  res.json({ active, newThisMonth, avgTrustScore, totalSpend });
}));

vendorsRouter.get('/analytics/monthly-spend', asyncHandler(async (req, res) => {
  const yearParam = req.query.year ? Number(req.query.year) : undefined;
  const now = new Date();
  const year = Number.isFinite(yearParam) ? yearParam! : now.getFullYear();

  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['Completed', 'completed'] },
      createdAt: { gte: start, lte: end },
    },
    select: { totalValue: true, createdAt: true },
  });

  const monthlyTotals = Array(12).fill(0);
  orders.forEach((order) => {
    const monthIndex = new Date(order.createdAt).getMonth();
    const amount = typeof order.totalValue === 'number' && Number.isFinite(order.totalValue)
      ? order.totalValue
      : 0;
    monthlyTotals[monthIndex] += amount;
  });

  res.json({
    categories: monthLabels,
    series: [{ name: 'Spend (SAR)', data: monthlyTotals }],
  });
}));

vendorsRouter.get('/analytics/top-spend', asyncHandler(async (req, res) => {
  const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam!, 50)) : 10;
  const period = (req.query.period as string) ?? 'monthly';

  const now = new Date();
  const start = period === 'yearly' ? startOfYear(now) : startOfMonth(now);
  const end = period === 'yearly' ? endOfYear(now) : endOfMonth(now);

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['Completed', 'completed'] },
      createdAt: { gte: start, lte: end },
    },
    select: {
      totalValue: true,
      vendor: { select: { id: true, name: true } },
    },
  });

  const totals = orders.reduce<Record<string, number>>((acc, order) => {
    const vendorName = order.vendor?.name ?? 'Unknown Vendor';
    const amount = typeof order.totalValue === 'number' && Number.isFinite(order.totalValue)
      ? order.totalValue
      : 0;
    acc[vendorName] = (acc[vendorName] ?? 0) + amount;
    return acc;
  }, {});

  const response = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));

  res.json(response);
}));

vendorsRouter.get('/analytics/status-mix', asyncHandler(async (_req, res) => {
  const vendors = await prisma.vendor.findMany({ select: { trustScore: true } });

  const tally: Record<'Performing' | 'Watchlist' | 'Critical' | 'Other', number> = {
    Performing: 0,
    Watchlist: 0,
    Critical: 0,
    Other: 0,
  };

  vendors.forEach((vendor) => {
    const tier = classifyTier(vendor.trustScore);
    tally[tier] += 1;
  });

  res.json([
    { name: 'Performing', value: tally.Performing },
    { name: 'Watchlist', value: tally.Watchlist },
    { name: 'Critical', value: tally.Critical },
    { name: 'Other', value: tally.Other },
  ]);
}));
