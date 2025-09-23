import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { BAR_CHART_DEFAULTS } from '../charts/BarChart';
import { clampLabel, formatNumber, formatSAR } from '../../shared/format';

type BarValueFormat = 'number' | 'sar';

type ChartClickParams = {
  name?: string | number;
  value?: number | string;
  data?: unknown;
};

export interface BarChartPoint {
  label: string;
  value: number;
}

export interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: BarChartPoint[];
  height?: number;
  loading?: boolean;
  errorMessage?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
  axisLabelClamp?: number;
  axisLabelRotate?: number;
  valueFormat?: BarValueFormat;
  axisValueSuffix?: string;
  tooltipValueSuffix?: string;
  headerRight?: React.ReactNode;
  onSelect?: (point: BarChartPoint) => void;
}

const EMPTY_STATE = 'No data available';

function formatValue(value: number, format: BarValueFormat = 'number') {
  if (format === 'sar') return formatSAR(value);
  return formatNumber(value);
}

export function BarChartCard({
  title,
  subtitle,
  data,
  height = 300,
  loading = false,
  errorMessage,
  emptyMessage = EMPTY_STATE,
  onRetry,
  className,
  axisLabelClamp = 12,
  axisLabelRotate,
  valueFormat = 'number',
  axisValueSuffix = '',
  tooltipValueSuffix = '',
  headerRight,
  onSelect,
}: BarChartCardProps) {
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

    const labels = data.map((point) => point.label);
    const seriesData = data.map((point) => ({ value: point.value, raw: point }));
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const resolvedRotate = axisLabelRotate ?? (isSmallScreen ? 20 : 0);

    const events: Record<string, (params: ChartClickParams) => void> | undefined = onSelect
      ? {
          click: (params: ChartClickParams) => {
            const datum = params?.data;
            const rawPoint = datum && typeof datum === 'object' && 'raw' in datum
              ? (datum as { raw?: BarChartPoint }).raw
              : undefined;
            if (rawPoint) {
              onSelect(rawPoint);
              return;
            }
            const fallbackLabel = typeof params?.name === 'string' ? params.name : String(params?.name ?? '');
            const numericValue = typeof params?.value === 'number'
              ? params.value
              : Number(params?.value ?? 0);
            onSelect({ label: fallbackLabel, value: Number.isNaN(numericValue) ? 0 : numericValue });
          },
        }
      : undefined;

    return (
      <AsyncECharts
        style={{ height }}
        option={{
          ...chartTheme.applyBaseOption(),
          grid: { ...BAR_CHART_DEFAULTS.grid },
          tooltip: {
            trigger: 'axis',
            valueFormatter: (value: number) => `${formatValue(value, valueFormat)}${tooltipValueSuffix}`.trim(),
            backgroundColor: chartTheme.tooltipBackground(),
          },
          xAxis: {
            type: 'category',
            data: labels,
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: chartTheme.neutralGrid() } },
            boundaryGap: true,
            axisLabel: {
              rotate: resolvedRotate,
              color: chartTheme.axisLabel(),
              formatter: (value: string) => clampLabel(String(value), axisLabelClamp),
            },
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: chartTheme.neutralGrid() } },
            axisLabel: {
              color: chartTheme.axisLabel(),
              formatter: (value: number) => `${formatNumber(value)}${axisValueSuffix}`.trim(),
            },
            splitNumber: 5,
            minInterval: 1,
          },
          series: [
            {
              type: 'bar',
              data: seriesData,
              barWidth: BAR_CHART_DEFAULTS.barWidth,
              itemStyle: {
                color: chartTheme.mkGradient(chartTheme.brandPrimary),
                borderRadius: [10, 10, 0, 0],
              },
            },
          ],
        }}
        fallbackHeight={height}
        onEvents={events}
      />
    );
  }, [axisLabelClamp, axisLabelRotate, axisValueSuffix, data, emptyMessage, errorMessage, height, loading, onRetry, tooltipValueSuffix, valueFormat, onSelect]);

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-4 shadow-card transition dark:bg-gray-900 ${className ?? ''}`}
      style={{ borderColor: cardTheme.border(), minHeight: height + 64 }}
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

export default BarChartCard;
