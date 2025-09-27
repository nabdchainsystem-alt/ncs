import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly expose: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, options?: { expose?: boolean; details?: unknown }) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.expose = options?.expose ?? statusCode < 500;
    this.details = options?.details;
  }
}

export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<unknown>,
) =>
  (req: T, res: U, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
