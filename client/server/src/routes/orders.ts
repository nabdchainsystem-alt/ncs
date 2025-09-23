import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

console.log('Orders router loaded');

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(SERVER_ROOT, 'tmp');
const STORE_PATH = path.join(DATA_DIR, 'rfq-orders.json');

const ah = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

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
  createdAt: string;
  updatedAt: string;
  locked?: boolean;
  items: Array<{
    id: number;
    materialNo: string | null;
    description: string | null;
    qty: number;
    unit: string | null;
    unitPriceSar: number;
    lineTotalSar: number;
    createdAt: string;
    updatedAt: string;
  }>;
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
  items: Array<{
    id: number;
    materialNo: string | null;
    description: string | null;
    qty: number;
    unit: string | null;
    unitPriceSar: number;
    lineTotalSar: number;
  }>;
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
    return {
      rfqs: Array.isArray(parsed.rfqs) ? parsed.rfqs : [],
      purchaseOrders: Array.isArray(parsed.purchaseOrders) ? parsed.purchaseOrders : [],
      counters: parsed.counters ?? { rfq: 1, rfqItem: 1, purchaseOrder: 1, purchaseOrderItem: 1 },
    };
  } catch (error) {
    console.error('[orders] Failed to parse store file, resetting', error);
    const empty = defaultStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
}

function saveStore(store: StoreShape) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

type IdLike = string | number | undefined;

function parseId(value: IdLike): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error('Invalid id');
  }
  return numeric;
}

function mapOrder(order: StoredPurchaseOrder) {
  return {
    id: String(order.id),
    orderNo: order.orderNo,
    status: order.status,
    completed: order.completed,
    department: order.department,
    machine: order.machine,
    poDate: order.poDate,
    totalAmountSar: order.totalAmountSar,
    requestId: order.requestId != null ? String(order.requestId) : null,
    requestNo: order.requestOrderNo,
    vendorId: order.vendorId != null ? String(order.vendorId) : null,
    vendorName: order.vendorName,
    vendor: order.vendorName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    request: order.requestId != null
      ? { id: String(order.requestId), orderNo: order.requestOrderNo, department: order.department }
      : null,
    items: order.items.map((item) => ({
      id: String(item.id),
      materialNo: item.materialNo,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      unitPriceSar: item.unitPriceSar,
      lineTotalSar: item.lineTotalSar,
    })),
  };
}

router.get('/', (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const store = loadStore();
    const orders = includeDeleted ? store.purchaseOrders : store.purchaseOrders.filter((po) => !po.isDeleted);
    const payload = orders
      .map(mapOrder)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(payload);
  } catch (error) {
    console.error('GET /api/orders failed', error);
    res.status(500).json({ error: 'orders_list_failed' });
  }
});

router.get('/analytics/spend-by-machine', (req, res) => {
  try {
    const store = loadStore();
    const totals = new Map<string, number>();
    store.purchaseOrders
      .filter((po) => !po.isDeleted)
      .forEach((order) => {
        const machine = order.machine && order.machine.trim() ? order.machine.trim() : 'Unassigned';
        const total = order.items.reduce((sum, item) => sum + item.lineTotalSar, 0);
        totals.set(machine, (totals.get(machine) ?? 0) + total);
      });
    const result = Array.from(totals.entries())
      .map(([machine, totalSar]) => ({ machine, totalSar: Math.round(totalSar * 100) / 100 }))
      .sort((a, b) => b.totalSar - a.totalSar);
    res.json(result);
  } catch (error) {
    console.error('GET /api/orders/analytics/spend-by-machine failed', error);
    res.status(500).json({ error: 'orders_spend_by_machine_failed' });
  }
});

router.get('/analytics/status', (req, res) => {
  try {
    const store = loadStore();
    const buckets = {
      Pending: 0,
      Completed: 0,
      OnHold: 0,
      New: 0,
    } as Record<string, number>;

    store.purchaseOrders
      .filter((po) => !po.isDeleted)
      .forEach((order) => {
        const status = String(order.status ?? '').toLowerCase();
        if (order.completed || status.includes('complete') || status.includes('closed')) {
          buckets.Completed += 1;
        } else if (status.includes('hold')) {
          buckets.OnHold += 1;
        } else if (status.includes('pending') || status.includes('await')) {
          buckets.Pending += 1;
        } else {
          buckets.New += 1;
        }
      });

    const response = Object.entries(buckets).map(([name, value]) => ({ name, value }));
    res.json(response);
  } catch (error) {
    console.error('GET /api/orders/analytics/status failed', error);
    res.status(500).json({ error: 'orders_status_analytics_failed' });
  }
});

router.get('/analytics/by-category', (req, res) => {
  try {
    const store = loadStore();
    const totals = new Map<string, number>();

    store.purchaseOrders
      .filter((po) => !po.isDeleted && po.completed)
      .forEach((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        let category = '';
        for (const item of items) {
          if (item.description && item.description.trim()) {
            category = item.description.trim();
            break;
          }
          if (item.materialNo && item.materialNo.trim()) {
            category = item.materialNo.trim();
            break;
          }
        }
        if (!category) {
          category = order.department?.trim() || 'Unassigned';
        }

        const lineTotal = items.reduce((sum, item) => sum + Number(item.lineTotalSar ?? 0), 0);
        const amount = lineTotal || Number(order.totalAmountSar ?? 0) || 0;

        totals.set(category, (totals.get(category) ?? 0) + amount);
      });

    const response = Array.from(totals.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);

    res.json(response);
  } catch (error) {
    console.error('GET /api/orders/analytics/by-category failed', error);
    res.status(500).json({ error: 'orders_category_analytics_failed' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    const store = loadStore();
    const order = store.purchaseOrders.find((entry) => entry.id === id && !entry.isDeleted);
    if (!order) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    res.json(mapOrder(order));
  } catch (error) {
    console.error('GET /api/orders/:id failed', error);
    res.status(500).json({ error: 'orders_detail_failed' });
  }
});

router.patch('/:id', ah(async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const store = loadStore();
    const order = store.purchaseOrders.find((entry) => entry.id === id && !entry.isDeleted);
    if (!order) {
      return res.status(404).json({ error: 'order_not_found' });
    }

    const previousCompleted = order.completed;

    if (req.body?.status !== undefined) order.status = String(req.body.status);
    if (req.body?.completed !== undefined) order.completed = Boolean(req.body.completed);
    if (req.body?.department !== undefined) order.department = req.body.department ?? null;
    if (req.body?.machine !== undefined) order.machine = req.body.machine ?? null;
    if (req.body?.poDate !== undefined) order.poDate = req.body.poDate ?? null;
    if (req.body?.totalAmountSar !== undefined) order.totalAmountSar = Number(req.body.totalAmountSar) || 0;

    if (previousCompleted !== order.completed && order.quotationId != null) {
      const rfq = store.rfqs.find((entry) => entry.id === order.quotationId);
      if (rfq) {
        rfq.locked = order.completed;
        rfq.status = order.completed ? 'Completed' : 'SentToPO';
        rfq.updatedAt = new Date().toISOString();
      }
    }

    if (previousCompleted !== order.completed && order.requestId != null) {
      try {
        await prisma.request.update({
          where: { id: order.requestId },
          data: { status: order.completed ? 'COMPLETED' : 'APPROVED' },
        });
      } catch (error) {
        console.warn('[orders] Failed to update request status', error);
      }
    }

    order.updatedAt = new Date().toISOString();
    saveStore(store);

    res.json(mapOrder(order));
  } catch (error) {
    console.error('PATCH /api/orders/:id failed', error);
    res.status(500).json({ error: 'orders_update_failed' });
  }
}));

router.delete('/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    const store = loadStore();
    const order = store.purchaseOrders.find((entry) => entry.id === id && !entry.isDeleted);
    if (!order) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    order.isDeleted = true;
    order.updatedAt = new Date().toISOString();

    if (order.quotationId != null) {
      const rfq = store.rfqs.find((entry) => entry.id === order.quotationId);
      if (rfq && !rfq.isDeleted) {
        rfq.isDeleted = true;
        rfq.status = 'Deleted';
        rfq.updatedAt = new Date().toISOString();
      }
    }

    saveStore(store);
    res.json(mapOrder(order));
  } catch (error) {
    console.error('DELETE /api/orders/:id failed', error);
    res.status(500).json({ error: 'orders_delete_failed' });
  }
});

export default router;
