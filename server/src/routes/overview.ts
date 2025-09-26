
import { Router } from 'express';
import { format, startOfMonth, subMonths } from 'date-fns';
import { Prisma } from '@prisma/client';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';

export const overviewRouter = Router();

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length ? trimmed : undefined;
}

const STATUS_LABELS = {
  request: {
    open: ['open', 'new', 'pending'],
    approved: ['approved'],
    rejected: ['rejected'],
    onHold: ['hold'],
    closed: ['closed', 'completed'],
  },
  order: {
    open: ['pending', 'open'],
    approved: ['approved'],
    onHold: ['hold'],
    completed: ['completed', 'closed'],
    rejected: ['rejected', 'cancelled', 'canceled'],
  },
} as const;

overviewRouter.get('/kpis', asyncHandler(async (_req, res) => {
  const inventoryItemSelect = Prisma.validator<Prisma.InventoryItemSelect>()({
    qtyOnHand: true,
    reorderPoint: true,
    unitCost: true,
    storeId: true,
    store: { select: { id: true, name: true, code: true } },
  });

  type InventoryItemForKpi = Prisma.InventoryItemGetPayload<{ select: typeof inventoryItemSelect }>;

  const [requests, orders, inventoryItems, vendors, vehicles] = await Promise.all([
    prisma.request.findMany({ select: { status: true, department: true, priority: true } }),
    prisma.order.findMany({
      select: {
        status: true,
        totalValue: true,
        createdAt: true,
        request: { select: { department: true } },
      },
    }),
    prisma.inventoryItem.findMany({
      where: { isDeleted: false },
      select: inventoryItemSelect,
    }) as Promise<InventoryItemForKpi[]>,
    prisma.vendor.findMany({ select: { status: true, createdAt: true } }),
    prisma.vehicle.findMany({ select: { status: true, odometer: true } }),
  ]);

  const requestStatusCounts = {
    New: 0,
    Approved: 0,
    Rejected: 0,
    OnHold: 0,
    Closed: 0,
  } as Record<'New' | 'Approved' | 'Rejected' | 'OnHold' | 'Closed', number>;

  const priorityCounts = { High: 0, Medium: 0, Low: 0 } as Record<'High' | 'Medium' | 'Low', number>;
  const requestsByDeptMap = new Map<string, number>();

  requests.forEach((request) => {
    const status = (request.status ?? '').toLowerCase();
    if (STATUS_LABELS.request.approved.some((token) => status.includes(token))) requestStatusCounts.Approved += 1;
    else if (STATUS_LABELS.request.rejected.some((token) => status.includes(token))) requestStatusCounts.Rejected += 1;
    else if (STATUS_LABELS.request.onHold.some((token) => status.includes(token))) requestStatusCounts.OnHold += 1;
    else if (STATUS_LABELS.request.closed.some((token) => status.includes(token))) requestStatusCounts.Closed += 1;
    else requestStatusCounts.New += 1;

    const priority = (request.priority ?? '').toLowerCase();
    if (priority === 'high') priorityCounts.High += 1;
    else if (priority === 'low') priorityCounts.Low += 1;
    else priorityCounts.Medium += 1;

    const dept = request.department?.trim() || 'Unassigned';
    requestsByDeptMap.set(dept, (requestsByDeptMap.get(dept) ?? 0) + 1);
  });

  const twelveMonthsAgo = subMonths(new Date(), 12);
  const orderStatusCounts = {
    New: 0,
    Approved: 0,
    Rejected: 0,
    OnHold: 0,
    Closed: 0,
  } as Record<'New' | 'Approved' | 'Rejected' | 'OnHold' | 'Closed', number>;
  const monthlyExpenseMap = new Map<string, number>();
  const ordersByCategoryMap = new Map<string, number>();
  let twelveMonthSpend = 0;

  orders.forEach((order) => {
    const status = (order.status ?? '').toLowerCase();
    if (STATUS_LABELS.order.approved.some((token) => status.includes(token))) orderStatusCounts.Approved += 1;
    else if (STATUS_LABELS.order.rejected.some((token) => status.includes(token))) orderStatusCounts.Rejected += 1;
    else if (STATUS_LABELS.order.onHold.some((token) => status.includes(token))) orderStatusCounts.OnHold += 1;
    else if (STATUS_LABELS.order.completed.some((token) => status.includes(token))) orderStatusCounts.Closed += 1;
    else orderStatusCounts.New += 1;

    const amount = typeof order.totalValue === 'number' && Number.isFinite(order.totalValue)
      ? order.totalValue
      : 0;

    const isCompleted = STATUS_LABELS.order.completed.some((token) => status.includes(token));
    if (order.createdAt && isCompleted) {
      const monthKey = format(order.createdAt, 'yyyy-MM');
      monthlyExpenseMap.set(monthKey, (monthlyExpenseMap.get(monthKey) ?? 0) + amount);
      if (order.createdAt >= twelveMonthsAgo) {
        twelveMonthSpend += amount;
      }
    }

    const category = order.request?.department?.trim() || 'Unassigned';
    ordersByCategoryMap.set(category, (ordersByCategoryMap.get(category) ?? 0) + amount);
  });

  const requestsSummary = {
    total: requests.length,
    statusCounts: requestStatusCounts,
    byDepartment: Array.from(requestsByDeptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count),
    priorityCounts,
  };

  const ordersSummary = {
    total: orders.length,
    statusCounts: orderStatusCounts,
    monthlyExpenses: Array.from(monthlyExpenseMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, totalSar]) => ({ month, totalSar })),
    byCategory: Array.from(ordersByCategoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, totalSar]) => ({ category, totalSar })),
  };

  const inventorySummary = (() => {
    let inStockQty = 0;
    let lowStockAlerts = 0;
    let outOfStockSkus = 0;
    let inventoryValueSar = 0;

    const storeTotals = new Map<string, {
      store: string;
      storeId: number | null;
      qty: number;
      value: number;
      lowStock: number;
      outOfStock: number;
    }>();

    inventoryItems.forEach((item) => {
      const qty = item.qtyOnHand ?? 0;
      const reorder = item.reorderPoint ?? 0;
      inStockQty += qty;
      if (qty <= 0) outOfStockSkus += 1;
      else if (reorder > 0 && qty <= reorder) lowStockAlerts += 1;

      const unitCost = typeof item.unitCost === 'number' && Number.isFinite(item.unitCost)
        ? item.unitCost
        : 0;
      if (unitCost > 0 && qty > 0) inventoryValueSar += qty * unitCost;

      const storeLabel = normalizeString(item.store?.name)
        ?? normalizeString(item.store?.code)
        ?? 'Unassigned';
      const key = `${item.storeId ?? 'null'}::${storeLabel?.toLowerCase() ?? 'unassigned'}`;
      const snapshot = storeTotals.get(key) ?? {
        store: storeLabel ?? 'Unassigned',
        storeId: item.storeId ?? null,
        qty: 0,
        value: 0,
        lowStock: 0,
        outOfStock: 0,
      };

      snapshot.qty += qty;
      snapshot.value += unitCost > 0 ? qty * unitCost : 0;
      if (qty <= 0) snapshot.outOfStock += 1;
      else if (reorder > 0 && qty <= reorder) snapshot.lowStock += 1;

      storeTotals.set(key, snapshot);
    });

    const inStockSkus = Math.max(inventoryItems.length - (lowStockAlerts + outOfStockSkus), 0);

    return {
      inStockQty,
      lowStockAlerts,
      outOfStockSkus,
      inventoryValueSar: Math.round(inventoryValueSar),
      stockStatus: [
        { name: 'In Stock', value: inStockSkus },
        { name: 'Low Stock', value: lowStockAlerts },
        { name: 'Out of Stock', value: outOfStockSkus },
      ],
      stores: Array.from(storeTotals.values())
        .map((snapshot) => ({
          storeId: snapshot.storeId,
          store: snapshot.store,
          qty: snapshot.qty,
          value: Math.round(snapshot.value),
          lowStock: snapshot.lowStock,
          outOfStock: snapshot.outOfStock,
        }))
        .sort((a, b) => b.value - a.value),
    };
  })();

  const monthStart = startOfMonth(new Date());
  const vendorsSummary = {
    total: vendors.length,
    active: vendors.filter((vendor) => (vendor.status ?? '').toLowerCase() === 'active').length,
    onHold: vendors.filter((vendor) => (vendor.status ?? '').toLowerCase().includes('hold')).length,
    newThisMonth: vendors.filter((vendor) => vendor.createdAt >= monthStart).length,
    totalSpend: orders
      .filter((order) => (order.status ?? '').toLowerCase().includes('complete'))
      .reduce((sum, order) => sum + (order.totalValue ?? 0), 0),
  };

  const fleetSummary = {
    total: vehicles.length,
    inOperation: vehicles.filter((vehicle) => (vehicle.status ?? '').toLowerCase().includes('active') || (vehicle.status ?? '').toLowerCase().includes('operation')).length,
    underMaintenance: vehicles.filter((vehicle) => (vehicle.status ?? '').toLowerCase().includes('maint')).length,
    totalDistance: vehicles.reduce((sum, vehicle) => sum + (vehicle.odometer ?? 0), 0),
  };

  res.json({
    requests: requestsSummary,
    orders: ordersSummary,
    inventory: inventorySummary,
    vendors: vendorsSummary,
    fleet: fleetSummary,
    twelveMonthSpend,
  });
}));

overviewRouter.get('/orders-by-dept', asyncHandler(async (_req, res) => {
  const completedOrders = await prisma.order.findMany({
    where: { status: { in: ['Completed', 'completed'] } },
    select: {
      totalValue: true,
      request: { select: { department: true } },
    },
  });

  if (!completedOrders.length) {
    res.json({ categories: [], series: [{ name: 'Spend (SAR)', data: [] }] });
    return;
  }

  const totals = completedOrders.reduce<Record<string, number>>((acc, order) => {
    const department = order.request?.department?.trim() || 'Unassigned';
    const amount = typeof order.totalValue === 'number' && Number.isFinite(order.totalValue)
      ? order.totalValue
      : 0;
    acc[department] = (acc[department] ?? 0) + amount;
    return acc;
  }, {});

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const categories = entries.map(([department]) => department);
  const data = entries.map(([, value]) => value);

  res.json({
    categories,
    series: [
      {
        name: 'Spend (SAR)',
        data,
      },
    ],
  });
}));

overviewRouter.get('/stock-movements/monthly', asyncHandler(async (_req, res) => {
  const startPoints: Date[] = [];
  const current = startOfMonth(new Date());
  for (let i = 11; i >= 0; i -= 1) {
    startPoints.push(startOfMonth(subMonths(current, i)));
  }

  const earliest = startPoints[0];

  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: {
        gte: earliest,
      },
    },
    select: {
      qty: true,
      moveType: true,
      createdAt: true,
      valueSar: true,
      store: { select: { name: true, code: true } },
    },
  });

  const buckets = startPoints.map((startDate) => ({
    key: format(startDate, 'yyyy-MM'),
    label: format(startDate, 'MMM'),
    inbound: 0,
    outbound: 0,
    inboundValue: 0,
    outboundValue: 0,
  }));

  const storeTotals = new Map<string, { store: string; inboundValue: number; outboundValue: number }>();

  movements.forEach((movement) => {
    const createdAt = movement.createdAt ?? null;
    if (!createdAt) return;
    const bucketKey = format(startOfMonth(createdAt), 'yyyy-MM');
    const bucket = buckets.find((entry) => entry.key === bucketKey);
    if (!bucket) return;
    const qty = Number(movement.qty ?? 0);
    if (!Number.isFinite(qty)) return;
    const moveType = (movement.moveType ?? '').toUpperCase();
    const rawValue = Number.isFinite(movement.valueSar) ? Number(movement.valueSar) : 0;
    const absValue = Math.abs(rawValue);

    if (moveType === 'IN' || moveType === 'INBOUND') {
      bucket.inbound += qty;
      bucket.inboundValue += absValue;
    } else if (moveType === 'OUT' || moveType === 'OUTBOUND') {
      bucket.outbound += Math.abs(qty);
      bucket.outboundValue += absValue;
    }

    const storeKey = (() => {
      const label = normalizeString(movement.store?.name)
        ?? normalizeString(movement.store?.code)
        ?? 'Unassigned';
      return label;
    })();

    if (storeKey) {
      const entry = storeTotals.get(storeKey) ?? { store: storeKey, inboundValue: 0, outboundValue: 0 };
      if (moveType === 'IN' || moveType === 'INBOUND') {
        entry.inboundValue += absValue;
      } else if (moveType === 'OUT' || moveType === 'OUTBOUND') {
        entry.outboundValue += absValue;
      }
      storeTotals.set(storeKey, entry);
    }
  });

  res.json({
    months: buckets.map((entry) => entry.label),
    inbound: buckets.map((entry) => entry.inbound),
    outbound: buckets.map((entry) => entry.outbound),
    inboundValue: buckets.map((entry) => roundCurrency(entry.inboundValue)),
    outboundValue: buckets.map((entry) => roundCurrency(entry.outboundValue)),
    stores: Array.from(storeTotals.values())
      .map((entry) => ({
        store: entry.store,
        inboundValue: roundCurrency(entry.inboundValue),
        outboundValue: roundCurrency(entry.outboundValue),
      }))
      .sort((a, b) => (b.inboundValue + b.outboundValue) - (a.inboundValue + a.outboundValue))
      .slice(0, 6),
  });
}));
