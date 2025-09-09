import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import requestsRouter from './routes/requests';

console.log(">> Mounted /api/requests router");

// --- Setup
const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/requests', requestsRouter);

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