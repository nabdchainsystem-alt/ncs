import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { ApiError } from '../utils/errors';

const DEFAULT_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'change-me-in-prod';
const TOKEN_ISSUER = process.env.JWT_ISSUER || 'ncs-app';
const rawCost = Number(process.env.BCRYPT_COST || 12);
const BCRYPT_COST = Number.isFinite(rawCost) ? Math.min(15, Math.max(10, Math.round(rawCost))) : 12;

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('[auth] JWT_SECRET not set, using fallback. Set JWT_SECRET in production.');
}

export type JwtPayload = {
  sub: string | number;
  name: string;
  email: string;
  iat?: number;
  exp?: number;
};

export function requireSecret() {
  if (!JWT_SECRET) {
    throw new ApiError({ message: 'JWT secret not configured', status: 500, code: 'auth_config_missing' });
  }
}

export async function hashPassword(password: string) {
  try {
    return await bcrypt.hash(password, BCRYPT_COST);
  } catch (err) {
    throw new ApiError({ message: 'Unable to process password', status: 500, code: 'hash_failed' });
  }
}

export async function verifyPassword(password: string, hash: string) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    throw new ApiError({ message: 'Unable to verify credentials', status: 500, code: 'verify_failed' });
  }
}

export function signToken(user: Pick<User, 'id' | 'email' | 'name'>) {
  requireSecret();
  const payload: JwtPayload = {
    sub: String(user.id),
    name: user.name,
    email: user.email,
  };
  const options: SignOptions = {
    expiresIn: DEFAULT_EXPIRY as SignOptions['expiresIn'],
    issuer: TOKEN_ISSUER,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  requireSecret();
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: TOKEN_ISSUER,
  });
  if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) {
    throw new ApiError({ message: 'Invalid token', status: 401, code: 'invalid_token' });
  }
  const { sub, name, email, exp } = decoded as JwtPayload;
  return { sub, name, email, exp };
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}
