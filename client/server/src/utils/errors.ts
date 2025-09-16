export type ErrorPayload = {
  message: string;
  code?: string;
  field?: string;
  status?: number;
  meta?: Record<string, unknown>;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  field?: string;
  meta?: Record<string, unknown>;

  constructor({ message, status = 400, code, field, meta }: ErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.field = field;
    this.meta = meta;
  }
}

export function errorResponse(err: unknown): { status: number; body: { message: string; code?: string; field?: string; meta?: Record<string, unknown> } } {
  if (err instanceof ApiError) {
    const { message, status, code, field, meta } = err;
    const body: { message: string; code?: string; field?: string; meta?: Record<string, unknown> } = { message };
    if (code) body.code = code;
    if (field) body.field = field;
    if (meta) body.meta = meta;
    return { status, body };
  }
  if (err instanceof Error) {
    return { status: 500, body: { message: err.message || 'Something went wrong' } };
  }
  return { status: 500, body: { message: 'Unexpected error' } };
}
