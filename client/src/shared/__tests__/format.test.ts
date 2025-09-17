import { describe, expect, it } from 'vitest';
import { clampLabel, formatNumber, formatSAR, percent } from '../format';

describe('formatNumber', () => {
  it('formats integers with thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('respects maximumFractionDigits when provided', () => {
    expect(formatNumber(1234.567, { maximumFractionDigits: 1 })).toBe('1,234.6');
  });

  it('returns placeholder for nullish values', () => {
    expect(formatNumber(undefined as unknown as number)).toBe('—');
    expect(formatNumber('' as unknown as number)).toBe('—');
  });

  it('falls back gracefully for non-numeric strings', () => {
    expect(formatNumber('abc')).toBe('abc');
  });
});

describe('formatSAR', () => {
  it('appends SAR suffix', () => {
    expect(formatSAR(2500)).toBe('2,500 SAR');
  });

  it('honours fraction digits', () => {
    expect(formatSAR(1999.9, { maximumFractionDigits: 2 })).toBe('1,999.90 SAR');
  });

  it('returns placeholder for empty values', () => {
    expect(formatSAR(null as unknown as number)).toBe('—');
  });
});

describe('clampLabel', () => {
  it('keeps labels within the maximum length with ellipsis', () => {
    expect(clampLabel('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)).toBe('ABCDEFGHI…');
  });

  it('leaves short labels untouched', () => {
    expect(clampLabel('Open')).toBe('Open');
  });

  it('handles empty strings', () => {
    expect(clampLabel('')).toBe('');
  });
});

describe('percent', () => {
  it('formats decimal ratios as percentages', () => {
    expect(percent(0.378, 1)).toBe('37.8%');
  });

  it('returns placeholder for invalid values', () => {
    expect(percent('foo')).toBe('—');
  });
});
