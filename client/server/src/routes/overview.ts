console.log('>> overview router LOADED @', new Date().toISOString());
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';

type OverviewStatusKey = 'New' | 'Approved' | 'Rejected' | 'OnHold' | 'Closed';

type StoredPurchaseOrder = {
  status?: string | null;
  completed?: boolean | null;
  poDate?: string | null;
  totalAmountSar?: number | null;
  department?: string | null;
  category?: string | null;
  isDeleted?: boolean | null;
  createdAt?: string | null;
};

type PurchaseOrderStore = {
  purchaseOrders?: StoredPurchaseOrder[];
};

const STATUS_KEYS: OverviewStatusKey[] = ['New', 'Approved', 'Rejected', 'OnHold', 'Closed'];

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(SERVER_ROOT, 'tmp');
const STORE_PATH = path.join(DATA_DIR, 'rfq-orders.json');

const router = Router();

const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

function loadPurchaseOrders(): StoredPurchaseOrder[] {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as PurchaseOrderStore;
    if (!parsed || !Array.isArray(parsed.purchaseOrders)) {
      return [];
    }
    return parsed.purchaseOrders;
  } catch (error) {
    console.warn('[overview] Failed to read purchase order store', error);
    return [];
  }
}

function toStatusKey(raw?: string | null, fallback?: string | null): OverviewStatusKey {
  const value = String(raw ?? fallback ?? '')
    .trim()
    .toLowerCase();
  if (['closed', 'done', 'fulfilled', 'completed'].includes(value)) return 'Closed';
  if (['approved', 'approve', 'accepted'].includes(value)) return 'Approved';
  if (['rejected', 'reject', 'declined', 'cancelled', 'canceled'].includes(value))
    return 'Rejected';
  if (['on hold', 'onhold', 'hold'].includes(value)) return 'OnHold';
  return 'New';
}

function toOrderStatusKey(raw?: string | null): OverviewStatusKey {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (['closed', 'completed', 'done'].includes(value)) return 'Closed';
  if (['approved', 'in progress'].includes(value)) return 'Approved';
  if (['rejected', 'declined'].includes(value)) return 'Rejected';
  if (['onhold', 'on hold'].includes(value)) return 'OnHold';
  if (['cancelled', 'canceled'].includes(value)) return 'Closed';
  if (['open'].includes(value)) return 'New';
  return 'New';
}

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let offset = 11; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1));
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    months.push(monthKey);
  }
  return months;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

router.get(
  '/requests',
  ah(async (_req, res) => {
    console.debug('[overview] GET /requests');
    try {
      const requests = await prisma.request.findMany({
        where: { NOT: { status: 'Deleted' } },
        select: { status: true, approval: true, department: true },
      });

      const statusCounts: Record<OverviewStatusKey, number> = {
        New: 0,
        Approved: 0,
        Rejected: 0,
        OnHold: 0,
        Closed: 0,
      };
      const departmentCounts = new Map<string, number>();

      for (const request of requests) {
        const statusKey = toStatusKey(request.status, request.approval);
        statusCounts[statusKey] += 1;

        const department = String(request.department ?? '').trim() || 'Unassigned';
        departmentCounts.set(department, (departmentCounts.get(department) ?? 0) + 1);
      }

      const byDepartment = Array.from(departmentCounts.entries())
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count);

      res.json({
        total: requests.length,
        statusCounts,
        byDepartment,
      });
    } catch (error) {
      console.error('[overview] GET /requests failed', error);
      res.status(500).json({ error: 'overview_requests_failed' });
    }
  })
);

router.get(
  '/orders',
  ah(async (_req, res) => {
    console.debug('[overview] GET /orders');
    try {
      const purchaseOrders = loadPurchaseOrders().filter((po) => !po.isDeleted);

      const statusCounts: Record<OverviewStatusKey, number> = {
        New: 0,
        Approved: 0,
        Rejected: 0,
        OnHold: 0,
        Closed: 0,
      };
      const categoryTotals = new Map<string, number>();

      const months = getLast12Months();
      const monthlyTotals = new Map<string, number>(months.map((month) => [month, 0]));

      for (const order of purchaseOrders) {
        const statusKey = toOrderStatusKey(order.status);
        statusCounts[statusKey] += 1;

        const rawCategory = typeof order.category === 'string' ? order.category.trim() : '';
        // Fallback to department when category is absent to keep breakdowns populated.
        const category =
          rawCategory ||
          (typeof order.department === 'string' && order.department.trim()
            ? order.department.trim()
            : 'Unassigned');
        const amount = Number(order.totalAmountSar ?? 0) || 0;
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);

        if (order.completed) {
          const candidate = parseDate(order.poDate) ?? parseDate(order.createdAt);
          if (candidate) {
            const key = `${candidate.getUTCFullYear()}-${String(candidate.getUTCMonth() + 1).padStart(2, '0')}`;
            if (monthlyTotals.has(key)) {
              monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + amount);
            }
          }
        }
      }

      const monthlyExpenses = months.map((month) => ({
        month,
        totalSar: Math.round((monthlyTotals.get(month) ?? 0) * 100) / 100,
      }));

      const byCategory = Array.from(categoryTotals.entries())
        .map(([category, total]) => ({ category, totalSar: Math.round(total * 100) / 100 }))
        .sort((a, b) => b.totalSar - a.totalSar);

      res.json({
        total: purchaseOrders.length,
        statusCounts,
        monthlyExpenses,
        byCategory,
      });
    } catch (error) {
      console.error('[overview] GET /orders failed', error);
      res.status(500).json({ error: 'overview_orders_failed' });
    }
  })
);

// GET /kpis — Overview KPIs for dashboard
router.get(
  '/kpis',
  ah(async (_req, res) => {
    console.debug('[overview] GET /kpis');
    try {
      // Requests summary (from Prisma, like /requests)
      const requests = await prisma.request.findMany({
        where: { NOT: { status: 'Deleted' } },
        select: { status: true, approval: true, department: true, priority: true },
      });
      const reqStatusCounts: Record<OverviewStatusKey, number> = {
        New: 0,
        Approved: 0,
        Rejected: 0,
        OnHold: 0,
        Closed: 0,
      };
      const reqDepartmentCounts: Record<string, number> = {};
      const reqPriorityCounts: Record<string, number> = {
        High: 0,
        Normal: 0,
        Low: 0,
        Unspecified: 0,
      };
      for (const request of requests) {
        const statusKey = toStatusKey(request.status, request.approval);
        reqStatusCounts[statusKey] += 1;
        const department = String(request.department ?? '').trim() || 'Unassigned';
        reqDepartmentCounts[department] = (reqDepartmentCounts[department] ?? 0) + 1;
        const priorityRaw = String(request.priority ?? '').trim().toLowerCase();
        let priorityBucket: string;
        if (priorityRaw === 'high' || priorityRaw === 'urgent') priorityBucket = 'High';
        else if (priorityRaw === 'low') priorityBucket = 'Low';
        else if (priorityRaw === 'normal' || priorityRaw === 'medium') priorityBucket = 'Normal';
        else priorityBucket = 'Unspecified';
        reqPriorityCounts[priorityBucket] = (reqPriorityCounts[priorityBucket] ?? 0) + 1;
      }

      // Orders summary (from JSON store, like /orders)
      const purchaseOrders = loadPurchaseOrders().filter((po) => !po.isDeleted);
      const ordStatusCounts: Record<OverviewStatusKey, number> = {
        New: 0,
        Approved: 0,
        Rejected: 0,
        OnHold: 0,
        Closed: 0,
      };
      let twelveMonthSpend = 0;
      const monthKeys = new Set(getLast12Months());
      const categoryTotals = new Map<string, number>();
      for (const order of purchaseOrders) {
        const statusKey = toOrderStatusKey(order.status);
        ordStatusCounts[statusKey] += 1;
        const amount = Number(order.totalAmountSar ?? 0) || 0;
        const rawCategory = typeof order.category === 'string' ? order.category.trim() : '';
        const category = rawCategory || (typeof order.department === 'string' && order.department.trim()
          ? order.department.trim()
          : 'Unassigned');
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);

        if (order.completed) {
          const candidate = parseDate(order.poDate) ?? parseDate(order.createdAt);
          if (candidate) {
            const key = `${candidate.getUTCFullYear()}-${String(candidate.getUTCMonth() + 1).padStart(2, '0')}`;
            if (monthKeys.has(key)) {
              twelveMonthSpend += amount;
            }
          }
        }
      }
      twelveMonthSpend = Math.round(twelveMonthSpend * 100) / 100;

      // Placeholder inventory, vendors, fleet data
      const inventory = {
        inStockQty: 0,
        lowStockAlerts: 0,
        outOfStockSkus: 0,
      };
      const vendors = {
        active: 0,
        newThisMonth: 0,
        avgTrustScore: 0,
        totalSpend: 0,
      };
      const fleet = {
        total: 0,
        inOperation: 0,
        underMaintenance: 0,
        odometerSum: 0,
      };

      const requestStatusEntries = STATUS_KEYS.map((name) => ({ name, value: reqStatusCounts[name] }))
        .sort((a, b) => b.value - a.value);
      const requestDeptEntries = Object.entries(reqDepartmentCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      const requestPriorityEntries = Object.entries(reqPriorityCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const orderStatusEntries = STATUS_KEYS.map((name) => ({ name, value: ordStatusCounts[name] }))
        .sort((a, b) => b.value - a.value);

      const ordersByCategory = Array.from(categoryTotals.entries())
        .map(([category, totalSar]) => ({ category, totalSar: Math.round(totalSar * 100) / 100 }))
        .sort((a, b) => b.totalSar - a.totalSar);

      res.json({
        requests: {
          total: requests.length,
          statusCounts: requestStatusEntries,
          byDepartment: requestDeptEntries,
          priorityCounts: requestPriorityEntries,
        },
        orders: {
          total: purchaseOrders.length,
          statusCounts: orderStatusEntries,
          twelveMonthSpend,
          monthlyExpenses: [],
          byCategory: ordersByCategory,
        },
        inventory,
        vendors,
        fleet,
      });
    } catch (error) {
      console.error('[overview] GET /kpis failed', error);
      res.status(500).json({ error: 'overview_kpis_failed' });
    }
  })
);

// GET /orders-by-dept — Completed PO spend by department (chart-ready)
router.get(
  '/orders-by-dept',
  ah(async (_req, res) => {
    console.debug('[overview] GET /orders-by-dept');
    try {
      const purchaseOrders = loadPurchaseOrders().filter((po) => !po.isDeleted && po.completed);
      const deptTotals = new Map<string, number>();
      for (const po of purchaseOrders) {
        const department = String(po.department ?? '').trim() || 'Unassigned';
        const amount = Number(po.totalAmountSar ?? 0) || 0;
        deptTotals.set(department, (deptTotals.get(department) ?? 0) + amount);
      }
      // Sort by total descending
      const sorted = Array.from(deptTotals.entries()).sort((a, b) => b[1] - a[1]);
      const categories = sorted.map(([dept]) => dept);
      const data = sorted.map(([, total]) => Math.round(total * 100) / 100);
      res.json({
        categories,
        series: [{ name: 'Spend (SAR)', data }],
      });
    } catch (error) {
      console.error('[overview] GET /orders-by-dept failed', error);
      res.status(500).json({ error: 'overview_orders_by_dept_failed' });
    }
  })
);

export default router;
