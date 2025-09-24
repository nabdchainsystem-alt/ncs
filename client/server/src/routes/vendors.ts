import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
const router = Router();

const sendVendorCards = (res: Response, extra: Record<string, unknown> = {}) => {
  res.json({ cards: [], ...extra });
};

const sendVendorAnalytics = (res: Response) => {
  res.json({ series: [], labels: [], table: [] });
};

router.get('/kpis', (_req: Request, res: Response) => {
  sendVendorCards(res);
});

['/analytics/top-spend', '/analytics/monthly-spend', '/analytics/status-mix'].forEach((path) => {
  router.get(path, (_req: Request, res: Response) => {
    sendVendorAnalytics(res);
  });
});

const ah = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Helpers
const parseNumber = (v: any) => (v === undefined || v === null || v === '' ? undefined : Number(v));
const parseBool = (v: any) => (v === 'true' ? true : v === 'false' ? false : undefined);

// Query builder reused by list & export
function buildListQuery(req: Request) {
  const {
    q,
    status,
    category,
    region,
    minTrust,
    onTimeMin,
    priceIndexMax,
    hasISO,
    page = '1',
    pageSize = '20',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, Number(page) || 1);
  const take = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const skip = (pageNum - 1) * take;

  const where: any = {};
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }];
  if (status && status !== 'all') where.status = status;
  if (minTrust) where.trustScore = { gte: Number(minTrust) };
  if (onTimeMin) where.onTimePct = { gte: Number(onTimeMin) };
  if (priceIndexMax) where.priceIndex = { lte: Number(priceIndexMax) };
  if (hasISO !== undefined) {
    const b = parseBool(hasISO);
    if (b !== undefined) where.documents = { some: { type: { contains: 'ISO' }, valid: b } };
  }

  const categoriesLike = category ? String(category).toLowerCase() : undefined;
  const regionsLike = region ? String(region).toLowerCase() : undefined;

  return { where, pageNum, take, skip, categoriesLike, regionsLike };
}

function likeFilter(items: any[], categoriesLike?: string, regionsLike?: string) {
  return items.filter((v) => {
    const cOk = categoriesLike ? (v.categoriesJson || '').toLowerCase().includes(categoriesLike) : true;
    const rOk = regionsLike ? (v.regionsJson || '').toLowerCase().includes(regionsLike) : true;
    return cOk && rOk;
  });
}

// Minimal CSV parser (supports quoted fields), returns array of objects from header row
function parseCSV(text: string): any[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCSVLine(lines[0]);
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const obj: any = {};
    headers.forEach((h, idx) => (obj[h.trim()] = cols[idx] !== undefined ? cols[idx] : ''));
    rows.push(obj);
  }
  return rows;
}
function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQ = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function mapImportedRow(row: any) {
  // expected columns: code, name, status, categories, regions
  const cat = row.categories || row.category || '';
  const reg = row.regions || row.region || '';
  const parseList = (v: string) =>
    Array.isArray(v)
      ? v
      : String(v || '')
          .split(/[|,]/)
          .map((x) => x.trim())
          .filter(Boolean);
  return {
    code: String(row.code || '').trim(),
    name: String(row.name || '').trim(),
    status: row.status && String(row.status).trim() ? String(row.status).trim() : 'Pending',
    categories: parseList(cat),
    regions: parseList(reg),
  };
}

function toVendorsCSV(items: any[]): string {
  const headers = ['id','code','name','status','categories','regions','onTimePct','leadTimeAvgDays','qualityPpm','priceIndex','quoteRespHrs','trustScore'];
  const lines = [headers.join(',')];
  for (const v of items) {
    const row = [
      v.id,
      csvSafe(v.code),
      csvSafe(v.name),
      csvSafe(v.status),
      csvSafe(v.categoriesJson || ''),
      csvSafe(v.regionsJson || ''),
      v.onTimePct ?? '',
      v.leadTimeAvgDays ?? '',
      v.qualityPpm ?? '',
      v.priceIndex ?? '',
      v.quoteRespHrs ?? '',
      v.trustScore ?? '',
    ];
    lines.push(row.join(','));
  }
  return lines.join('\n');
}
function csvSafe(v: any) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// -------------------------
// REST
// -------------------------
// GET /api/vendors?status=&category=&region=&minTrust=&onTimeMin=&priceIndexMax=&hasISO=&q=&page=&pageSize=
router.get('/', ah(async (req: Request, res: Response) => {
  try {
    const { where, pageNum, take, skip, categoriesLike, regionsLike } = buildListQuery(req);

    const [items, total] = await Promise.all([
      prisma.vendor.findMany({ where, skip, take, orderBy: [{ trustScore: 'desc' }, { name: 'asc' }] }),
      prisma.vendor.count({ where }),
    ]);

    const filtered = likeFilter(items, categoriesLike, regionsLike);

    // KPIs summary (simple aggregates on filtered page slice)
    const sum = (arr: any[], key: string) => arr.reduce((s, x) => s + (Number(x?.[key]) || 0), 0);
    const countStatus = (s: string) => filtered.filter((v) => String(v.status).toLowerCase().includes(s)).length;

    const kpis = {
      total: total,
      approved: countStatus('approved'),
      pending: countStatus('pending'),
      onHold: countStatus('hold'),
      avgLeadTime: filtered.length ? Number((sum(filtered, 'leadTimeAvgDays') / filtered.length).toFixed(1)) : 0,
      onTimePct: filtered.length ? Number((sum(filtered, 'onTimePct') / filtered.length).toFixed(1)) : 0,
      complaints30d: 0, // placeholder unless you track complaints table
      avgTrust: filtered.length ? Number((sum(filtered, 'trustScore') / filtered.length).toFixed(1)) : 0,
      avgQuoteRespHrs: filtered.length ? Number((sum(filtered, 'quoteRespHrs') / filtered.length).toFixed(1)) : 0,
    };

    // Alerts summary (very lightweight heuristics)
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 1);
    const expiringDocsCount = await prisma.vendorDocument.count({ where: { expiry: { lte: soon }, valid: true } });
    const qualityLateCount = filtered.filter((v) => (v.onTimePct ?? 100) < 80 || (v.qualityPpm ?? 0) > 1500).length;
    const singleSourceCount = filtered.filter((v) => {
      try { const cats = JSON.parse(v.categoriesJson || '[]'); return Array.isArray(cats) && cats.length <= 1; } catch { return false; }
    }).length;
    const carbonFlagsCount = filtered.filter((v) => (v.avgCO2perOrder ?? 0) > 50).length;

    const alerts = {
      expiringDocs: expiringDocsCount,
      singleSource: singleSourceCount,
      qualityLate: qualityLateCount,
      carbonFlags: carbonFlagsCount,
    };

    res.json({ items: filtered, page: pageNum, pageSize: take, total, kpis, alerts });
  } catch (e) {
    res.status(500).json({ error: 'vendors_list_failed' });
  }
}));

// POST /api/vendors (onboard)
router.post('/', ah(async (req: Request, res: Response) => {
  try {
    const data = req.body || {};
    const created = await prisma.vendor.create({
      data: {
        code: data.code,
        name: data.name,
        status: data.status || 'Pending',
        categoriesJson: data.categories ? JSON.stringify(data.categories) : null,
        regionsJson: data.regions ? JSON.stringify(data.regions) : null,
        contactsJson: data.contacts ? JSON.stringify(data.contacts) : null,
        bankJson: data.bank ? JSON.stringify(data.bank) : null,
        onTimePct: parseNumber(data.metrics?.onTimePct),
        leadTimeAvgDays: data.metrics?.leadTimeAvgDays ?? null,
        qualityPpm: parseNumber(data.metrics?.qualityPpm),
        priceIndex: parseNumber(data.metrics?.priceIndex),
        quoteRespHrs: parseNumber(data.metrics?.quoteRespHrs),
        trustScore: parseNumber(data.trustScore),
        prefIncoterms: data.logistics?.prefIncoterms ?? null,
        shipModesJson: data.logistics?.shipModes ? JSON.stringify(data.logistics.shipModes) : null,
        avgCO2perOrder: parseNumber(data.logistics?.avgCO2perOrder),
      },
    });
    res.status(201).json(created);
  } catch (e: any) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ error: 'duplicate_code' });
    res.status(500).json({ error: 'vendor_create_failed' });
  }
}));

// PATCH /api/vendors/:id
router.patch('/:id', ah(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = req.body || {};
    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        status: data.status,
        categoriesJson: data.categories ? JSON.stringify(data.categories) : undefined,
        regionsJson: data.regions ? JSON.stringify(data.regions) : undefined,
        contactsJson: data.contacts ? JSON.stringify(data.contacts) : undefined,
        bankJson: data.bank ? JSON.stringify(data.bank) : undefined,
        onTimePct: parseNumber(data.metrics?.onTimePct),
        leadTimeAvgDays: data.metrics?.leadTimeAvgDays ?? undefined,
        qualityPpm: parseNumber(data.metrics?.qualityPpm),
        priceIndex: parseNumber(data.metrics?.priceIndex),
        quoteRespHrs: parseNumber(data.metrics?.quoteRespHrs),
        trustScore: parseNumber(data.trustScore),
        prefIncoterms: data.logistics?.prefIncoterms ?? undefined,
        shipModesJson: data.logistics?.shipModes ? JSON.stringify(data.logistics.shipModes) : undefined,
        avgCO2perOrder: parseNumber(data.logistics?.avgCO2perOrder),
      },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'vendor_update_failed' });
  }
}));

// GET /api/vendors/:id/performance
router.get('/:id/performance', ah(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { from, to } = req.query as Record<string, string>;
    const where: any = { vendorId: id };
    if (from) where.month = { gte: new Date(from) };
    if (to) where.month = { ...(where.month || {}), lte: new Date(to) };
    const rows = await prisma.vendorPerformanceHistory.findMany({ where, orderBy: { month: 'asc' } });
    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ error: 'vendor_performance_failed' });
  }
}));

// Documents (simple JSON metadata upload – not binary for now)
router.get('/:id/documents', ah(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const docs = await prisma.vendorDocument.findMany({ where: { vendorId: id }, orderBy: { createdAt: 'desc' } });
    res.json({ items: docs });
  } catch (e) {
    res.status(500).json({ error: 'vendor_documents_failed' });
  }
}));

router.post('/:id/documents', ah(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { type, number, expiry, fileUrl, valid } = req.body || {};
    const doc = await prisma.vendorDocument.create({
      data: { vendorId: id, type, number, expiry: expiry ? new Date(expiry) : null, fileUrl: fileUrl || null, valid },
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: 'vendor_upload_document_failed' });
  }
}));

// Products
router.get('/:id/products', ah(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const items = await prisma.vendorProduct.findMany({ where: { vendorId: id } });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'vendor_products_failed' });
  }
}));

router.patch('/:id/products', ah(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const products = (req.body?.products || []) as any[];

    // simple upsert by itemCode
    const ops = products.map((p) =>
      prisma.vendorProduct.upsert({
        where: { vendorId_itemCode: { vendorId: id, itemCode: String(p.itemCode) } as any },
        update: {
          price: parseNumber(p.price),
          currency: p.currency || 'SAR',
          lastQuotedAt: p.lastQuotedAt ? new Date(p.lastQuotedAt) : undefined,
          moq: p.moq ?? undefined,
          leadTimeDays: p.leadTimeDays ?? undefined,
        },
        create: {
          vendorId: id,
          itemCode: String(p.itemCode),
          price: parseNumber(p.price),
          currency: p.currency || 'SAR',
          lastQuotedAt: p.lastQuotedAt ? new Date(p.lastQuotedAt) : null,
          moq: p.moq ?? null,
          leadTimeDays: p.leadTimeDays ?? null,
        },
      })
    );

    await prisma.$transaction(ops);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'vendor_update_products_failed' });
  }
}));

// -------------------------
// Tools / Actions
// -------------------------
// Recompute trust score (simple formula based on metrics)
router.post('/recompute-trust', ah(async (_req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany();
    const updates = vendors.map((v) => {
      const otd = v.onTimePct ?? 0; // 35%
      const quality = v.qualityPpm != null ? Math.max(0, 100 - Math.min(100, (v.qualityPpm / 1000) * 100)) : 0; // naive
      const response = v.quoteRespHrs != null ? Math.max(0, 100 - Math.max(0, (v.quoteRespHrs - 24) * 2)) : 0; // <=24h ~100
      const price = v.priceIndex != null ? Math.max(0, 100 - Math.abs(v.priceIndex - 100)) : 0; // closer to 100 is better
      const penalty = 0; // placeholder
      const score = 0.35 * otd + 0.25 * quality + 0.15 * response + 0.15 * price + 0.1 * (100 - penalty);
      return prisma.vendor.update({ where: { id: v.id }, data: { trustScore: Number(score.toFixed(2)) } });
    });
    await prisma.$transaction(updates);
    res.json({ ok: true, updated: updates.length });
  } catch (e) {
    res.status(500).json({ error: 'vendors_recompute_trust_failed' });
  }
}));

router.post('/risk-scan', ah(async (_req: Request, res: Response) => {
  try {
    // Placeholder: mark high risk if onTimePct < 70 or leadTimeAvgDays > 30
    const items = await prisma.vendor.findMany({
      where: {
        OR: [{ onTimePct: { lt: 70 } }, { leadTimeAvgDays: { gt: 30 } }],
      },
      orderBy: { onTimePct: 'asc' },
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'vendors_risk_scan_failed' });
  }
}));

router.post('/compliance-report', ah(async (_req: Request, res: Response) => {
  try {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 1);
    const expiring = await prisma.vendorDocument.findMany({ where: { expiry: { lte: soon }, valid: true } });
    res.json({ expiring });
  } catch (e) {
    res.status(500).json({ error: 'vendors_compliance_failed' });
  }
}));

router.post('/carbon-estimate', ah(async (req: Request, res: Response) => {
  try {
    const { vendorIds = [] } = req.body || {};
    const ids = (vendorIds as any[]).map((x) => Number(x)).filter(Boolean);
    const vendors = await prisma.vendor.findMany({ where: { id: { in: ids } } });
    // naive estimate: prefer provided avgCO2perOrder or compute placeholder
    const results = vendors.map((v) => ({ id: v.id, name: v.name, co2: v.avgCO2perOrder ?? 0 }));
    res.json({ items: results });
  } catch (e) {
    res.status(500).json({ error: 'vendors_carbon_failed' });
  }
}));

// Import / Export
router.post('/import', ah(async (req: Request, res: Response) => {
  try {
    // Multipart (CSV/XLSX) – supports multer (req.file) & express-fileupload (req.files.file)
    const ctLower = String(req.headers['content-type'] || '').toLowerCase();
    const isMultipart = ctLower.includes('multipart/form-data');
    let multipartRows: any[] | undefined;

    if (isMultipart) {
      const anyReq: any = req as any;
      let buf: Buffer | undefined;
      let name: string | undefined;

      if (anyReq?.file?.buffer) {
        buf = anyReq.file.buffer as Buffer;
        name = anyReq.file.originalname as string;
      } else if (anyReq?.files?.file?.data) {
        buf = anyReq.files.file.data as Buffer;
        name = anyReq.files.file.name as string;
      } else if (Array.isArray(anyReq?.files) && anyReq.files[0]?.buffer) {
        buf = anyReq.files[0].buffer as Buffer;
        name = anyReq.files[0].originalname as string;
      }

      if (buf) {
        const lowerName = String(name || '').toLowerCase();
        if (lowerName.endsWith('.xlsx') || ctLower.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          // Try to parse with xlsx if available
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const XLSX = require('xlsx');
            const wb = XLSX.read(buf, { type: 'buffer' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            multipartRows = (json as any[]).map(mapImportedRow);
          } catch (e) {
            return res.status(415).json({ error: 'xlsx_not_supported', hint: 'Install xlsx and middleware (multer/express-fileupload) to import .xlsx' });
          }
        } else {
          // Treat as CSV text
          const text = buf.toString('utf8');
          multipartRows = parseCSV(text).map(mapImportedRow);
        }
      }
    }
    // JSON path: { items: [...] }
    const jsonItems = (req.body?.items && Array.isArray(req.body.items)) ? req.body.items : undefined;

    // CSV path: either raw text body (text/csv) or field `csv` in body
    let csvText: string | undefined;
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (!jsonItems && !multipartRows) {
      if (ct.includes('text/csv') && typeof req.body === 'string') {
        csvText = req.body as string;
      } else if (typeof (req.body?.csv) === 'string') {
        csvText = String(req.body.csv);
      }
    }

    const rows: any[] = jsonItems ?? multipartRows ?? (csvText ? parseCSV(csvText).map(mapImportedRow) : []);
    if (!rows || !rows.length) {
      return res.status(400).json({ error: 'no_items', hint: 'Send JSON {items:[...]} or text/csv body (or {csv: "..."}).' });
    }

    const ops = rows.map((row) =>
      prisma.vendor.upsert({
        where: { code: String(row.code) },
        update: {
          name: row.name,
          status: row.status || 'Pending',
          categoriesJson: row.categories ? JSON.stringify(row.categories) : undefined,
          regionsJson: row.regions ? JSON.stringify(row.regions) : undefined,
        },
        create: {
          code: String(row.code),
          name: row.name,
          status: row.status || 'Pending',
          categoriesJson: row.categories ? JSON.stringify(row.categories) : null,
          regionsJson: row.regions ? JSON.stringify(row.regions) : null,
        },
      })
    );

    await prisma.$transaction(ops);
    res.json({ ok: true, upserted: ops.length, mode: jsonItems ? 'json' : (multipartRows ? (Array.isArray(multipartRows) ? 'multipart' : 'multipart-unknown') : 'csv') });
  } catch (e) {
    res.status(500).json({ error: 'vendors_import_failed' });
  }
}));

router.get('/export', ah(async (req: Request, res: Response) => {
  try {
    const { where, categoriesLike, regionsLike } = buildListQuery(req);
    // No pagination for export
    const items = await prisma.vendor.findMany({ where, orderBy: [{ trustScore: 'desc' }, { name: 'asc' }] });
    const filtered = likeFilter(items, categoriesLike, regionsLike);

    const format = String((req.query as any).format || '').toLowerCase();
    let fmt = format;
    if (!fmt) {
      const accept = String(req.headers['accept'] || '').toLowerCase();
      if (accept.includes('text/csv')) fmt = 'csv';
    }
    if (fmt === 'csv') {
      const csv = toVendorsCSV(filtered);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="vendors_export.csv"');
      return res.send(csv);
    }

    res.json({ items: filtered });
  } catch (e) {
    res.status(500).json({ error: 'vendors_export_failed' });
  }
}));

export default router;
