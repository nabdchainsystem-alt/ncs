import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { differenceInCalendarDays } from 'date-fns';
import { z } from 'zod';

import { asyncHandler } from '../errors';
import { prisma } from '../prisma';
import { upsertVendorByName } from '../services/vendorService';

export const requestsRouter = Router();

const listQuerySchema = z.object({
  status: z.string().trim().optional(),
  dept: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  q: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

type ListQuery = z.infer<typeof listQuerySchema>;

type RequestFilterParams = Pick<ListQuery, 'status' | 'dept' | 'priority' | 'q' | 'dateFrom' | 'dateTo'>;

type RequestAnalyticsFilterParams = Omit<RequestFilterParams, 'q'>;

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildRequestFilters(params: RequestFilterParams | RequestAnalyticsFilterParams): Prisma.RequestWhereInput {
  const where: Prisma.RequestWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.dept) {
    where.department = params.dept;
  }

  if (params.priority) {
    where.priority = params.priority;
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
    const or: Prisma.RequestWhereInput[] = [
      { orderNo: { contains: search } },
      { title: { contains: search } },
      { vendor: { contains: search } },
      { department: { contains: search } },
    ];
    where.OR = or;
  }

  return where;
}

function extractRequestFilters(params: ListQuery): RequestFilterParams {
  const { status, dept, priority, q, dateFrom, dateTo } = params;
  return { status, dept, priority, q, dateFrom, dateTo };
}

function extractAnalyticsFilters(params: ListQuery): RequestAnalyticsFilterParams {
  const { status, dept, priority, dateFrom, dateTo } = params;
  return { status, dept, priority, dateFrom, dateTo };
}

requestsRouter.get('/', asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  const where = buildRequestFilters(extractRequestFilters(params));

  const page = params.page ?? undefined;
  const pageSize = params.pageSize ?? undefined;

  const skip = page && pageSize ? (page - 1) * pageSize : undefined;
  const take = pageSize ?? undefined;

  const [items, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { store: { select: { id: true, name: true, code: true } } },
        },
        vendorRef: { select: { id: true, name: true, code: true } },
        orders: { select: { id: true, orderNo: true, status: true } },
        store: { select: { id: true, name: true, code: true } },
      },
      skip,
      take,
    }),
    prisma.request.count({ where }),
  ]);

  res.json({ items, total });
}));

function resolveRequestStatus(status?: string | null): 'New' | 'Approved' | 'OnHold' | 'Closed' {
  const value = String(status ?? '')
    .trim()
    .toLowerCase();

  if (!value) return 'New';
  if (value.includes('approve')) return 'Approved';
  if (value.includes('hold') || value.includes('await')) return 'OnHold';
  if (value.includes('close') || value.includes('done') || value.includes('complete') || value.includes('fulfill')) return 'Closed';
  if (value.includes('cancel') || value.includes('reject')) return 'Closed';
  if (value.includes('new') || value.includes('open') || value.includes('pending') || value.includes('submit')) return 'New';
  if (value.includes('progress') || value.includes('review')) return 'New';
  return 'New';
}

requestsRouter.get('/analytics/status', asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  const { page: _page, pageSize: _pageSize } = params;
  void _page;
  void _pageSize;

  const where = buildRequestFilters(extractAnalyticsFilters(params));

  const requests = await prisma.request.findMany({
    where,
    select: { status: true },
  });

  const buckets: Record<'New' | 'Approved' | 'OnHold' | 'Closed', number> = {
    New: 0,
    Approved: 0,
    OnHold: 0,
    Closed: 0,
  };

  requests.forEach(({ status }) => {
    const bucket = resolveRequestStatus(status);
    buckets[bucket] += 1;
  });

  const response = [
    { name: 'New', value: buckets.New },
    { name: 'Approved', value: buckets.Approved },
    { name: 'OnHold', value: buckets.OnHold },
    { name: 'Closed', value: buckets.Closed },
  ];

  res.json(response);
}));

requestsRouter.get('/analytics/by-dept', asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  const { page: _page, pageSize: _pageSize } = params;
  void _page;
  void _pageSize;

  const where = buildRequestFilters(extractAnalyticsFilters(params));

  const requests = await prisma.request.findMany({
    where,
    select: { department: true },
  });

  if (!requests.length) {
    res.json({ categories: [], series: [{ name: 'Requests', data: [] }] });
    return;
  }

  const totals = requests.reduce<Record<string, number>>((acc, request) => {
    const department = request.department?.trim() || 'Unassigned';
    acc[department] = (acc[department] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const categories = entries.map(([department]) => department);
  const data = entries.map(([, value]) => value);

  res.json({ categories, series: [{ name: 'Requests', data }] });
}));

requestsRouter.get('/kpis', asyncHandler(async (_req, res) => {
  const requests = await prisma.request.findMany({ select: { status: true } });
  const totals = requests.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const payload = {
    total: requests.length,
    open: totals.Open ?? 0,
    closed: totals.Closed ?? 0,
    approved: totals.Approved ?? 0,
    rejected: totals.Rejected ?? 0,
    onHold: totals.OnHold ?? 0,
    inReview: totals.InReview ?? 0,
  };

  res.json(payload);
}));

requestsRouter.get('/lead-times', asyncHandler(async (_req, res) => {
  const requests = await prisma.request.findMany({
    select: { id: true, orderNo: true, createdAt: true, requiredDate: true, priority: true },
    orderBy: { createdAt: 'desc' },
  });

  const leadTimes = requests
    .filter((r) => r.requiredDate)
    .map((r) => ({
      id: r.id,
      orderNo: r.orderNo,
      priority: r.priority,
      leadTimeDays: differenceInCalendarDays(r.requiredDate!, r.createdAt),
    }));

  res.json(leadTimes);
}));

requestsRouter.get('/urgent-delays', asyncHandler(async (_req, res) => {
  const urgent = await prisma.request.findMany({
    where: {
      priority: 'Urgent',
      status: { not: 'Closed' },
    },
    select: {
      id: true,
      orderNo: true,
      title: true,
      department: true,
      requiredDate: true,
      createdAt: true,
    },
    orderBy: { requiredDate: 'asc' },
  });

  res.json(urgent);
}));

const requestItemSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  qty: z.number().optional(),
  unit: z.string().optional(),
  storeId: z.coerce.number().int().positive().optional(),
});

const createRequestSchema = z.object({
  orderNo: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  vendorName: z.string().optional(),
  priority: z.string().optional(),
  requiredDate: z.string().optional(),
  storeId: z.coerce.number().int().positive().optional(),
  items: z.array(requestItemSchema).optional(),
});

requestsRouter.post('/', asyncHandler(async (req, res) => {
  const payload = createRequestSchema.parse(req.body ?? {});

  const vendor = await upsertVendorByName(payload.vendorName);
  const orderNo = (payload.orderNo && payload.orderNo.trim()) || `REQ-${Date.now()}`;
  const priority = payload.priority?.trim() || 'Medium';

  let requiredDate: Date | null = null;
  if (payload.requiredDate) {
    const parsed = new Date(payload.requiredDate);
    if (!Number.isNaN(parsed.getTime())) {
      requiredDate = parsed;
    }
  }

  const storeIds = new Set<number>();
  if (payload.storeId) {
    storeIds.add(payload.storeId);
  }
  (payload.items ?? []).forEach((item) => {
    const candidate = item.storeId;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      storeIds.add(candidate);
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

  const invalidItemStore = (payload.items ?? []).find((item) => item.storeId && !storeMap.has(item.storeId));
  if (invalidItemStore?.storeId) {
    res.status(400).json({ error: 'store_not_found', storeId: invalidItemStore.storeId });
    return;
  }

  const resolvedRequestStore = payload.storeId ? storeMap.get(payload.storeId) : undefined;

  const itemsData = (payload.items ?? [])
    .filter((item) => (item.name && item.name.trim()) || (item.code && item.code.trim()))
    .map((item) => {
      const itemStore = item.storeId ? storeMap.get(item.storeId) : resolvedRequestStore;
      const storeLabel = itemStore ? (itemStore.name ?? itemStore.code ?? null) : null;
      return {
        code: item.code?.trim() || null,
        name: item.name?.trim() || item.code?.trim() || null,
        qty: item.qty ?? null,
        unit: item.unit?.trim() || null,
        storeLabel,
        store: itemStore ? { connect: { id: itemStore.id } } : undefined,
      } satisfies Prisma.RequestItemCreateWithoutRequestInput;
    });

  const request = await prisma.request.create({
    data: {
      orderNo,
      title: payload.title ?? payload.vendorName ?? orderNo,
      department: payload.department,
      vendor: payload.vendorName ?? vendor?.name ?? null,
      vendorId: vendor?.id ?? null,
      priority,
      requiredDate,
      storeId: resolvedRequestStore?.id ?? null,
      storeLabel: resolvedRequestStore ? (resolvedRequestStore.name ?? resolvedRequestStore.code ?? null) : null,
      items: itemsData.length
        ? {
            create: itemsData,
          }
        : undefined,
    },
    include: {
      items: {
        include: { store: { select: { id: true, name: true, code: true } } },
      },
      store: { select: { id: true, name: true, code: true } },
    },
  });

  res.status(201).json(request);
}));
