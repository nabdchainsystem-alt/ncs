import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';
import { upsertVendorByName } from '../services/vendorService';

export const ordersRouter = Router();

const listQuerySchema = z.object({
  status: z.string().trim().optional(),
  dept: z.string().trim().optional(),
  category: z.string().trim().optional(),
  q: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

type ListQuery = z.infer<typeof listQuerySchema>;

type OrderFilterParams = Pick<ListQuery, 'status' | 'dept' | 'category' | 'q' | 'dateFrom' | 'dateTo'>;

type OrderAnalyticsFilterParams = Omit<OrderFilterParams, 'q'>;

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildOrderFilters(params: OrderFilterParams | OrderAnalyticsFilterParams): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.dept) {
    where.request = { department: params.dept };
  }

  if (params.category) {
    where.vendor = {
      categoriesJson: { contains: params.category },
    };
  }

  const createdAt: Prisma.DateTimeFilter = {};
  const from = parseDate(params.dateFrom);
  const to = parseDate(params.dateTo);
  if (from) createdAt.gte = from;
  if (to) createdAt.lte = to;
  if (Object.keys(createdAt).length) {
    where.createdAt = createdAt;
  }

  if ('q' in params && params.q) {
    const search = params.q;
    where.OR = [
      { orderNo: { contains: search } },
      { vendor: { name: { contains: search } } },
      { request: { orderNo: { contains: search } } },
    ];
  }

  return where;
}

function extractOrderFilters(params: ListQuery): OrderFilterParams {
  const { status, dept, category, q, dateFrom, dateTo } = params;
  return { status, dept, category, q, dateFrom, dateTo };
}

function extractOrderAnalyticsFilters(params: ListQuery): OrderAnalyticsFilterParams {
  const { status, dept, category, dateFrom, dateTo } = params;
  return { status, dept, category, dateFrom, dateTo };
}

ordersRouter.get('/', asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  const where = buildOrderFilters(extractOrderFilters(params));

  const page = params.page ?? undefined;
  const pageSize = params.pageSize ?? undefined;

  const skip = page && pageSize ? (page - 1) * pageSize : undefined;
  const take = pageSize ?? undefined;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, name: true, code: true, status: true, trustScore: true } },
        request: { select: { id: true, orderNo: true, department: true } },
        store: { select: { id: true, name: true, code: true } },
      },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ items, total });
}));

function resolveOrderStatus(status?: string | null): 'Pending' | 'Completed' | 'OnHold' | 'New' {
  const value = String(status ?? '')
    .trim()
    .toLowerCase();

  if (!value) return 'New';

  if (value.includes('complete') || value.includes('close') || value.includes('fulfilled') || value.includes('done')) {
    return 'Completed';
  }

  if (value.includes('hold') || value.includes('await')) {
    return 'OnHold';
  }

  if (value.includes('new') || value.includes('draft') || value.includes('open')) {
    return 'New';
  }

  if (value.includes('pending') || value.includes('approve') || value.includes('progress') || value.includes('process')) {
    return 'Pending';
  }

  return 'Pending';
}

ordersRouter.get('/analytics/status', asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  const { page: _page, pageSize: _pageSize } = params;
  void _page;
  void _pageSize;

  const where = buildOrderFilters(extractOrderAnalyticsFilters(params));

  const orders = await prisma.order.findMany({
    where,
    select: { status: true },
  });

  const buckets: Record<'Pending' | 'Completed' | 'OnHold' | 'New', number> = {
    Pending: 0,
    Completed: 0,
    OnHold: 0,
    New: 0,
  };

  orders.forEach(({ status }) => {
    const bucket = resolveOrderStatus(status);
    buckets[bucket] += 1;
  });

  res.json([
    { name: 'Pending', value: buckets.Pending },
    { name: 'Completed', value: buckets.Completed },
    { name: 'OnHold', value: buckets.OnHold },
    { name: 'New', value: buckets.New },
  ]);
}));

ordersRouter.get('/analytics/by-category', asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  const { page: _page, pageSize: _pageSize } = params;
  void _page;
  void _pageSize;

  const where = buildOrderFilters(extractOrderAnalyticsFilters(params));

  const orders = await prisma.order.findMany({
    where,
    select: {
      status: true,
      totalValue: true,
      vendor: { select: { categoriesJson: true, name: true } },
      request: { select: { department: true } },
    },
  });

  const completed = orders.filter((order) => resolveOrderStatus(order.status) === 'Completed');

  if (!completed.length) {
    res.json([]);
    return;
  }

  const totals = completed.reduce<Record<string, number>>((acc, order) => {
    const category = (() => {
      const raw = order.vendor?.categoriesJson;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as string[];
          if (Array.isArray(parsed) && parsed.length) {
            const first = parsed[0]?.trim();
            if (first) return first;
          }
        } catch {
          /* ignore */
        }
      }
      return order.request?.department?.trim() || 'Uncategorized';
    })();

    const amount = typeof order.totalValue === 'number' && Number.isFinite(order.totalValue)
      ? order.totalValue
      : 0;

    acc[category] = (acc[category] ?? 0) + amount;
    return acc;
  }, {});

  const response = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  res.json(response);
}));

const createOrderSchema = z.object({
  orderNo: z.string().optional(),
  requestId: z.number().int().optional(),
  vendorId: z.number().int().optional(),
  vendorName: z.string().optional(),
  amount: z.number().optional(),
  status: z.string().optional(),
  currency: z.string().optional(),
  expectedDelivery: z.string().optional(),
  storeId: z.coerce.number().int().positive().optional(),
});

ordersRouter.post('/', asyncHandler(async (req, res) => {
  const payload = createOrderSchema.parse(req.body ?? {});

  let vendorId = payload.vendorId ?? null;
  if (!vendorId && payload.vendorName) {
    const vendor = await upsertVendorByName(payload.vendorName);
    vendorId = vendor?.id ?? null;
  }

  const orderNo = (payload.orderNo && payload.orderNo.trim()) || `PO-${Date.now()}`;
  const currency = payload.currency?.trim() || 'SAR';
  const status = payload.status?.trim() || 'Pending';
  let expectedDelivery: Date | null = null;
  if (payload.expectedDelivery) {
    const parsed = new Date(payload.expectedDelivery);
    if (!Number.isNaN(parsed.getTime())) {
      expectedDelivery = parsed;
    }
  }

  const requestRecord = payload.requestId
    ? await prisma.request.findUnique({
        where: { id: payload.requestId },
        include: {
          store: { select: { id: true, name: true, code: true } },
          items: {
            select: {
              storeId: true,
              store: { select: { id: true, name: true, code: true } },
            },
          },
        },
      })
    : null;

  const storeIds = new Set<number>();
  if (payload.storeId) storeIds.add(payload.storeId);
  if (requestRecord?.storeId) storeIds.add(requestRecord.storeId);
  requestRecord?.items.forEach((item) => {
    const id = item.storeId;
    if (typeof id === 'number' && Number.isFinite(id)) {
      storeIds.add(id);
    }
  });

  const storeRecords = storeIds.size
    ? await prisma.store.findMany({
        where: { id: { in: Array.from(storeIds) } },
        select: { id: true, name: true, code: true },
      })
    : [];
  const storeMap = new Map(storeRecords.map((store) => [store.id, store]));

  if (payload.storeId && !storeMap.has(payload.storeId)) {
    res.status(400).json({ error: 'store_not_found', storeId: payload.storeId });
    return;
  }

  let resolvedStore = payload.storeId ? storeMap.get(payload.storeId) : undefined;
  if (!resolvedStore && requestRecord?.storeId) {
    resolvedStore = storeMap.get(requestRecord.storeId);
  }
  if (!resolvedStore && requestRecord) {
    const matchedItemStore = requestRecord.items.find((item) => item.storeId && storeMap.get(item.storeId));
    if (matchedItemStore?.storeId) {
      resolvedStore = storeMap.get(matchedItemStore.storeId) ?? matchedItemStore.store ?? undefined;
    }
  }

  const storeLabel = resolvedStore ? (resolvedStore.name ?? resolvedStore.code ?? null) : null;

  const order = await prisma.order.create({
    data: {
      orderNo,
      requestId: payload.requestId ?? null,
      vendorId,
      status,
      currency,
      totalValue: payload.amount ?? null,
      expectedDelivery,
      storeId: resolvedStore?.id ?? null,
      storeLabel,
    },
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      request: { select: { id: true, orderNo: true } },
      store: { select: { id: true, name: true, code: true } },
    },
  });

  res.status(201).json(order);
}));
