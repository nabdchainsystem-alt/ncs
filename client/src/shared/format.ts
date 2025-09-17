export type FormatNumberOptions = Intl.NumberFormatOptions & { locale?: string };

const defaultLocale = () => {
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
  return 'en';
};

const coerceNumber = (value: number | string) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
};

export function formatNumber(value: number | string, options: FormatNumberOptions = {}): string {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = coerceNumber(value);
  if (!Number.isFinite(numeric)) return String(value);

  const { locale, ...intlOptions } = options;
  try {
    return new Intl.NumberFormat(locale ?? defaultLocale(), {
      maximumFractionDigits: 0,
      ...intlOptions,
    }).format(numeric);
  } catch {
    return String(numeric);
  }
}

export function formatSAR(value: number | string, options: FormatNumberOptions = {}): string {
  const maximumFractionDigits = options.maximumFractionDigits ?? 0;
  const minimumFractionDigits = options.minimumFractionDigits ?? maximumFractionDigits;
  const formatted = formatNumber(value, {
    maximumFractionDigits,
    minimumFractionDigits,
    locale: options.locale,
  });
  if (formatted === '—') return formatted;
  return `${formatted} SAR`;
}

export function clampLabel(label: string, maxLength = 12): string {
  if (!label) return '';
  if (maxLength <= 1) return label;
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export function percent(value: number | string, fractionDigits = 0, locale?: string): string {
  const numeric = coerceNumber(value);
  if (!Number.isFinite(numeric)) return '—';
  const formatted = formatNumber(numeric * 100, {
    locale,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
  return formatted === '—' ? formatted : `${formatted}%`;
}

export default {
  formatNumber,
  formatSAR,
  clampLabel,
  percent,
};
