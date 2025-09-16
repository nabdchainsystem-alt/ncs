import type { CookieOptions } from 'express';

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'ncs_session';
const cookieMaxAge = Number(process.env.AUTH_COOKIE_MAX_AGE || WEEK_IN_SECONDS);

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: cookieMaxAge * 1000,
  path: '/',
};

export const COOKIE_CLEAR_OPTIONS: CookieOptions = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 0,
};

export const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60_000);
export const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX || 10);
