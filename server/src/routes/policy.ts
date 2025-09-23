import { Router } from 'express';

import { prisma } from '../prisma';
import { asyncHandler } from '../errors';

export const policyRouter = Router();

policyRouter.get('/', asyncHandler(async (_req, res) => {
  const policies = await prisma.policy.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  res.json(policies);
}));
