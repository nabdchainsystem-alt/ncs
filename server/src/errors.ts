import type { NextFunction, Request, Response } from 'express';

export interface ErrorResponse {
  error: string;
  status: number;
  details?: unknown;
}

export class HttpError extends Error {
  public readonly status: number;
  public readonly expose: boolean;
  public readonly details?: unknown;

  constructor(status: number, message: string, options?: { expose?: boolean; details?: unknown }) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.expose = options?.expose ?? status < 500;
    this.details = options?.details;
  }
}

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof HttpError ? err.status : 500;
  const expose = err instanceof HttpError ? err.expose : false;
  const details = err instanceof HttpError ? err.details : undefined;
  const message = err instanceof HttpError ? err.message : 'Internal server error';

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const payload: ErrorResponse = {
    error: expose ? message : 'Internal server error',
    status,
    ...(details ? { details } : {}),
  };

  res.status(status).json(payload);
};

export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U) => Promise<unknown>,
) =>
  (req: T, res: U, next: NextFunction): void => {
    fn(req, res).catch(next);
  };
