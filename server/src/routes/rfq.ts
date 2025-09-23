import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler, HttpError } from '../errors';
import { prisma } from '../prisma';

export const rfqRouter = Router();

const sendRfqSchema = z.object({
  requestId: z.number().int().positive(),
  vendorId: z.number().int().positive(),
  contactEmail: z.string().email().optional(),
  contactName: z.string().min(1).max(120).optional(),
  message: z.string().max(2000).optional(),
});

rfqRouter.get('/', asyncHandler(async (_req, res) => {
  const rfqs = await prisma.rfq.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      request: { select: { id: true, orderNo: true, title: true } },
      vendor: { select: { id: true, name: true, code: true } },
    },
  });

  res.json(rfqs);
}));

rfqRouter.post('/send', asyncHandler(async (req, res) => {
  const payload = sendRfqSchema.parse(req.body);

  try {
    const record = await prisma.rfq.create({
      data: {
        requestId: payload.requestId,
        vendorId: payload.vendorId,
        contactEmail: payload.contactEmail,
        contactName: payload.contactName,
        message: payload.message,
      },
      select: { id: true, status: true },
    });

    res.status(201).json(record);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'RFQ already sent to this vendor for the selected request');
    }
    throw error;
  }
}));
