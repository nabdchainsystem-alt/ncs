import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AUTH_COOKIE_NAME } from '../config/auth';
import { errorResponse, ApiError } from '../utils/errors';
import { verifyToken, sanitizeUser } from '../services/auth';

const prisma = new PrismaClient();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required', code: 'unauthenticated' });
  }
  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new ApiError({ message: 'Invalid token subject', status: 401, code: 'invalid_token_subject' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError({ message: 'User not found', status: 401, code: 'user_not_found' });
    }
    req.user = sanitizeUser(user);
    return next();
  } catch (err) {
    const { status, body } = errorResponse(err);
    return res.status(status).json(body);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.user) return next();
  return res.status(401).json({ message: 'Authentication required', code: 'unauthenticated' });
}
