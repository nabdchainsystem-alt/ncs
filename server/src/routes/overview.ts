
import { Router } from 'express';
import { format, startOfMonth, subMonths } from 'date-fns';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';

export const overviewRouter = Router();

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
    prisma.inventoryItem.findMany({ select: { qtyOnHand: true, reorderPoint: true } }),
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

  const inventorySummary = {
    inStockQty: inventoryItems.reduce((sum, item) => sum + (item.qtyOnHand ?? 0), 0),
    lowStockCount: inventoryItems.filter((item) => {
      if (item.reorderPoint == null || item.reorderPoint <= 0) return false;
      const qty = item.qtyOnHand ?? 0;
      return qty > 0 && qty <= item.reorderPoint;
    }).length,
    outOfStockCount: inventoryItems.filter((item) => (item.qtyOnHand ?? 0) <= 0).length,
    inventoryValue: 0,
  };

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
