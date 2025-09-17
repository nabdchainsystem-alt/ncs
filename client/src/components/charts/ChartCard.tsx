import React from 'react';
import BaseCard from '../ui/BaseCard';
import cardTheme from '../../theme/cardTheme';

type ChartCardVariant = 'standalone' | 'embedded';

type ChartCardProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  height?: number;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: ChartCardVariant;
};

export default function ChartCard({
  title,
  subtitle,
  actions,
  height,
  legend,
  children,
  className,
  style,
  variant = 'standalone',
}: ChartCardProps) {
  const mode = cardTheme.runtimeMode();

  const topSpacing = title || subtitle || actions ? 16 : 0;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: height,
        padding: variant === 'embedded' ? 0 : undefined,
        marginTop: topSpacing,
      }}
    >
      {legend ? <div style={{ color: cardTheme.muted(mode), fontSize: 13 }}>{legend}</div> : null}
      <div style={{ flex: 1, minHeight: height ? Math.max(height - 32, 120) : undefined }}>{children}</div>
    </div>
  );

  if (variant === 'embedded') {
    return (
      <div className={className} style={style}>
        {title || subtitle ? (
          <div style={{ marginBottom: 12 }}>
            {title ? <div style={{ ...cardTheme.typography.heading, color: cardTheme.valueColor(mode) }}>{title}</div> : null}
            {subtitle ? <div style={{ color: cardTheme.muted(mode), fontSize: 13 }}>{subtitle}</div> : null}
          </div>
        ) : null}
        {actions ? <div style={{ marginBottom: 12 }}>{actions}</div> : null}
        {content}
      </div>
    );
  }

  return (
    <BaseCard
      className={className}
      title={title}
      subtitle={subtitle}
      headerRight={actions}
      style={{ padding: cardTheme.padding.base, ...style }}
    >
      {content}
    </BaseCard>
  );
}

export type { ChartCardProps, ChartCardVariant };
