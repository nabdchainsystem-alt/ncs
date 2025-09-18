import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import PieChart, { type PieChartDatum } from './PieChart';

const EMPTY_STATE = 'No data available';

type PieInsightCardProps = {
  title: string;
  subtitle?: string;
  data: PieChartDatum[];
  description?: string;
  height?: number;
  loading?: boolean;
  emptyMessage?: string;
  headerRight?: React.ReactNode;
  className?: string;
  onSelect?: (datum: PieChartDatum) => void;
};

export default function PieInsightCard({
  title,
  subtitle,
  data,
  description,
  height = 240,
  loading = false,
  emptyMessage = EMPTY_STATE,
  headerRight,
  className,
  onSelect,
}: PieInsightCardProps) {
  const total = React.useMemo(() => data.reduce((sum, item) => sum + (item?.value ?? 0), 0), [data]);
  const isEmpty = !loading && (data.length === 0 || total === 0);

  const cardClass = `rounded-2xl border bg-white p-4 shadow-card transition dark:border-gray-800 dark:bg-gray-900${
    className ? ` ${className}` : ''
  }`;

  return (
    <div className={cardClass}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
          {subtitle ? <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
        </div>
        {(description || headerRight) ? (
          <div className="flex items-start gap-2">
            {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            {description ? (
              <Tooltip.Provider delayDuration={120}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Chart info"
                      className="inline-flex h-7 w-7 -translate-y-1 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      sideOffset={6}
                      className="max-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      {description}
                      <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="relative mt-3" style={{ height }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500"
              aria-label="Loading"
            />
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <PieChart data={data} height={height} onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}

export type { PieInsightCardProps };
