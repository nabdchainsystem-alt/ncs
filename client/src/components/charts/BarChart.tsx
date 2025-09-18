import React from 'react';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../../theme/chartTheme';
import { clampLabel } from '../../shared/format';
import cardTheme from '../../theme/cardTheme';

export type BarChartSeries<T extends Record<string, unknown>> = {
  id: string;
  valueKey: keyof T;
  name?: string;
  color?: string;
  stack?: string;
  formatter?: (value: number, row: T) => number;
};

type GridOption = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  containLabel?: boolean;
  [key: string]: unknown;
};

type AxisOption = {
  type?: 'category' | 'value';
  data?: string[];
  boundaryGap?: boolean | [number | string, number | string];
  axisTick?: { alignWithLabel?: boolean; show?: boolean };
  axisLine?: { lineStyle?: { color?: string } };
  axisLabel?: { rotate?: number; formatter?: (value: string | number) => string; color?: string; [key: string]: unknown };
  splitLine?: { lineStyle?: { color?: string } };
  splitNumber?: number;
  minInterval?: number;
  max?: number;
  min?: number;
  position?: 'left' | 'right';
  [key: string]: unknown;
};

export type BarChartAppearanceOverrides = {
  grid?: Partial<GridOption>;
  barWidth?: string | number;
  xAxis?: Partial<AxisOption>;
  yAxis?: Partial<AxisOption>;
  legend?: boolean;
};

export const BAR_CHART_DEFAULTS = Object.freeze({
  grid: { top: 40, right: 24, bottom: 40, left: 48, containLabel: true } as GridOption,
  barWidth: '38%' as const,
  clampLabelLength: 12,
});

export type BarChartProps<T extends Record<string, unknown>> = {
  data: T[];
  categoryKey: keyof T;
  series: BarChartSeries<T>[];
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  onSelect?: (payload: { category: string; seriesId: string; value: number; row: T }) => void;
  clampLabelLength?: number;
  appearance?: BarChartAppearanceOverrides;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

type EChartsClickParams<T> = {
  seriesIndex?: number;
  value?: number | string;
  data?: { row: T };
};

const mergeAxis = (base: AxisOption, overrides?: Partial<AxisOption>): AxisOption => {
  if (!overrides) return base;
  const next: AxisOption = {
    ...base,
    ...overrides,
  };
  if (base.axisLabel || overrides.axisLabel) {
    (next as any).axisLabel = {
      ...(base.axisLabel ?? {}),
      ...(overrides.axisLabel ?? {}),
    };
  }
  return next;
};

export default function BarChart<T extends Record<string, unknown>>({
  data,
  categoryKey,
  series,
  height = chartTheme.heights.bar,
  orientation = 'vertical',
  onSelect,
  clampLabelLength = BAR_CHART_DEFAULTS.clampLabelLength,
  appearance,
}: BarChartProps<T>) {
  const mode = cardTheme.runtimeMode();
  const option = React.useMemo(() => {
    const categories = data.map((row) => String(row[categoryKey] ?? ''));

    const base = chartTheme.applyBaseOption(mode);
    const xAxisIsCategory = orientation === 'vertical';
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const grid: GridOption = {
      ...BAR_CHART_DEFAULTS.grid,
      ...(appearance?.grid ?? {}),
    };
    const computedBarWidth = appearance?.barWidth ?? BAR_CHART_DEFAULTS.barWidth;

    const xAxis = xAxisIsCategory
      ? mergeAxis(
          {
            type: 'category',
            data: categories,
            boundaryGap: true,
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
            axisLabel: {
              color: chartTheme.axisLabel(mode),
              rotate: isSmallScreen ? 20 : 0,
              formatter: (value: string | number) => clampLabel(String(value), clampLabelLength),
            },
          },
          appearance?.xAxis,
        )
      : mergeAxis(
          {
            type: 'value',
            axisLabel: {
              color: chartTheme.axisLabel(mode),
              formatter: (value: string | number) => chartTheme.numberFormat(Number(value), 0),
            },
            splitNumber: 5,
            splitLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
            minInterval: 1,
          },
          appearance?.xAxis,
        );

    const yAxis = !xAxisIsCategory
      ? mergeAxis(
          {
            type: 'category',
            data: [...categories].reverse(),
            boundaryGap: true,
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
            axisLabel: {
              color: chartTheme.axisLabel(mode),
              formatter: (value: string | number) => clampLabel(String(value), clampLabelLength),
            },
          },
          appearance?.yAxis,
        )
      : mergeAxis(
          {
            type: 'value',
            axisLabel: {
              color: chartTheme.axisLabel(mode),
              formatter: (value: string | number) => chartTheme.numberFormat(Number(value), 0),
            },
            splitNumber: 5,
            splitLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
            minInterval: 1,
          },
          appearance?.yAxis,
        );

    const legendOption = appearance?.legend === false ? { show: false } : chartTheme.legendDefaults(mode);

    return {
      ...base,
      grid,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value: number) => chartTheme.numberFormat(value, 0),
        backgroundColor: chartTheme.tooltipBackground(mode),
      },
      legend: legendOption,
      xAxis,
      yAxis,
      series: series.map((serie, index) => ({
        type: 'bar',
        id: serie.id,
        name: serie.name ?? serie.id,
        stack: serie.stack,
        barWidth: computedBarWidth,
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
  }, [appearance, categoryKey, clampLabelLength, data, mode, orientation, series]);

  return (
    <ReactECharts
      notMerge
      lazyUpdate
      style={{ height, width: '100%' }}
      option={option}
      onEvents={{
        click: (params: EChartsClickParams<T>) => {
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
