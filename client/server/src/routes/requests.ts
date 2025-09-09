console.log(">> requests router LOADED @", new Date().toISOString());
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

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
  const { q, status, department, vendor, warehouse, dateFrom, dateTo } = qs || {};
  const and: any[] = [];
  if (status) and.push({ status: String(status) });
  if (department) and.push({ department: String(department) });
  if (vendor) and.push({ vendor: String(vendor) });
  if (dateFrom || dateTo) {
    const gte = toDate(dateFrom);
    const lte = toDate(dateTo);
    const range: any = {};
    if (gte) range.gte = gte;
    if (lte) range.lte = lte;
    if (gte || lte) and.push({ createdAt: range });
  }
  if (warehouse) {
    const w = String(warehouse);
    and.push({
      OR: [
        { warehouse: { contains: w, mode: 'insensitive' } },
        { items: { some: { note: { contains: `"warehouse":"${w}"` } } } },
      ],
    });
  }
  if (q) {
    const v = String(q);
    and.push({ OR: [
      { orderNo: { contains: v, mode: 'insensitive' } },
      { vendor: { contains: v, mode: 'insensitive' } },
      { department: { contains: v, mode: 'insensitive' } },
      { items: { some: { name: { contains: v, mode: 'insensitive' } } } },
    ]});
  }
  return and.length ? { AND: and } : {};
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
  const request = await prisma.request.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!request) return null;
  return {
    ...request,
    items: (request.items || []).map((it: any) => {
      const meta = parseMeta(it?.note);
      return {
        ...it,
        code: meta?.code ?? it?.code ?? null,
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
const prisma = new PrismaClient();

// Get all requests (with filters & pagination)
router.get("/", async (req, res) => {
  try {
    const page = toInt(req.query.page, 1);
    const pageSize = Math.min(toInt(req.query.pageSize, 10), 100);
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortDir = ((req.query.sortDir as string) || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const where = buildWhere(req.query);

    const [total, requests] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        include: { items: true },
        orderBy: { [sortBy]: sortDir as any },
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
          code: meta?.code ?? it?.code ?? null,
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
});

// Create new request
router.post("/", async (req, res) => {
  try {
    const { orderNo, type, department, vendor, requiredDate, date, warehouse, items, title, priority, status } = req.body;
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
    const request = await prisma.request.create({
      data: {
        // allow numeric or string order numbers
        orderNo: (() => {
          const str = orderNo != null ? String(orderNo).trim() : '';
          return str || `REQ-${Date.now()}`;
        })(),
        title: title || (orderNo != null ? String(orderNo) : "Request"),
        type,
        department,
        priority: priority || "Medium",        // fallback for legacy required column
        status: status || "NEW",               // fallback for legacy required column
        vendor: vendor ?? undefined,
        warehouse: warehouse ?? "",
        quantity: totalQty,
        requiredDate: requiredDate ? new Date(requiredDate) : (date ? new Date(date) : undefined),
        items: sanitizedItems.length ? { create: sanitizedItems } : undefined,
      },
      include: { items: true },
    });
    const withMeta = {
      ...request,
      items: (request.items || []).map((it: any) => {
        const meta = parseMeta(it?.note);
        return {
          ...it,
          code: meta?.code ?? it?.code ?? null,
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
});

// Update request
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid request id" });
    }
    const { type, department, vendor, requiredDate, date, warehouse, items, title, priority, status, orderNo, requestNo } = req.body;
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
          code: meta?.code ?? it?.code ?? null,
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
});

// Update request STATUS only (RFQ / APPROVED / COMPLETED)
router.patch("/:id/status", async (req, res) => {
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
});

// Add items
router.post("/:id/items", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid request id" });

    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const rows = payload.map(sanitizeItem).map((r: any) => ({ ...r, requestId: id }));

    if (!rows.length) return res.status(400).json({ error: "No items to add" });

    await prisma.requestItem.createMany({ data: rows });
    await recalcQuantity(id);

    const updated = await loadRequestWithMeta(id);
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items failed", err);
    res.status(500).json({ error: "Failed to add items" });
  }
});

// Update a single item
router.patch("/:id/items/:itemId", async (req, res) => {
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
    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/requests/:id/items/:itemId failed", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Update a single item STATUS (e.g., NEW | Approved | Rejected | RFQ_SENT)
router.patch("/:id/items/:itemId/status", async (req, res) => {
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
    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/requests/:id/items/:itemId/status failed", err);
    res.status(500).json({ error: "Failed to update item status" });
  }
});

// Send RFQ for a single item → mark as RFQ_SENT (idempotent)
router.post("/:id/items/:itemId/rfq", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    // In future: enqueue RFQ job here (email/integration). For now, mark status.
    await prisma.requestItem.update({ where: { id: itemId }, data: { status: "RFQ_SENT" } });
    const updated = await loadRequestWithMeta(id);
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items/:itemId/rfq failed", err);
    res.status(500).json({ error: "Failed to send RFQ" });
  }
});

// Alias endpoint for explicit RFQ send path
router.post("/:id/items/:itemId/rfq/send", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    await prisma.requestItem.update({ where: { id: itemId }, data: { status: "RFQ_SENT" } });
    const updated = await loadRequestWithMeta(id);
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items/:itemId/rfq/send failed", err);
    res.status(500).json({ error: "Failed to send RFQ" });
  }
});

// Delete a single item
router.delete("/:id/items/:itemId", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    await prisma.requestItem.delete({ where: { id: itemId } });
    await recalcQuantity(id);

    const updated = await loadRequestWithMeta(id);
    return res.json(updated);
  } catch (err) {
    console.error("DELETE /api/requests/:id/items/:itemId failed", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Replace all items (bulk)
router.put("/:id/items", async (req, res) => {
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
    return res.json(updated);
  } catch (err) {
    console.error("PUT /api/requests/:id/items failed", err);
    res.status(500).json({ error: "Failed to replace items" });
  }
});

// Delete request
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid request id" });
    }
    await prisma.requestItem.deleteMany({ where: { requestId: id } });
    await prisma.request.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete request" });
  }
});

export default router;