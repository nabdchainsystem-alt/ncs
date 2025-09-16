import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { hashPassword, sanitizeUser, signToken, verifyPassword } from '../services/auth';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, COOKIE_CLEAR_OPTIONS, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from '../config/auth';
import { validateEmail, validatePassword } from '../utils/validation';
import { ApiError, errorResponse } from '../utils/errors';
import { authenticate } from '../middleware/authenticate';

const prisma = new PrismaClient();

const limiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ message: 'Too many attempts, please slow down', code: 'rate_limited' });
  },
});

const router = Router();

function assertField(condition: boolean, message: string, field: string, code: string): asserts condition {
  if (!condition) {
    throw new ApiError({ message, field, code, status: 400 });
  }
}

router.post('/register', limiter, async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};
    assertField(typeof name === 'string' && name.trim().length >= 2, 'Name must be at least 2 characters', 'name', 'invalid_name');
    assertField(typeof email === 'string' && validateEmail(email), 'Enter a valid email address', 'email', 'invalid_email');
    assertField(typeof password === 'string' && validatePassword(password), 'Password must be at least 8 characters and include a letter and number', 'password', 'weak_password');
    assertField(password === confirmPassword, 'Passwords do not match', 'confirmPassword', 'password_mismatch');

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      throw new ApiError({ message: 'Email is already registered', field: 'email', code: 'email_taken', status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      },
    });

    const token = signToken(user);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    const { status, body } = errorResponse(err);
    res.status(status).json(body);
  }
});

router.post('/login', limiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    assertField(typeof email === 'string' && validateEmail(email), 'Enter a valid email address', 'email', 'invalid_email');
    assertField(typeof password === 'string' && password.length > 0, 'Password is required', 'password', 'missing_password');

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      throw new ApiError({ message: 'Invalid credentials', field: 'email', code: 'invalid_credentials', status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new ApiError({ message: 'Invalid credentials', field: 'password', code: 'invalid_credentials', status: 401 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const token = signToken(updated);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    const { status, body } = errorResponse(err);
    res.status(status).json(body);
  }
});

router.post('/logout', async (req, res) => {
  try {
    res.clearCookie(AUTH_COOKIE_NAME, COOKIE_CLEAR_OPTIONS);
    res.json({ message: 'Signed out' });
  } catch (err) {
    const { status, body } = errorResponse(err);
    res.status(status).json(body);
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      throw new ApiError({ message: 'Authentication required', status: 401, code: 'unauthenticated' });
    }
    res.json({ user: req.user });
  } catch (err) {
    const { status, body } = errorResponse(err);
    res.status(status).json(body);
  }
});

export default router;
