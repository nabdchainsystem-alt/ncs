import React from 'react';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../../theme/chartTheme';
import { clampLabel, formatNumber, percent } from '../../shared/format';
import cardTheme from '../../theme/cardTheme';

type PieChartDatum = {
  name: string;
  value: number;
};

type PieClickParams = {
  data?: PieChartDatum;
};

type PieChartProps = {
  data: PieChartDatum[];
  height?: number;
  onSelect?: (datum: PieChartDatum) => void;
  clampLabelLength?: number;
  innerRadius?: string;
  outerRadius?: string;
  roseType?: 'radius' | 'area';
};

export default function PieChart({
  data,
  height = chartTheme.heights.pie,
  onSelect,
  clampLabelLength = 14,
  innerRadius = '48%',
  outerRadius = '70%',
  roseType,
}: PieChartProps) {
  const mode = cardTheme.runtimeMode();

  const option = React.useMemo(() => ({
    tooltip: {
      trigger: 'item',
      valueFormatter: (value: number) => formatNumber(value, { maximumFractionDigits: 0 }),
      backgroundColor: chartTheme.tooltipBackground(mode),
      formatter: (params: any) => {
        const val = Number(params.value);
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const pct = total > 0 ? percent(val / total, 1) : '—';
        return `${params.name}: ${formatNumber(val, { maximumFractionDigits: 0 })} (${pct})`;
      },
    },
    legend: chartTheme.legendDefaults(mode),
    series: [
      {
        type: 'pie',
        radius: [innerRadius, outerRadius],
        roseType,
        labelLine: { length: 16, length2: 12 },
        label: {
          formatter: (params: any) => clampLabel(params.name, clampLabelLength),
          color: chartTheme.axisLabel(mode),
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: { color: chartTheme.palette[index % chartTheme.palette.length] },
        })),
      },
    ],
  }), [clampLabelLength, data, innerRadius, mode, outerRadius]);

  return (
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
}

export type { PieChartProps, PieChartDatum };
