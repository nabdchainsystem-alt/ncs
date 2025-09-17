import React from 'react';
import cardTheme from '../../theme/cardTheme';
import { formatNumber } from '../../shared/format';

type Trend = 'up' | 'down' | 'flat';

type StatCardDelta = {
  label?: string;
  value?: string | number;
  trend?: Trend;
};

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  delta?: StatCardDelta | null;
  description?: string;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function getTrendSymbol(trend: Trend | undefined) {
  if (trend === 'up') return '▲';
  if (trend === 'down') return '▼';
  return '→';
}

export default function StatCard({
  label,
  value,
  icon,
  delta,
  description,
  className,
  style,
  fullWidth = false,
}: StatCardProps) {
  const mode = cardTheme.runtimeMode();
  const base = cardTheme.container(mode);
  const deltaTone = delta?.trend === 'down' ? cardTheme.pill('negative') : delta?.trend === 'flat' ? cardTheme.pill('neutral') : cardTheme.pill('positive');

  const deltaValue = typeof delta?.value === 'number'
    ? formatNumber(delta.value, { maximumFractionDigits: 1 })
    : delta?.value;

  return (
    <div
      className={className}
      style={{
        ...base,
        display: 'flex',
        flexDirection: 'column',
        padding: cardTheme.padding.base,
        minHeight: 168,
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon ? (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: cardTheme.radius.sm,
                display: 'grid',
                placeItems: 'center',
                background: cardTheme.iconBoxBg(mode),
              }}
              aria-hidden="true"
            >
              {icon}
            </div>
          ) : null}
          <div>
            <div style={{ ...cardTheme.typography.subtitle, color: cardTheme.muted(mode) }}>{label}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1.1,
                color: cardTheme.valueColor(mode),
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </div>
          </div>
        </div>
        {delta ? (
          <div
            style={{
              ...cardTheme.typography.meta,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: '0.25rem 0.75rem',
              background: deltaTone.bg,
              color: deltaTone.text,
            }}
          >
            <span aria-hidden="true">{getTrendSymbol(delta.trend)}</span>
            <span>{deltaValue}</span>
            {delta.label ? <span>{delta.label}</span> : null}
          </div>
        ) : null}
      </div>
      {description ? (
        <div style={{ marginTop: 16, fontSize: 13, color: cardTheme.muted(mode) }}>{description}</div>
      ) : null}
    </div>
  );
}
