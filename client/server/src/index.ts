import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import requestsRouter from './routes/requests';
import tasksRouter from './routes/tasks';
import vendorsRouter from './routes/vendors';

// --- Setup
const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/requests', requestsRouter);
console.log(">> Mounted /api/requests router");
app.use('/api/tasks', tasksRouter);
console.log(">> Mounted /api/tasks router");
app.use('/api/vendors', vendorsRouter);
console.log(">> Mounted /api/vendors router");

// Minimal stub for creating a PO/Contract from UI flows
app.post('/api/po', async (req, res) => {
  try {
    const { vendorId, items = [], dueDate = null, notes = null } = req.body || {};
    if (!vendorId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'invalid_po_payload' });
    }
    // In a real implementation you would insert a record and link items
    const id = Math.floor(Date.now() / 1000);
    res.json({ ok: true, id, vendorId, items, dueDate, notes });
  } catch (e) {
    res.status(500).json({ error: 'po_create_failed' });
  }
});

// --- Health
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'down' });
  }
});

// --- Start
app.listen(PORT, () => {
  console.log(`NCS API running on http://localhost:${PORT}`);
});
