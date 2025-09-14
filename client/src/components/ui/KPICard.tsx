import React from 'react';
import cardTheme from '../../styles/cardTheme';

type Delta = { pct: string; trend: 'up' | 'down' } | null;

export default function KPICard({ label, value, icon, delta }: { label: string; value: string | number; icon?: React.ReactNode; delta?: Delta; }) {
  const pill = delta ? cardTheme.pill(delta.trend === 'up' ? 'positive' : 'negative') : null;
  return (
    <div className="relative rounded-2xl border bg-white dark:bg-gray-900 shadow-sm p-6 h-[168px]" style={{ borderColor: cardTheme.border() }}>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 grid place-items-center rounded-lg" style={{ background: cardTheme.iconBoxBg() }} aria-hidden="true">{icon}</div>
        </div>
        <div className="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-1 text-4xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100">{value}</div>
        {delta && (
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ background: pill!.bg, color: pill!.text }}>
            {delta.trend === 'up' ? '▲' : '▼'} {delta.pct}
          </span>
        )}
      </div>
    </div>
  );
}

