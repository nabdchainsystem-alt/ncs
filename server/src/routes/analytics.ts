import { Router } from 'express';

import { prisma } from '../prisma';
import { asyncHandler } from '../errors';

export const analyticsRouter = Router();

analyticsRouter.get('/states', asyncHandler(async (_req, res) => {
  const rows = await prisma.request.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  res.json(rows.map((row) => ({ status: row.status, count: row._count.status })));
}));

analyticsRouter.get('/dept', asyncHandler(async (_req, res) => {
  const rows = await prisma.request.groupBy({
    by: ['department'],
    _count: { department: true },
    where: { department: { not: null } },
  });

  res.json(rows.map((row) => ({ department: row.department, count: row._count.department })));
}));
