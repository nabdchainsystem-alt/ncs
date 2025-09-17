import React from 'react';
import cardTheme from '../../theme/cardTheme';

type QuickAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: (id: string) => void;
  disabled?: boolean;
  can?: boolean;
  tooltip?: string;
  variant?: 'primary' | 'outline' | 'ghost';
};

type QuickActionsProps = {
  actions: QuickAction[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
};

export default function QuickActions({ actions, orientation = 'horizontal', className, style }: QuickActionsProps) {
  const mode = cardTheme.runtimeMode();
  const layout: React.CSSProperties = orientation === 'vertical'
    ? { display: 'flex', flexDirection: 'column', gap: 8 }
    : { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 };

  return (
    <div className={className} style={{ ...layout, ...style }}>
      {actions
        .filter((action) => action.can !== false)
        .map((action) => {
          const variant = action.variant ?? 'outline';
          const baseStyles: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: cardTheme.radius.sm,
            fontSize: 13,
            fontWeight: 600,
            padding: '0.625rem 1rem',
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            opacity: action.disabled ? 0.5 : 1,
          };

          const styles: Record<typeof variant, React.CSSProperties> = {
            primary: {
              ...baseStyles,
              background: '#2563EB',
              color: '#ffffff',
              border: '1px solid transparent',
            },
            outline: {
              ...baseStyles,
              background: cardTheme.surface(mode),
              color: cardTheme.valueColor(mode),
              border: `1px solid ${cardTheme.border(mode)}`,
            },
            ghost: {
              ...baseStyles,
              background: 'transparent',
              color: cardTheme.muted(mode),
              border: '1px solid transparent',
            },
          };

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => !action.disabled && action.onClick?.(action.id)}
              disabled={action.disabled}
              title={action.tooltip}
              style={styles[variant]}
            >
              {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
              <span>{action.label}</span>
            </button>
          );
        })}
    </div>
  );
}

export type { QuickAction, QuickActionsProps };
