import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { clampLabel, formatNumber } from '../../shared/format';

export interface PieChartDatum {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartCardProps {
  title: string;
  subtitle?: string;
  data: PieChartDatum[];
  height?: number;
  legendPosition?: 'bottom' | 'right';
  clamp?: number;
  loading?: boolean;
  errorMessage?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
  headerRight?: React.ReactNode;
  onSelect?: (datum: PieChartDatum) => void;
}

const EMPTY_STATE = 'No data available';

export function PieChartCard({
  title,
  subtitle,
  data,
  height = 280,
  legendPosition = 'bottom',
  clamp = 12,
  loading = false,
  errorMessage,
  emptyMessage = EMPTY_STATE,
  onRetry,
  className,
  headerRight,
  onSelect,
}: PieChartCardProps) {
  const palette = React.useMemo(() => data.map((item, index) => item.color ?? chartTheme.palette[index % chartTheme.palette.length]), [data]);

  const handleSliceClick = React.useCallback(
    (params: { dataIndex?: number; data?: { name?: string } }) => {
      if (!onSelect) return;
      const index = typeof params?.dataIndex === 'number' ? params.dataIndex : -1;
      if (index >= 0 && index < data.length) {
        onSelect(data[index]);
        return;
      }

      const fallbackName = typeof params?.data?.name === 'string' ? params.data.name : null;
      if (!fallbackName) return;

      const match = data.find((item) => item.name === fallbackName);
      if (match) onSelect(match);
    },
    [data, onSelect],
  );

  const content = React.useMemo(() => {
    if (loading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" aria-label="Loading" />
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{errorMessage}</span>
          {onRetry ? (
            <button
              type="button"
              className="rounded-full border px-3 py-1 font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={onRetry}
            >
              Retry
            </button>
          ) : null}
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      );
    }

    const labels = data.map((item) => clampLabel(item.name, clamp));

    return (
      <AsyncECharts
        style={{ height: height - 60 }}
        option={{
          color: palette,
          tooltip: {
            trigger: 'item',
            valueFormatter: (value: number) => formatNumber(value),
            backgroundColor: chartTheme.tooltipBackground(),
          },
          legend: {
            ...(legendPosition === 'bottom'
              ? { bottom: 0 }
              : { orient: 'vertical', right: 0, top: 24 }),
            icon: 'circle',
            textStyle: { color: chartTheme.axisLabel(), fontSize: 12 },
          },
          series: [
            {
              type: 'pie',
              radius: ['60%', '82%'],
              itemStyle: { borderRadius: 12, borderColor: cardTheme.surface(), borderWidth: 2 },
              label: {
                formatter: (params: { name?: string; value?: number }) => {
                  const name = params?.name ?? '';
                  const value = params?.value ?? 0;
                  return `${name}\n${formatNumber(value)}`.trim();
                },
                color: chartTheme.textColor(),
              },
              data: data.map((item, index) => ({
                name: labels[index],
                value: item.value,
              })),
            },
          ],
        }}
        onEvents={onSelect ? { click: handleSliceClick } : undefined}
        fallbackHeight={height - 60}
      />
    );
  }, [clamp, data, emptyMessage, errorMessage, handleSliceClick, height, legendPosition, loading, onRetry, onSelect, palette]);

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-4 shadow-card transition dark:bg-gray-900 ${className ?? ''}`}
      style={{ borderColor: cardTheme.border(), minHeight: height }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
          {subtitle ? <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      <div className="flex-1">{content}</div>
    </div>
  );
}

export default PieChartCard;
