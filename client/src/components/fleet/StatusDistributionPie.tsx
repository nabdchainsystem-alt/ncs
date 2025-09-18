import React from 'react';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../../styles/chartTheme';
import cardTheme from '../../styles/cardTheme';
import * as data from './data';
import { clampLabel, formatNumber, percent } from '../../shared/format';

export default function StatusDistributionPie({ height = chartTheme.heights.pie }: { height?: number }) {
  const mode = cardTheme.runtimeMode();
  const [isWide, setIsWide] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024; // lg and above → legend right
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const option = React.useMemo(() => {
    const total = data.statusDistribution.reduce((s, d) => s + d.value, 0);
    const legend = {
      ...chartTheme.legendDefaults(mode),
      orient: isWide ? 'vertical' as const : 'horizontal' as const,
      right: isWide ? 0 : undefined,
      top: isWide ? 'center' : undefined,
      bottom: isWide ? undefined : 0,
      itemGap: isWide ? 8 : 10,
    };

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: chartTheme.tooltipBackground(mode),
        formatter: (params: any) => {
          const val = Number(params.value);
          const pct = total > 0 ? percent(val / total, 1) : '—';
          return `${params.name}: ${formatNumber(val, { maximumFractionDigits: 0 })} (${pct})`;
        },
      },
      legend,
      series: [
        {
          type: 'pie',
          radius: ['48%', '70%'],
          labelLine: { length: 16, length2: 12 },
          label: {
            show: isWide, // off on small screens
            formatter: (p: any) => clampLabel(p.name, 12),
            color: chartTheme.axisLabel(mode),
          },
          data: data.statusDistribution.map((item, index) => ({
            ...item,
            itemStyle: {
              color: chartTheme.palette[index % chartTheme.palette.length],
            },
          })),
        },
      ],
    } as any;
  }, [isWide, mode]);

  return <ReactECharts notMerge lazyUpdate option={option} style={{ height, width: '100%' }} />;
}

