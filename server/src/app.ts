import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { errorHandler, notFound } from './errors';
import { analyticsRouter } from './routes/analytics';
import { fleetRouter } from './routes/fleet';
import { healthRouter } from './routes/health';
import { inventoryRouter } from './routes/inventory';
import { ordersRouter } from './routes/orders';
import { policyRouter } from './routes/policy';
import { requestsRouter } from './routes/requests';
import { rfqRouter } from './routes/rfq';
import { vendorsRouter } from './routes/vendors';
import { paymentsRouter } from './routes/payments';
import { overviewRouter } from './routes/overview';
import storesRouter from './routes/stores';
import { buildOpenApiDocument } from './openapi';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : undefined,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRouter);
app.use('/api/requests/analytics', analyticsRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/rfq', rfqRouter);
app.use('/api/policy', policyRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/overview', overviewRouter);
app.use('/api/stores', storesRouter);

const openApiDoc = buildOpenApiDocument();
app.get('/openapi.json', (_req, res) => {
  res.json(openApiDoc);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

app.use(notFound);
app.use(errorHandler);

export { app };
