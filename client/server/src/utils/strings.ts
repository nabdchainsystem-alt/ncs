export function normalizeWhitespace(value?: string | null): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeName(value?: string | null): string {
  return normalizeWhitespace(value);
}

export function toNullableString(value?: string | null): string | null {
  const normalized = normalizeWhitespace(value ?? '');
  return normalized ? normalized : null;
}

export function sanitizeCode(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
