import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../errors';

export const paymentsRouter = Router();

paymentsRouter.get('/kpis', asyncHandler(async (_req, res) => {
  res.json({ open: 0, pending: 0, closed: 0, scheduled: 0 });
}));

paymentsRouter.get('/analytics/status', asyncHandler(async (_req, res) => {
  res.json([]);
}));

paymentsRouter.get('/analytics/method', asyncHandler(async (_req, res) => {
  res.json([]);
}));
