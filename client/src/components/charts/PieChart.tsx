import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import chartTheme from '../../theme/chartTheme';
import { clampLabel, formatNumber, percent } from '../../shared/format';
import cardTheme from '../../theme/cardTheme';

type PieChartDatum = {
  name: string;
  value: number;
  color?: string;
};

type PieClickParams = {
  data?: PieChartDatum;
};

type PieChartProps = {
  data: PieChartDatum[];
  height?: number;
  onSelect?: (datum: PieChartDatum) => void;
  description?: string;
};

export default function PieChart({
  data,
  height = chartTheme.heights.pie,
  onSelect,
  description,
}: PieChartProps) {
  const mode = cardTheme.runtimeMode();
  const LABEL_MAX = 16;

  const option = React.useMemo(() => {
    const palette = chartTheme.palette;
    return {
      tooltip: {
        trigger: 'item',
        valueFormatter: (value: number) => formatNumber(value, { maximumFractionDigits: 0 }),
        backgroundColor: chartTheme.tooltipBackground(mode),
        borderRadius: 8,
        padding: [10, 12],
        textStyle: {
          fontSize: 12,
        },
        formatter: (params: any) => {
          const val = Number(params.value);
          const total = data.reduce((sum, item) => sum + item.value, 0);
          const pct = total > 0 ? percent(val / total, 1) : '—';
          return `${params.name}: ${formatNumber(val, { maximumFractionDigits: 0 })} (${pct})`;
        },
      },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['60%', '80%'],
          center: ['50%', '52%'],
          avoidLabelOverlap: true,
          labelLayout: {
            hideOverlap: true,
            moveOverlap: 'shiftY',
          },
          labelLine: {
            show: true,
            length: 14,
            length2: 10,
            smooth: true,
            lineStyle: {
              color: chartTheme.neutralGrid(mode),
              width: 1,
            },
          },
          label: {
            show: true,
            position: 'outside',
            formatter: (params: any) => clampLabel(params.name, LABEL_MAX),
            color: chartTheme.axisLabel(mode),
            fontSize: 12,
            lineHeight: 16,
          },
          emphasis: {
            scale: true,
            scaleSize: 4,
            itemStyle: {
              shadowBlur: 12,
              shadowColor: chartTheme.neutralGrid(mode),
            },
          },
          itemStyle: {
            borderColor: cardTheme.surface(mode),
            borderWidth: 2,
          },
          data: data.map((item, index) => ({
            ...item,
            itemStyle: {
              color: item.color ?? palette[index % palette.length],
              borderColor: cardTheme.surface(mode),
              borderWidth: 2,
            },
          })),
        },
      ],
    };
  }, [data, mode]);

  const chartElement = (
    <ReactECharts
      notMerge
      lazyUpdate
      style={{ height, width: '100%' }}
      option={option}
      onEvents={{
        click: (params: PieClickParams) => {
          if (!onSelect) return;
          const datum = params?.data as PieChartDatum | undefined;
          if (!datum) return;
          onSelect(datum);
        },
      }}
    />
  );

  if (!description) {
    return <div className="relative h-full w-full">{chartElement}</div>;
  }

  return (
    <Tooltip.Provider delayDuration={120}>
      <div className="relative h-full w-full">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              aria-label="Chart info"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Info className="h-4 w-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="left"
              sideOffset={8}
              className="max-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {description}
              <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        {chartElement}
      </div>
    </Tooltip.Provider>
  );
}

export type { PieChartProps, PieChartDatum };
