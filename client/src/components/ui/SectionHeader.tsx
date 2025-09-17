import React from 'react';
import cardTheme from '../../theme/cardTheme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  style?: React.CSSProperties;
};

export default function SectionHeader({
  title,
  subtitle,
  actions,
  align = 'start',
  className,
  style,
}: SectionHeaderProps) {
  const mode = cardTheme.runtimeMode();
  const titleStyle: React.CSSProperties = {
    ...cardTheme.typography.heading,
    color: cardTheme.valueColor(mode),
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: subtitle ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: cardTheme.headerSpacing,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ textAlign: align, flex: '1 1 auto', marginBottom: subtitle ? 8 : 0 }}>
        <div style={titleStyle}>{title}</div>
        {subtitle ? (
          <div
            style={{
              color: cardTheme.muted(mode),
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}
