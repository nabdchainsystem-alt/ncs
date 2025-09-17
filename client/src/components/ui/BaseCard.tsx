import React from 'react';
import cardTheme from '../../styles/cardTheme';

type Props = {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function BaseCard({ title, subtitle, headerRight, children, className, style }: Props) {
  return (
    <section
      className={`rounded-2xl border shadow-card p-6 bg-white dark:bg-gray-900 ${className || ''}`}
      style={{ borderColor: cardTheme.border(), ...style }}
    >
      {(title || subtitle || headerRight) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">{title}</div> : null}
            {subtitle ? <div className="text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
          </div>
          {headerRight ? <div>{headerRight}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
