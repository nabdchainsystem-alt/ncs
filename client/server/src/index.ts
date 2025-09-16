import 'dotenv/config';
import express from 'express';
import cors, { type CorsOptions } from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import requestsRouter from './routes/requests';
import tasksRouter from './routes/tasks';
import vendorsRouter from './routes/vendors';
import templatesRouter from './routes/templates';
import aiRouter from './routes/ai';
import authRouter from './routes/auth';
import { authenticate } from './middleware/authenticate';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from './config/auth';

// --- Setup
const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
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

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Serve static templates as fallback (from client/public/templates)
app.use('/templates', express.static(path.join(process.cwd(), 'public', 'templates')));
app.use('/api/auth', authRouter);
console.log('>> Mounted /api/auth router');

// --- Health (public)
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'down' });
  }
});

// Protect all API routes below
app.use(authenticate);
app.use('/api/requests', requestsRouter);
console.log(">> Mounted /api/requests router");
app.use('/api/tasks', tasksRouter);
console.log(">> Mounted /api/tasks router");
app.use('/api/vendors', vendorsRouter);
console.log(">> Mounted /api/vendors router");
app.use('/api/templates', templatesRouter);
console.log(">> Mounted /api/templates router");
app.use('/api/ai', aiRouter);
console.log('>> Mounted /api/ai router');

// Minimal stub for creating a PO/Contract from UI flows
app.post('/api/po', async (req, res) => {
  try {
    const { vendorId, items = [], dueDate = null, notes = null } = req.body || {};
    if (!vendorId || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid PO payload', code: 'invalid_po_payload' });
    }
    // In a real implementation you would insert a record and link items
    const id = Math.floor(Date.now() / 1000);
    res.json({ ok: true, id, vendorId, items, dueDate, notes });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create PO', code: 'po_create_failed' });
  }
});

// --- Start
app.listen(PORT, () => {
  console.log(`NCS API running on http://localhost:${PORT}`);
  const secureFlag = AUTH_COOKIE_OPTIONS.secure ? 'secure' : 'insecure (dev)';
  const maxAgeHours = Math.round((AUTH_COOKIE_OPTIONS.maxAge || 0) / (1000 * 60 * 60));
  console.log([
    '--- Auth Quickstart ---',
    'Endpoints:',
    '  POST /api/auth/register',
    '  POST /api/auth/login',
    '  POST /api/auth/logout',
    '  GET  /api/auth/me',
    `Cookie: ${AUTH_COOKIE_NAME} [httpOnly, sameSite=lax, ${secureFlag}, maxAge≈${maxAgeHours}h]`,
    'Guard: authenticate() middleware validates JWT from the cookie before allowing /api/** routes.',
    'Client flow: AuthProvider calls /api/auth/me on load, redirects to /login when API responds 401.',
  ].join('\n'));
});
