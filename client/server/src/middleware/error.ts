import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const reqLogger = (req as any)?.log;
  reqLogger?.error?.(err);
  console.error('[error]', err);
  const statusCode = err?.statusCode && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;
  const message = typeof err?.message === 'string' ? err.message : 'Server error';
  res.status(statusCode).json({ ok: false, code: statusCode, message });
}
