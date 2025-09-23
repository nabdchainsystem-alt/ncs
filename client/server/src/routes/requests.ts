console.log(">> requests router LOADED @", new Date().toISOString());
import { Router, type NextFunction, type Request, type Response } from "express";
import prisma from "../lib/prisma";

type OverviewStatusKey = 'New' | 'Approved' | 'Rejected' | 'OnHold' | 'Closed';

const STATUS_KEYS: OverviewStatusKey[] = ['New', 'Approved', 'Rejected', 'OnHold', 'Closed'];

function parseMeta(note?: string): { code?: string; machine?: string; requester?: string; warehouse?: string } {
  if (!note) return {} as any;
  try { return JSON.parse(note); } catch { return {} as any; }
}

function mergeItemMeta(it: any) {
  const base = parseMeta(it?.note);
  return {
    machine: it?.machine ?? base?.machine ?? "",
    requester: it?.requester ?? base?.requester ?? "",
    warehouse: it?.warehouse ?? base?.warehouse ?? "",
    code: it?.code ?? it?.itemCode ?? it?.materialCode ?? base?.code ?? "",
  };
}

function toStatusKey(status?: string | null, approval?: string | null): OverviewStatusKey {
  const normalized = String(status ?? '').trim().toLowerCase();
  const approvalNormalized = String(approval ?? '').trim().toLowerCase();

  if (normalized.includes('reject') || approvalNormalized.includes('reject')) return 'Rejected';
  if (normalized.includes('hold') || approvalNormalized.includes('hold')) return 'OnHold';
  if (normalized.includes('close') || normalized.includes('complete') || approvalNormalized.includes('close'))
    return 'Closed';
  if (normalized.includes('approve') || approvalNormalized.includes('approve')) return 'Approved';
  return 'New';
}

function toInt(v: any, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}
function toDate(v?: any) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}
function buildWhere(qs: any) {
  const { status, department, vendor, warehouse, dateFrom, dateTo } = qs || {};
  const where: any = { NOT: { status: 'Deleted' } };

  const idParam = qs?.id ?? qs?.requestId;
  if (idParam !== undefined) {
    const parsed = Number(idParam);
    if (Number.isInteger(parsed) && parsed > 0) {
      where.id = parsed;
    }
  }

  const search = String(qs?.search ?? qs?.q ?? '').trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { orderNo: { contains: search, mode: 'insensitive' } },
    ];
  }

  const and: any[] = [];
  if (status) and.push({ status: String(status) });
  if (department) and.push({ department: String(department) });
  if (vendor) and.push({ vendor: String(vendor) });
  if (warehouse) {
    const w = String(warehouse);
    and.push({
      OR: [
        { warehouse: { contains: w, mode: 'insensitive' } },
        { items: { some: { note: { contains: `"warehouse":"${w}"` } } } },
      ],
    });
  }
  if (dateFrom || dateTo) {
    const gte = toDate(dateFrom);
    const lte = toDate(dateTo);
    const range: any = {};
    if (gte) range.gte = gte;
    if (lte) range.lte = lte;
    if (gte || lte) and.push({ createdAt: range });
  }

  if (and.length) {
    where.AND = and;
  }

  return where;
}

// Helper utilities
function sanitizeItem(it: any) {
  const meta = mergeItemMeta(it);
  const code = meta.code;
  return {
    name: it?.name ?? it?.title ?? it?.description ?? code ?? "",
    qty: Number(it?.qty ?? it?.quantity) || 0,
    unit: it?.unit ?? it?.uom ?? "",
    note: JSON.stringify(meta),
  };
}

async function loadRequestWithMeta(id: number) {
  const request = await prisma.request.findFirst({
    where: { id, NOT: { status: 'Deleted' } },
    include: { items: true },
  });
  if (!request) return null;
  return {
    ...request,
    items: (request.items || []).map((it: any) => {
      const meta = parseMeta(it?.note);
      return {
        ...it,
        // Unified canonical fields for UI
        name: it?.name ?? it?.title ?? it?.description ?? (parseMeta(it?.note)?.code ?? ""),
        code: (parseMeta(it?.note)?.code) ?? it?.code ?? it?.itemCode ?? it?.materialCode ?? null,
        qty: Number(it?.qty ?? it?.quantity) || 0,
        unit: it?.unit ?? it?.uom ?? null,
        // Keep meta-expansions for compatibility
        machine: meta?.machine ?? it?.machine ?? null,
        requester: meta?.requester ?? it?.requester ?? null,
        warehouse: meta?.warehouse ?? it?.warehouse ?? null,
      };
    }),
  };
}

async function recalcQuantity(id: number) {
  const totalQty = await prisma.requestItem.aggregate({
    where: { requestId: id },
    _sum: { qty: true },
  });
  await prisma.request.update({
    where: { id },
    data: { quantity: totalQty._sum.qty ?? 0 },
  });
}

const router = Router();

const ah = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
const APPROVAL_VALUES = new Set(["Pending", "Approved", "Rejected", "OnHold"]);

async function ensureApprovalColumn() {
  try {
    const columns: Array<{ name?: string }> = await prisma.$queryRawUnsafe(`PRAGMA table_info('Request');`);
    const hasApproval = columns.some((col) => col?.name === 'approval');
    if (!hasApproval) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Request ADD COLUMN approval TEXT DEFAULT 'Pending';`);
      console.log('>> Added missing approval column to Request table');
    }
  } catch (err) {
    console.warn('Failed to ensure approval column exists', err);
  }
}

ensureApprovalColumn();

// Get all requests (with filters & pagination)
router.get("/", ah(async (req, res) => {
  try {
    const page = toInt(req.query.page, 1);
    const pageSize = Math.min(toInt(req.query.pageSize, 10), 100);
    const where = buildWhere(req.query);

    const [total, requests] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const augmented = requests.map((r: any) => ({
      ...r,
      items: (r.items || []).map((it: any) => {
        const meta = parseMeta(it?.note);
        return {
          ...it,
          // Unified canonical fields for UI
          name: it?.name ?? it?.title ?? it?.description ?? (parseMeta(it?.note)?.code ?? ""),
          code: (parseMeta(it?.note)?.code) ?? it?.code ?? it?.itemCode ?? it?.materialCode ?? null,
          qty: Number(it?.qty ?? it?.quantity) || 0,
          unit: it?.unit ?? it?.uom ?? null,
          // Keep meta-expansions for compatibility
          machine: meta?.machine ?? it?.machine ?? null,
          requester: meta?.requester ?? it?.requester ?? null,
          warehouse: meta?.warehouse ?? it?.warehouse ?? null,
        };
      }),
    }));

    res.json({ items: augmented, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
}));

router.get("/stats", ah(async (_req, res) => {
  try {
    const where = { NOT: { status: 'Deleted' } };

    const [total, approvals, departments] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.groupBy({
        by: ['approval'],
        where,
        _count: { _all: true },
      }),
      prisma.request.groupBy({
        by: ['department'],
        where,
        _count: { _all: true },
      }),
    ]);

    const statusCounts = { approved: 0, pending: 0, rejected: 0, onHold: 0 };
    approvals.forEach((bucket) => {
      const key = String(bucket.approval ?? '').trim().toLowerCase();
      const count = bucket._count?._all ?? 0;
      if (key === 'approved') statusCounts.approved += count;
      else if (key === 'rejected') statusCounts.rejected += count;
      else if (key === 'onhold' || key === 'on-hold' || key === 'on hold') statusCounts.onHold += count;
      else statusCounts.pending += count;
    });

    const byDepartment = departments
      .map((bucket) => ({
        department: bucket.department ? String(bucket.department) : 'Unassigned',
        count: bucket._count?._all ?? 0,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);

    res.json({
      total,
      approved: statusCounts.approved,
      pending: statusCounts.pending,
      rejected: statusCounts.rejected,
      onHold: statusCounts.onHold,
      byDepartment,
    });
  } catch (err) {
    console.error('GET /api/requests/stats failed', err);
    res.status(500).json({ error: 'Failed to compute request stats' });
  }
}));

router.get(
  '/analytics/status',
  ah(async (_req, res) => {
    try {
      const requests = await prisma.request.findMany({
        where: { NOT: { status: 'Deleted' } },
        select: { status: true, approval: true },
      });

      const buckets: Record<OverviewStatusKey, number> = {
        New: 0,
        Approved: 0,
        Rejected: 0,
        OnHold: 0,
        Closed: 0,
      };

      requests.forEach((request) => {
        const statusKey = toStatusKey(request.status, request.approval);
        buckets[statusKey] += 1;
      });

      const response = STATUS_KEYS.map((name) => ({
        name: name === 'OnHold' ? 'OnHold' : name,
        value: buckets[name],
      }));

      res.json(response);
    } catch (error) {
      console.error('GET /api/requests/analytics/status failed', error);
      res.status(500).json({ error: 'Failed to load request status analytics' });
    }
  })
);

router.get(
  '/analytics/by-dept',
  ah(async (_req, res) => {
    try {
      const departments = await prisma.request.groupBy({
        by: ['department'],
        where: { NOT: { status: 'Deleted' } },
        _count: { _all: true },
      });

      const sorted = departments
        .map((bucket) => ({
          name: bucket.department ? String(bucket.department) : 'Unassigned',
          value: bucket._count?._all ?? 0,
        }))
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value);

      const categories = sorted.map((entry) => entry.name);
      const series = [{ name: 'Requests', data: sorted.map((entry) => entry.value) }];

      res.json({ categories, series });
    } catch (error) {
      console.error('GET /api/requests/analytics/by-dept failed', error);
      res.status(500).json({ error: 'Failed to load department analytics' });
    }
  })
);

// Create new request
router.post("/", ah(async (req, res) => {
  try {
    const { orderNo, type, department, vendor, requiredDate, date, warehouse, items, title, priority, status, approval: approvalRaw } = req.body;
    console.log('POST', req.originalUrl, 'incoming orderNo=', orderNo);
    const rawItems = Array.isArray(items) ? items : [];
    console.log("POST /api/requests raw items:", rawItems);
    const sanitizedItems = rawItems.map((it: any) => {
      const meta = mergeItemMeta(it);
      const code = meta.code;
      return {
        name: it?.name ?? it?.title ?? it?.description ?? code ?? "",
        qty: Number(it?.qty ?? it?.quantity) || 0,
        unit: it?.unit ?? it?.uom ?? "",
        note: JSON.stringify(meta),
      };
    });
    console.log("POST /api/requests sanitized items:", sanitizedItems);
    const totalQty = sanitizedItems.reduce((sum: number, it: any) => sum + (Number(it?.qty) || 0), 0);
    const approval = (() => {
      if (typeof approvalRaw === 'string' && APPROVAL_VALUES.has(approvalRaw)) return approvalRaw;
      const normalized = typeof approvalRaw === 'string' ? approvalRaw.trim().replace(/[-\s]/g, '').toLowerCase() : '';
      if (normalized === 'approved') return 'Approved';
      if (normalized === 'rejected') return 'Rejected';
      if (normalized === 'onhold') return 'OnHold';
      return 'Pending';
    })();

    const providedOrderNo = orderNo != null ? String(orderNo).trim() : '';
    const orderNoValue = providedOrderNo || `REQ-${Date.now()}`;
    const baseData = {
      title: title || orderNoValue || 'Request',
      type,
      department,
      priority: priority || 'Medium',
      status: status || 'NEW',
      approval,
      vendor: vendor ?? undefined,
      warehouse: warehouse ?? '',
      quantity: totalQty,
      requiredDate: requiredDate ? new Date(requiredDate) : (date ? new Date(date) : undefined),
    } as const;
    const itemsCreate = sanitizedItems.length ? { create: sanitizedItems } : undefined;

    let request;
    if (providedOrderNo) {
      const existing = await prisma.request.findFirst({ where: { orderNo: orderNoValue } });
      console.log('create request check existing', orderNoValue, existing?.id, existing?.status);
      if (existing) {
        if (existing.status === 'Deleted') {
          request = await prisma.$transaction(async (tx) => {
            await tx.requestItem.deleteMany({ where: { requestId: existing.id } });
            return tx.request.update({
              where: { id: existing.id },
              data: {
                ...baseData,
                orderNo: orderNoValue,
                items: itemsCreate,
              },
              include: { items: true },
            });
          });
        } else {
          return res.status(409).json({ error: 'Duplicate value', field: 'orderNo' });
        }
      }
    }

    if (!request) {
      request = await prisma.request.create({
        data: {
          ...baseData,
          orderNo: orderNoValue,
          items: itemsCreate,
        },
        include: { items: true },
      });
    }
    const withMeta = {
      ...request,
      items: (request.items || []).map((it: any) => {
        const meta = parseMeta(it?.note);
        return {
          ...it,
          // Unified canonical fields for UI
          name: it?.name ?? it?.title ?? it?.description ?? (parseMeta(it?.note)?.code ?? ""),
          code: (parseMeta(it?.note)?.code) ?? it?.code ?? it?.itemCode ?? it?.materialCode ?? null,
          qty: Number(it?.qty ?? it?.quantity) || 0,
          unit: it?.unit ?? it?.uom ?? null,
          // Keep meta-expansions for compatibility
          machine: meta?.machine ?? it?.machine ?? null,
          requester: meta?.requester ?? it?.requester ?? null,
          warehouse: meta?.warehouse ?? it?.warehouse ?? null,
        };
      }),
    };
    res.json(withMeta);
  } catch (err) {
    console.error('POST /api/requests failed', err);
    const code = (err as any)?.code;
    if (code === 'P2002') {
      return res.status(409).json({ error: 'Duplicate value', field: 'orderNo' });
    }
    return res.status(500).json({ error: 'Failed to create request' });
  }
}));

// Update request
router.patch("/:id", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid request id" });
    }
    const { type, department, vendor, requiredDate, date, warehouse, items, title, priority, status, orderNo, requestNo, approval } = req.body;
    const hasItemsKey = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'items');
    const itemsArray = Array.isArray(items) ? items as any[] : undefined;
    console.log('PATCH', req.originalUrl, 'id=', id, 'incoming orderNo=', orderNo, 'requestNo=', requestNo);
    let sanitizedItemsU: any[] | undefined = undefined;
    let totalQty: number | undefined = undefined;
    const data: any = {
      title: undefined,
      type,
      department,
      priority: priority ?? undefined,
      status: status ?? undefined,
      orderNo: undefined,
      vendor: vendor ?? undefined,
      warehouse: warehouse ?? undefined,
      requiredDate: requiredDate ? new Date(requiredDate) : (date ? new Date(date) : undefined),
    };
    if (approval !== undefined) {
      data.approval = String(approval);
    }
    if (itemsArray !== undefined) {
      sanitizedItemsU = itemsArray.map((it: any) => {
        const meta = mergeItemMeta(it);
        const code = meta.code;
        return {
          name: it?.name ?? it?.title ?? it?.description ?? code ?? "",
          qty: Number(it?.qty ?? it?.quantity) || 0,
          unit: it?.unit ?? it?.uom ?? "",
          note: JSON.stringify(meta),
        };
      });
      console.log("PATCH /api/requests sanitized items:", sanitizedItemsU);
      totalQty = sanitizedItemsU.reduce((sum: number, it: any) => sum + (Number(it?.qty) || 0), 0);
      data.quantity = totalQty ?? 0;
      data.items = sanitizedItemsU.length ? { deleteMany: {}, create: sanitizedItemsU } : { deleteMany: {} };
    }
    const newOrderNo = (() => {
      const raw = requestNo ?? orderNo;
      if (raw === undefined || raw === null) return undefined;
      const str = String(raw).trim();
      return str || undefined;
    })();
    data.orderNo = newOrderNo;
    data.title = title ?? (newOrderNo ?? undefined);

    const request = await prisma.request.update({
      where: { id },
      data,
      include: { items: true },
    });
    const withMetaU = {
      ...request,
      items: (request.items || []).map((it: any) => {
        const meta = parseMeta(it?.note);
        return {
          ...it,
          // Unified canonical fields for UI
          name: it?.name ?? it?.title ?? it?.description ?? (parseMeta(it?.note)?.code ?? ""),
          code: (parseMeta(it?.note)?.code) ?? it?.code ?? it?.itemCode ?? it?.materialCode ?? null,
          qty: Number(it?.qty ?? it?.quantity) || 0,
          unit: it?.unit ?? it?.uom ?? null,
          // Keep meta-expansions for compatibility
          machine: meta?.machine ?? it?.machine ?? null,
          requester: meta?.requester ?? it?.requester ?? null,
          warehouse: meta?.warehouse ?? it?.warehouse ?? null,
        };
      }),
    };
    res.json(withMetaU);
  } catch (err) {
    console.error('PATCH /api/requests/:id failed', err);
    const code = (err as any)?.code;
    if (code === 'P2002') {
      // Unique constraint failed
      return res.status(409).json({ error: 'Duplicate value', field: 'orderNo' });
    }
    return res.status(500).json({ error: 'Failed to update request' });
  }
}));

// Update request STATUS only (RFQ / APPROVED / COMPLETED)
router.patch("/:id/status", ah(async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid request id" });
  }
  const raw = (req.body && req.body.status) || "";
  const status = String(raw).toUpperCase();

  // allowed statuses
  const ALLOWED = new Set(["NEW", "RFQ", "APPROVED", "COMPLETED"]);
  if (!ALLOWED.has(status)) {
    return res.status(400).json({ error: "Invalid status value", allowed: Array.from(ALLOWED) });
  }

  try {
    const updated = await prisma.request.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
    res.json(updated);
  } catch (err: any) {
    // Prisma P2025: record not found
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Request not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
}));

// Add items
router.post("/:id/items", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid request id" });

    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const rows = payload.map(sanitizeItem).map((r: any) => ({ ...r, requestId: id }));

    if (!rows.length) return res.status(400).json({ error: "No items to add" });

    await prisma.requestItem.createMany({ data: rows });
    await recalcQuantity(id);

    const updated = await loadRequestWithMeta(id);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items failed", err);
    res.status(500).json({ error: "Failed to add items" });
  }
}));

// Update a single item
router.patch("/:id/items/:itemId", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    // Only allow fields that are part of the sanitizeItem result
    const s = sanitizeItem(req.body || {});
    await prisma.requestItem.update({
      where: { id: itemId },
      data: s,
    });

    await recalcQuantity(id);

    const updated = await loadRequestWithMeta(id);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/requests/:id/items/:itemId failed", err);
    res.status(500).json({ error: "Failed to update item" });
  }
}));

// Update a single item STATUS (e.g., NEW | Approved | Rejected | RFQ_SENT)
router.patch("/:id/items/:itemId/status", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    const raw = (req.body && req.body.status) || "";
    const status = String(raw).trim();
    const ALLOWED = new Set(["NEW", "Approved", "Rejected", "RFQ_SENT"]);
    if (!ALLOWED.has(status)) {
      return res.status(400).json({ error: "Invalid status value", allowed: Array.from(ALLOWED) });
    }

    await prisma.requestItem.update({ where: { id: itemId }, data: { status } });
    const updated = await loadRequestWithMeta(id);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/requests/:id/items/:itemId/status failed", err);
    res.status(500).json({ error: "Failed to update item status" });
  }
}));

// Send RFQ for a single item → mark as RFQ_SENT (idempotent)
router.post("/:id/items/:itemId/rfq", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    // In future: enqueue RFQ job here (email/integration). For now, mark status.
    await prisma.requestItem.update({ where: { id: itemId }, data: { status: "RFQ_SENT" } });
    const updated = await loadRequestWithMeta(id);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items/:itemId/rfq failed", err);
    res.status(500).json({ error: "Failed to send RFQ" });
  }
}));

// Alias endpoint for explicit RFQ send path
router.post("/:id/items/:itemId/rfq/send", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    await prisma.requestItem.update({ where: { id: itemId }, data: { status: "RFQ_SENT" } });
    const updated = await loadRequestWithMeta(id);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items/:itemId/rfq/send failed", err);
    res.status(500).json({ error: "Failed to send RFQ" });
  }
}));

// Delete a single item
router.delete("/:id/items/:itemId", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    await prisma.requestItem.delete({ where: { id: itemId } });
    await recalcQuantity(id);

    const updated = await loadRequestWithMeta(id);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error("DELETE /api/requests/:id/items/:itemId failed", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
}));

// Replace all items (bulk)
router.put("/:id/items", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid request id" });

    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const rows = payload.map(sanitizeItem);

    // Replace
    await prisma.$transaction([
      prisma.requestItem.deleteMany({ where: { requestId: id } }),
      rows.length
        ? prisma.requestItem.createMany({ data: rows.map((r: any) => ({ ...r, requestId: id })) })
        : prisma.requestItem.createMany({ data: [] }),
    ]);

    await recalcQuantity(id);

    const updated = await loadRequestWithMeta(id);
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err) {
    console.error("PUT /api/requests/:id/items failed", err);
    res.status(500).json({ error: "Failed to replace items" });
  }
}));

// Delete request
router.patch("/:id/approval", ah(async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid request id" });
  }

  const rawApproval = req.body?.approval;
  if (rawApproval === undefined || rawApproval === null) {
    return res.status(400).json({ error: "Missing approval value" });
  }

  const value = String(rawApproval).trim();
  if (!APPROVAL_VALUES.has(value)) {
    return res.status(400).json({ error: "Invalid approval value", allowed: Array.from(APPROVAL_VALUES) });
  }

  try {
    const updated = await prisma.request.update({
      where: { id },
      data: { approval: value },
      select: { id: true, approval: true },
    });
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/requests/:id/approval failed', err);
    res.status(500).json({ error: "Failed to update approval" });
  }
}));

router.delete("/:id", ah(async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid request id" });
    }

    const updated = await prisma.request.update({
      where: { id },
      data: { status: 'Deleted', updatedAt: new Date() },
      select: { id: true },
    });

    console.log(`Request ${id} soft-deleted`);
    res.json({ ok: true, id: updated.id });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Request not found' });
    }
    console.error('DELETE /api/requests/:id failed', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
}));

export default router;
