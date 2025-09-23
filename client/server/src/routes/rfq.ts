import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
const router = Router();

const ah = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

console.log('RFQ router loaded');

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(SERVER_ROOT, 'tmp');
const STORE_PATH = path.join(DATA_DIR, 'rfq-orders.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

type StoredRfqItem = {
  id: number;
  materialNo: string | null;
  description: string | null;
  qty: number;
  unit: string | null;
  unitPriceSar: number;
  lineTotalSar: number;
  createdAt: string;
  updatedAt: string;
};

type StoredRfq = {
  id: number;
  quotationNo: string | null;
  requestId: number;
  requestOrderNo: string | null;
  vendorId: number | null;
  vendorName: string | null;
  status: string;
  totalSar: number;
  isDeleted: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
  items: StoredRfqItem[];
};

type StoredPurchaseOrderItem = {
  id: number;
  materialNo: string | null;
  description: string | null;
  qty: number;
  unit: string | null;
  unitPriceSar: number;
  lineTotalSar: number;
};

type StoredPurchaseOrder = {
  id: number;
  orderNo: string;
  quotationId: number | null;
  requestId: number | null;
  requestOrderNo: string | null;
  vendorId: number | null;
  vendorName: string | null;
  department: string | null;
  machine: string | null;
  status: string;
  completed: boolean;
  poDate: string;
  totalAmountSar: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  items: StoredPurchaseOrderItem[];
};

type StoreShape = {
  rfqs: StoredRfq[];
  purchaseOrders: StoredPurchaseOrder[];
  counters: {
    rfq: number;
    rfqItem: number;
    purchaseOrder: number;
    purchaseOrderItem: number;
  };
};

function defaultStore(): StoreShape {
  return {
    rfqs: [],
    purchaseOrders: [],
    counters: { rfq: 1, rfqItem: 1, purchaseOrder: 1, purchaseOrderItem: 1 },
  };
}

function loadStore(): StoreShape {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    const empty = defaultStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as StoreShape;
    const rfqs = Array.isArray(parsed.rfqs) ? parsed.rfqs : [];
    const purchaseOrders = Array.isArray(parsed.purchaseOrders) ? parsed.purchaseOrders : [];
    return {
      rfqs: rfqs.map((rfq) => ({
        ...rfq,
        locked: Boolean((rfq as any).locked),
        items: Array.isArray(rfq.items)
          ? rfq.items.map((item) => ({
              ...item,
              createdAt: item?.createdAt ?? new Date().toISOString(),
              updatedAt: item?.updatedAt ?? new Date().toISOString(),
            }))
          : [],
      })),
      purchaseOrders,
      counters: parsed.counters ?? { rfq: 1, rfqItem: 1, purchaseOrder: 1, purchaseOrderItem: 1 },
    };
  } catch (error) {
    console.error('[rfq] Failed to parse store file, resetting', error);
    const empty = defaultStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
}

function saveStore(store: StoreShape) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function nextCounter(store: StoreShape, key: keyof StoreShape['counters']): number {
  const value = store.counters[key] ?? 1;
  store.counters[key] = value + 1;
  return value;
}

function parseId(value: unknown, label: string): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`Invalid ${label}`);
  }
  return numeric;
}

function computeLineTotal(qty?: number | null, unitPriceSar?: number | null) {
  const q = Number(qty ?? 0);
  const p = Number(unitPriceSar ?? 0);
  return Math.round(q * p * 100) / 100;
}

async function getRequestInfo(requestId: number) {
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return { orderNo: null, department: null };
  }
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { orderNo: true, department: true },
  });
  return {
    orderNo: request?.orderNo ?? null,
    department: request?.department ?? null,
  };
}

function mapStoredRfq(rfq: StoredRfq, requestInfo: { orderNo: string | null; department: string | null }) {
  return {
    id: String(rfq.id),
    quotationNo: rfq.quotationNo,
    status: rfq.status,
    totalSar: rfq.totalSar,
    requestId: String(rfq.requestId),
    requestNo: requestInfo.orderNo,
    vendorId: rfq.vendorId != null ? String(rfq.vendorId) : null,
    vendorName: rfq.vendorName,
    locked: Boolean(rfq.locked),
    createdAt: rfq.createdAt,
    updatedAt: rfq.updatedAt,
    request: {
      id: String(rfq.requestId),
      orderNo: requestInfo.orderNo,
      department: requestInfo.department,
    },
    items: rfq.items.map((item) => ({
      id: String(item.id),
      materialNo: item.materialNo,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      unitPriceSar: item.unitPriceSar,
      lineTotalSar: item.lineTotalSar,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  };
}

router.get('/', ah(async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const store = loadStore();
    const rfqs = includeDeleted ? store.rfqs : store.rfqs.filter((rfq) => !rfq.isDeleted);
    const payload = await Promise.all(
      rfqs.map(async (rfq) => mapStoredRfq(rfq, await getRequestInfo(rfq.requestId)))
    );
    payload.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(payload);
  } catch (error) {
    console.error('GET /api/rfq failed', error);
    res.status(500).json({ error: 'rfq_list_failed' });
  }
}));

router.get('/:id', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id, 'id');
    const store = loadStore();
    const rfq = store.rfqs.find((entry) => entry.id === id && !entry.isDeleted);
    if (!rfq) {
      return res.status(404).json({ error: 'quotation_not_found' });
    }
    const payload = mapStoredRfq(rfq, await getRequestInfo(rfq.requestId));
    res.json(payload);
  } catch (error) {
    console.error('GET /api/rfq/:id failed', error);
    res.status(500).json({ error: 'rfq_detail_failed' });
  }
}));

router.post('/', ah(async (req, res) => {
  try {
    const requestId = parseId(req.body?.requestId, 'requestId');
    const vendorId = req.body?.vendorId ? parseId(req.body.vendorId, 'vendorId') : null;

    const store = loadStore();
    const existing = store.rfqs.find(
      (entry) => !entry.isDeleted && entry.requestId === requestId && (vendorId ? entry.vendorId === vendorId : true)
    );
    if (existing) {
      const payload = mapStoredRfq(existing, await getRequestInfo(existing.requestId));
      return res.json(payload);
    }

    const request = await prisma.request.findFirst({
      where: { id: requestId, NOT: { status: 'Deleted' } },
      include: { items: true },
    });
    if (!request) {
      return res.status(404).json({ error: 'request_not_found' });
    }

    const items: StoredRfqItem[] = (request.items ?? []).map((item) => {
      let materialNo: string | null = null;
      let unit: string | null = null;
      let qty = Number(item.qty ?? 0) || 0;
      try {
        const meta = item.note ? JSON.parse(item.note) : {};
        if (meta && typeof meta === 'object') {
          materialNo = meta.code ?? null;
          unit = meta.unit ?? null;
          if (meta.qty != null) qty = Number(meta.qty) || 0;
        }
      } catch {
        /* ignore */
      }
      materialNo = materialNo ?? item.code ?? item.name ?? `REQ-${item.id}`;
      unit = unit ?? item.unit ?? null;
      const now = new Date().toISOString();
      return {
        id: nextCounter(store, 'rfqItem'),
        materialNo,
        description: item.name ?? (item as any).description ?? null,
        qty,
        unit,
        unitPriceSar: 0,
        lineTotalSar: 0,
        createdAt: now,
        updatedAt: now,
      } satisfies StoredRfqItem;
    });

    const now = new Date().toISOString();
    const rfq: StoredRfq = {
      id: nextCounter(store, 'rfq'),
      quotationNo: null,
      requestId,
      requestOrderNo: request.orderNo ?? null,
      vendorId,
      vendorName: null,
      status: 'Draft',
      totalSar: 0,
      isDeleted: false,
      locked: false,
      createdAt: now,
      updatedAt: now,
      items,
    };

    store.rfqs.push(rfq);
    saveStore(store);

    const payload = mapStoredRfq(rfq, { orderNo: rfq.requestOrderNo, department: request.department ?? null });
    res.json(payload);
  } catch (error) {
    console.error('POST /api/rfq failed', error);
    res.status(500).json({ error: 'rfq_create_failed' });
  }
}));

router.patch('/:id', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id, 'id');
    const store = loadStore();
    const rfq = store.rfqs.find((entry) => entry.id === id && !entry.isDeleted);
    if (!rfq) {
      return res.status(404).json({ error: 'quotation_not_found' });
    }

    if (req.body?.quotationNo !== undefined) rfq.quotationNo = req.body.quotationNo ?? null;
    if (req.body?.status !== undefined) rfq.status = String(req.body.status);
    if (req.body?.vendorId !== undefined) {
      rfq.vendorId = req.body.vendorId === null || req.body.vendorId === '' ? null : parseId(req.body.vendorId, 'vendorId');
    }
    if (req.body?.vendorName !== undefined) rfq.vendorName = req.body.vendorName ?? null;
    if (req.body?.isDeleted !== undefined) rfq.isDeleted = Boolean(req.body.isDeleted);
    if (req.body?.locked !== undefined) rfq.locked = Boolean(req.body.locked);

    rfq.totalSar = rfq.items.reduce((sum, entry) => sum + entry.lineTotalSar, 0);
    rfq.updatedAt = new Date().toISOString();
    saveStore(store);

    const requestInfo = await getRequestInfo(rfq.requestId);
    const payload = mapStoredRfq(rfq, requestInfo);
    res.json(payload);
  } catch (error) {
    console.error('PATCH /api/rfq/:id failed', error);
    res.status(500).json({ error: 'rfq_update_failed' });
  }
}));

router.delete('/:id', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id, 'id');
    const store = loadStore();
    const rfq = store.rfqs.find((entry) => entry.id === id);
    if (!rfq) {
      return res.status(404).json({ error: 'quotation_not_found' });
    }
    const hasPo = store.purchaseOrders.some((po) => po.quotationId === rfq.id && !po.isDeleted);
    if (hasPo) {
      return res.status(400).json({ error: 'rfq_has_po', message: 'Cannot delete RFQ with linked purchase orders' });
    }
    rfq.isDeleted = true;
    rfq.updatedAt = new Date().toISOString();
    saveStore(store);
    const payload = mapStoredRfq(rfq, await getRequestInfo(rfq.requestId));
    res.json(payload);
  } catch (error) {
    console.error('DELETE /api/rfq/:id failed', error);
    res.status(500).json({ error: 'rfq_delete_failed' });
  }
}));

router.post('/:id/items', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id, 'id');
    const store = loadStore();
    const rfq = store.rfqs.find((entry) => entry.id === id && !entry.isDeleted);
    if (!rfq) {
      return res.status(404).json({ error: 'quotation_not_found' });
    }

    const payload = req.body ?? {};
    if (!payload.materialNo && !payload.description) {
      return res.status(400).json({ error: 'materialNo_required' });
    }

    const qty = Number(payload.qty ?? 0) || 0;
    const unitPrice = Number(payload.unitPriceSar ?? 0) || 0;
    const now = new Date().toISOString();
    const item: StoredRfqItem = {
      id: nextCounter(store, 'rfqItem'),
      materialNo: payload.materialNo ?? null,
      description: payload.description ?? null,
      qty,
      unit: payload.unit ?? null,
      unitPriceSar: unitPrice,
      lineTotalSar: computeLineTotal(qty, unitPrice),
      createdAt: now,
      updatedAt: now,
    };
    rfq.items.push(item);
    rfq.totalSar = rfq.items.reduce((sum, entry) => sum + entry.lineTotalSar, 0);
    rfq.updatedAt = now;

    saveStore(store);

    const payloadResponse = mapStoredRfq(rfq, await getRequestInfo(rfq.requestId));
    res.json(payloadResponse);
  } catch (error) {
    console.error('POST /api/rfq/:id/items failed', error);
    res.status(500).json({ error: 'rfq_add_item_failed' });
  }
}));

router.patch('/:id/items/:itemId', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id, 'id');
    const itemId = parseId(req.params.itemId, 'itemId');
    const store = loadStore();
    const rfq = store.rfqs.find((entry) => entry.id === id && !entry.isDeleted);
    if (!rfq) {
      return res.status(404).json({ error: 'quotation_not_found' });
    }
    const item = rfq.items.find((entry) => entry.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'quotation_item_not_found' });
    }

    if (req.body?.materialNo !== undefined) item.materialNo = req.body.materialNo ?? null;
    if (req.body?.description !== undefined) item.description = req.body.description ?? null;
    if (req.body?.unit !== undefined) item.unit = req.body.unit ?? null;
    if (req.body?.qty !== undefined) item.qty = Number(req.body.qty) || 0;
    if (req.body?.unitPriceSar !== undefined) item.unitPriceSar = Number(req.body.unitPriceSar) || 0;
    item.lineTotalSar = computeLineTotal(item.qty, item.unitPriceSar);
    item.updatedAt = new Date().toISOString();
    rfq.totalSar = rfq.items.reduce((sum, entry) => sum + entry.lineTotalSar, 0);
    rfq.updatedAt = new Date().toISOString();

    saveStore(store);

    const payload = mapStoredRfq(rfq, await getRequestInfo(rfq.requestId));
    res.json(payload);
  } catch (error) {
    console.error('PATCH /api/rfq/:id/items/:itemId failed', error);
    res.status(500).json({ error: 'rfq_update_item_failed' });
  }
}));

router.delete('/:id/items/:itemId', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id, 'id');
    const itemId = parseId(req.params.itemId, 'itemId');
    const store = loadStore();
    const rfq = store.rfqs.find((entry) => entry.id === id && !entry.isDeleted);
    if (!rfq) {
      return res.status(404).json({ error: 'quotation_not_found' });
    }
    const originalLength = rfq.items.length;
    rfq.items = rfq.items.filter((entry) => entry.id !== itemId);
    if (rfq.items.length === originalLength) {
      return res.status(404).json({ error: 'quotation_item_not_found' });
    }
    rfq.totalSar = rfq.items.reduce((sum, entry) => sum + entry.lineTotalSar, 0);
    rfq.updatedAt = new Date().toISOString();
    saveStore(store);
    const payload = mapStoredRfq(rfq, await getRequestInfo(rfq.requestId));
    res.json(payload);
  } catch (error) {
    console.error('DELETE /api/rfq/:id/items/:itemId failed', error);
    res.status(500).json({ error: 'rfq_delete_item_failed' });
  }
}));

router.post('/:id/send-to-po', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id, 'id');
    const rawOrderNo = typeof req.body?.orderNo === 'string' ? req.body.orderNo.trim() : '';
    const store = loadStore();
    const rfq = store.rfqs.find((entry) => entry.id === id && !entry.isDeleted);
    if (!rfq) {
      return res.status(404).json({ error: 'quotation_not_found' });
    }

    const request = await prisma.request.findUnique({
      where: { id: rfq.requestId },
      include: { items: true },
    });

    const orderNo = rawOrderNo || `PO-${Date.now()}`;
    const machine = (() => {
      const requestMachine = (request as any)?.machine;
      if (typeof requestMachine === 'string' && requestMachine.trim()) return requestMachine.trim();
      for (const item of request?.items ?? []) {
        const itemMachine = (item as any)?.machine;
        if (typeof itemMachine === 'string' && itemMachine.trim()) return itemMachine.trim();
        try {
          const meta = item.note ? JSON.parse(item.note) : {};
          if (meta?.machine && String(meta.machine).trim()) return String(meta.machine).trim();
        } catch {
          /* ignore */
        }
      }
      return null;
    })();

    const poItems: StoredPurchaseOrderItem[] = rfq.items.map((item) => ({
      id: nextCounter(store, 'purchaseOrderItem'),
      materialNo: item.materialNo,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      unitPriceSar: item.unitPriceSar,
      lineTotalSar: item.lineTotalSar,
    }));

    const totalAmountSar = poItems.reduce((sum, entry) => sum + entry.lineTotalSar, 0);
    const now = new Date().toISOString();
    const po: StoredPurchaseOrder = {
      id: nextCounter(store, 'purchaseOrder'),
      orderNo,
      quotationId: rfq.id,
      requestId: rfq.requestId,
      requestOrderNo: request?.orderNo ?? rfq.requestOrderNo ?? null,
      vendorId: rfq.vendorId,
      vendorName: rfq.vendorName,
      department: request?.department ?? null,
      machine,
      status: 'Pending',
      completed: false,
      poDate: now,
      totalAmountSar,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      items: poItems,
    };

    store.purchaseOrders.push(po);
    rfq.status = 'SentToPO';
    rfq.totalSar = totalAmountSar;
    rfq.updatedAt = now;
    if (request?.orderNo) {
      rfq.requestOrderNo = request.orderNo;
    }

    saveStore(store);

    res.json({ poId: po.id });
  } catch (error) {
    console.error('POST /api/rfq/:id/send-to-po failed', error);
    res.status(500).json({ error: 'rfq_send_to_po_failed' });
  }
}));

export default router;
