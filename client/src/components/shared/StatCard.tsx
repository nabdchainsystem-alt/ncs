import React from 'react';
import type { CSSProperties } from 'react';
import cardTheme from '../../styles/cardTheme';
import { formatNumber, formatSAR, percent } from '../../shared/format';

type ValueFormat = 'number' | 'sar' | 'percent';

type StatCardDelta = {
  label?: string;
  value?: number;
  format?: ValueFormat;
  fractionDigits?: number;
  trend?: 'up' | 'down' | 'flat';
};

export interface StatCardProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: number | string;
  valueFormat?: ValueFormat;
  valueFractionDigits?: number;
  delta?: StatCardDelta | null;
  className?: string;
  style?: CSSProperties;
}

function formatValue(value: number | string, format?: ValueFormat, fractionDigits = 0) {
  if (format === 'sar') return formatSAR(value, { maximumFractionDigits: fractionDigits });
  if (format === 'percent') return percent(value, fractionDigits);
  if (format === 'number' || typeof value === 'number') {
    return formatNumber(value, { maximumFractionDigits: fractionDigits });
  }
  return String(value);
}

function renderDelta(delta?: StatCardDelta | null) {
  if (!delta) return null;

  const trend: 'up' | 'down' | 'flat' = delta.trend
    || (typeof delta.value === 'number'
      ? (delta.value > 0 ? 'up' : delta.value < 0 ? 'down' : 'flat')
      : 'flat');

  const tone = trend === 'down' ? 'negative' : trend === 'up' ? 'positive' : 'neutral';
  const pill = cardTheme.pill(tone as 'positive' | 'negative' | 'neutral');

  const digits = delta.fractionDigits ?? (delta.format === 'percent' ? 1 : 0);
  const formatted = delta.label
    ?? (delta.value !== undefined ? formatValue(delta.value, delta.format, digits) : null);

  if (!formatted) return null;

  const glyph = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '→';

  return (
    <span
      className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium"
      style={{ background: pill.bg, color: pill.text }}
    >
      <span aria-hidden="true">{glyph}</span>
      <span>{formatted}</span>
    </span>
  );
}

export function StatCard({
  icon,
  label,
  value,
  valueFormat,
  valueFractionDigits = valueFormat === 'percent' ? 1 : 0,
  delta,
  className,
  style,
}: StatCardProps) {
  const formattedValue = formatValue(value, valueFormat, valueFractionDigits);

  return (
    <div
      className={`relative flex h-[152px] flex-col rounded-2xl border bg-white p-5 shadow-card transition-colors dark:bg-gray-900 ${className ?? ''}`}
      style={{ borderColor: cardTheme.border(), ...style }}
    >
      <div className="flex justify-start">
        <div
          className="grid h-11 w-11 place-items-center rounded-lg"
          style={{ background: cardTheme.iconBoxBg() }}
          aria-hidden={!icon}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 flex flex-col items-start gap-1 text-left">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xl font-bold tracking-tight text-gray-900 tabular-nums dark:text-white sm:text-2xl md:text-3xl">
          {formattedValue}
        </div>
      </div>
      {renderDelta(delta)}
    </div>
  );
}

export default StatCard;
