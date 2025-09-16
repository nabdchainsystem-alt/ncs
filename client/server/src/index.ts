import 'dotenv/config';
import express from 'express';
import cors, { type CorsOptions } from 'cors';
import path from 'path';
import requestsRouter from './routes/requests';
import tasksRouter from './routes/tasks';
import vendorsRouter from './routes/vendors';
import templatesRouter from './routes/templates';
import aiRouter from './routes/ai';

const app = express();

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
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/templates', express.static(path.join(process.cwd(), 'public', 'templates')));

app.use('/api/requests', requestsRouter);
console.log('>> Mounted /api/requests router');
app.use('/api/tasks', tasksRouter);
console.log('>> Mounted /api/tasks router');
app.use('/api/vendors', vendorsRouter);
console.log('>> Mounted /api/vendors router');
app.use('/api/templates', templatesRouter);
console.log('>> Mounted /api/templates router');
app.use('/api/ai', aiRouter);
console.log('>> Mounted /api/ai router');

app.listen(PORT, () => {
  console.log(`NCS API running on http://localhost:${PORT}`);
});
