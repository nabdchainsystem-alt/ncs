import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';

import { useFleetVehicles } from '../../features/fleet/hooks';
import { clampLabel, formatNumber, percent } from '../../shared/format';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';

type Slice = { name: string; value: number };

const statusLabel = (status?: string | null): string => {
  if (!status) return 'Unknown';
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'in operation') return 'In Operation';
  if (normalized === 'inmaintenance' || normalized === 'under maintenance') return 'Under Maintenance';
  if (normalized === 'retired') return 'Retired';
  if (normalized === 'idle') return 'Idle';
  return status;
};

export default function StatusDistributionPie({ height = chartTheme.heights.pie }: { height?: number }) {
  const mode = cardTheme.runtimeMode();
  const { data: vehicles, isLoading, error } = useFleetVehicles();
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

  const slices: Slice[] = React.useMemo(() => {
    const counts = new Map<string, number>();
    (vehicles ?? []).forEach((vehicle) => {
      const label = statusLabel(vehicle.status);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [vehicles]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-600">
        Unable to load fleet distribution.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading fleet distribution…
      </div>
    );
  }

  if (slices.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        No fleet status data available.
      </div>
    );
  }

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const legend = {
    ...chartTheme.legendDefaults(mode),
    orient: isWide ? 'vertical' as const : 'horizontal' as const,
    right: isWide ? 0 : undefined,
    top: isWide ? 'center' : undefined,
    bottom: isWide ? undefined : 0,
    itemGap: isWide ? 8 : 10,
  };

  const option = {
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
        data: slices.map((item, index) => ({
          ...item,
          itemStyle: {
            color: chartTheme.palette[index % chartTheme.palette.length],
          },
        })),
      },
    ],
  } as const;

  return <AsyncECharts notMerge lazyUpdate option={option} style={{ height, width: '100%' }} fallbackHeight={height} />;
}
