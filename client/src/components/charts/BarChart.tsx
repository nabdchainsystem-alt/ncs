import React from 'react';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../../theme/chartTheme';
import { clampLabel, formatNumber } from '../../shared/format';
import cardTheme from '../../theme/cardTheme';

export type BarChartSeries<T extends Record<string, unknown>> = {
  id: string;
  valueKey: keyof T;
  name?: string;
  color?: string;
  stack?: string;
  formatter?: (value: number, row: T) => number;
};

export type BarChartProps<T extends Record<string, unknown>> = {
  data: T[];
  categoryKey: keyof T;
  series: BarChartSeries<T>[];
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  onSelect?: (payload: { category: string; seriesId: string; value: number; row: T }) => void;
  clampLabelLength?: number;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

export default function BarChart<T extends Record<string, unknown>>({
  data,
  categoryKey,
  series,
  height = chartTheme.heights.bar,
  orientation = 'vertical',
  onSelect,
  clampLabelLength = 12,
}: BarChartProps<T>) {
  const mode = cardTheme.runtimeMode();
  const option = React.useMemo(() => {
    const categories = data.map((row) => String(row[categoryKey] ?? ''));

    const base = chartTheme.applyBaseOption(mode);
    const xAxisIsCategory = orientation === 'vertical';

    return {
      ...base,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value: number) => chartTheme.numberFormat(value, 0),
        backgroundColor: chartTheme.tooltipBackground(mode),
      },
      legend: chartTheme.legendDefaults(mode),
      xAxis: xAxisIsCategory
        ? {
            type: 'category',
            data: categories.map((label) => clampLabel(label, clampLabelLength)),
            axisLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
            axisLabel: { color: chartTheme.axisLabel(mode) },
          }
        : {
            type: 'value',
            axisLabel: {
              color: chartTheme.axisLabel(mode),
              formatter: (value: number) => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            splitLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
          },
      yAxis: !xAxisIsCategory
        ? {
            type: 'category',
            data: categories.map((label) => clampLabel(label, clampLabelLength)).reverse(),
            axisLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
            axisLabel: { color: chartTheme.axisLabel(mode) },
          }
        : {
            type: 'value',
            axisLabel: {
              color: chartTheme.axisLabel(mode),
              formatter: (value: number) => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            splitLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
          },
      series: series.map((serie, index) => ({
        type: 'bar',
        id: serie.id,
        name: serie.name ?? serie.id,
        stack: serie.stack,
        itemStyle: {
          borderRadius: orientation === 'vertical' ? [12, 12, 0, 0] : [0, 12, 12, 0],
          color: serie.color ?? chartTheme.palette[index % chartTheme.palette.length],
        },
        data: data.map((row) => {
          const raw = serie.formatter ? serie.formatter(toNumber(row[serie.valueKey]), row) : toNumber(row[serie.valueKey]);
          return {
            value: raw,
            row,
          };
        }),
      })),
    };
  }, [categoryKey, clampLabelLength, data, mode, orientation, series]);

  return (
    <ReactECharts
      notMerge
      lazyUpdate
      style={{ height, width: '100%' }}
      option={option}
      onEvents={{
        click: (params) => {
          if (!onSelect) return;
          const serie = series[params.seriesIndex ?? 0];
          const row = (params.data as { row: T } | undefined)?.row;
          if (!serie || !row) return;
          const category = String(row[categoryKey] ?? '');
          onSelect({
            category,
            seriesId: serie.id,
            value: toNumber(params.value as number | string),
            row,
          });
        },
      }}
    />
  );
}
