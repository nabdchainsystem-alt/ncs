import 'dotenv/config';
import express from 'express';
import cors, { type CorsOptions } from 'cors';
import path from 'path';
import fs from 'fs';
import type { NextFunction, Request, Response } from 'express';
import requestsRouter from './routes/requests';
import tasksRouter from './routes/tasks';
import vendorsRouter from './routes/vendors';
import templatesRouter from './routes/templates';
import aiRouter from './routes/ai';
import rfqRouter from './routes/rfq';
import ordersRouter from './routes/orders';
import overviewRouter from './routes/overview';
import inventoryRouter from './routes/inventory';
import fleetRouter from './routes/fleet';
import storesRouter from './routes/stores';
import prisma from './lib/prisma';
import { errorHandler } from './middleware/error';

const app = express();

const PORT = Number(process.env.PORT || 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const DEFAULT_ORIGIN = 'http://localhost:5173';
const rawOrigins = (process.env.CORS_ORIGIN || DEFAULT_ORIGIN)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAll = rawOrigins.includes('*');
const allowedOrigins = allowAll ? [DEFAULT_ORIGIN] : rawOrigins;
const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const databaseUrl = process.env.DATABASE_URL ?? '';
console.log('[startup] NODE_ENV:', NODE_ENV);
console.log('[startup] PORT:', PORT);
console.log('[startup] DATABASE_URL:', databaseUrl || '(not set)');

if (databaseUrl.startsWith('file:')) {
  const raw = databaseUrl.replace('file:', '');
  const resolved = path.resolve(process.cwd(), raw);
  const exists = fs.existsSync(resolved);
  console.log(`[startup] SQLite path resolved to ${resolved} (exists=${exists})`);
} else if (!databaseUrl) {
  console.warn('[startup] DATABASE_URL missing; Prisma may fail to connect');
}

let dbHealthy = false;

async function refreshDbHealth(reason: string) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (!dbHealthy) {
      console.log(`[db] connection OK (${reason})`);
    }
    dbHealthy = true;
  } catch (error) {
    if (dbHealthy) {
      console.error('[db] connectivity lost', error);
    } else {
      console.error('[db] connectivity unavailable', error);
    }
    dbHealthy = false;
  }
}

process.on('unhandledRejection', (error) => {
  console.error('[process] unhandledRejection', error);
});

process.on('uncaughtException', (error) => {
  console.error('[process] uncaughtException', error);
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/templates', express.static(path.join(process.cwd(), 'public', 'templates')));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (!dbHealthy) {
      console.log('[db] connection OK (health)');
    }
    dbHealthy = true;
    res.json({ ok: true });
  } catch (error) {
    dbHealthy = false;
    console.error('[health] database unavailable', error);
    res.status(503).json({ ok: false, error: 'DB unavailable' });
  }
});

const dbGate = (req: Request, res: Response, next: NextFunction) => {
  if (!req.originalUrl.startsWith('/api') || req.path === '/api/health') {
    return next();
  }
  if (!dbHealthy) {
    return res.status(503).json({ ok: false, error: 'DB unavailable' });
  }
  return next();
};

app.use(dbGate);

app.use('/api/requests', requestsRouter);
console.log('>> Mounted /api/requests router');
app.use('/api/tasks', tasksRouter);
console.log('>> Mounted /api/tasks router');
app.use('/api/vendors', vendorsRouter);
console.log('Mounted /api/vendors');
app.use('/api/templates', templatesRouter);
console.log('>> Mounted /api/templates router');
app.use('/api/ai', aiRouter);
console.log('>> Mounted /api/ai router');
app.use('/api/rfq', rfqRouter);
console.log('>> Mounted /api/rfq router');
app.use('/api/orders', ordersRouter);
console.log('>> Mounted /api/orders router');
app.use('/api/overview', overviewRouter);
console.log('>> Mounted /api/overview router');
app.use('/api/inventory', inventoryRouter);
console.log('Mounted /api/inventory');
app.use('/api/fleet', fleetRouter);
console.log('>> Fleet router loaded');
app.use('/api/stores', storesRouter);
console.log('>> Mounted /api/stores router');

app.use(errorHandler);

async function bootstrap() {
  await refreshDbHealth('startup');
  setInterval(() => {
    void refreshDbHealth('interval');
  }, 15000).unref();

  const server = app.listen(PORT, () => {
    console.log(`NCS API running on http://localhost:${PORT}`);
    if (!dbHealthy) {
      console.warn('[startup] Database not reachable; operating in degraded mode (503 for API routes)');
    }
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`[startup] Port ${PORT} is already in use`);
    } else {
      console.error('[startup] Server error', error);
    }
  });
}

void bootstrap();
