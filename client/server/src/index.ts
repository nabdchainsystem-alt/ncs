import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// --- Setup
const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Health
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'down' });
  }
});

// --- Requests CRUD (P0)

// List requests (basic pagination & filters by status/department)
app.get('/api/requests', async (req, res) => {
  try {
    const { status, department, q, page = '1', pageSize = '10' } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Math.min(Math.max(Number(pageSize), 1), 100);

    const where: any = {};
    if (status) where.status = status;
    if (department) where.department = department;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
        { specs: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { items: true, files: true, events: true },
      }),
    ]);

    res.json({ total, page: Number(page), pageSize: take, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list requests' });
  }
});

// Get single request
app.get('/api/requests/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await prisma.request.findUnique({
      where: { id },
      include: { items: true, files: true, events: true },
    });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get request' });
  }
});

// Create request
app.post('/api/requests', async (req, res) => {
  try {
    const { title, type, department, priority, quantity, specs, items = [] } = req.body || {};
    if (!title || !type || !department || !priority || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const created = await prisma.request.create({
      data: {
        title,
        type,
        department,
        priority,
        quantity,
        specs: specs ?? null,
        status: 'NEW',
        items: items.length
          ? {
              create: items.map((it: any) => ({
                name: String(it.name || ''),
                qty: Number(it.qty || 0),
                unit: it.unit ? String(it.unit) : null,
                note: it.note ? String(it.note) : null,
              })),
            }
          : undefined,
        events: {
          create: [{ action: 'CREATED', meta: null }],
        },
      },
      include: { items: true, files: true, events: true },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Update request (partial)
app.patch('/api/requests/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, type, department, priority, quantity, specs, status } = req.body || {};

    const updated = await prisma.request.update({
      where: { id },
      data: {
        title,
        type,
        department,
        priority,
        quantity,
        specs,
        status,
        events: status
          ? { create: [{ action: 'STATUS_CHANGED', meta: JSON.stringify({ to: status }) }] }
          : undefined,
      },
      include: { items: true, files: true, events: true },
    });

    res.json(updated);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    console.error(err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Delete request
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.request.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// --- Start
app.listen(PORT, () => {
  console.log(`NCS API running on http://localhost:${PORT}`);
});