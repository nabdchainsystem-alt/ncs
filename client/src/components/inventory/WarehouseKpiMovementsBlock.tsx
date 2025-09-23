import React from 'react';
import { Boxes, AlertTriangle, DollarSign, PackageX } from 'lucide-react';

import { useInventoryKpis, useInventoryMovements } from '../../features/overview/hooks';
import chartTheme from '../../styles/chartTheme';
import { StatCard } from '../shared';
import { AsyncECharts } from '../charts/AsyncECharts';

const CardWrap: React.FC<React.PropsWithChildren<{ ariaLabel?: string }>> = ({ children, ariaLabel }) => (
  <section aria-label={ariaLabel} className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6">
    {children}
  </section>
);

export default function WarehouseKpiMovementsBlock({ subtitle }: { subtitle?: string } = {}) {
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const { data: kpisData, isLoading: loadingKpis, error: kpisError } = useInventoryKpis();
  const {
    data: movementsData,
    isLoading: loadingMovements,
    error: movementsError,
  } = useInventoryMovements(currentYear);

  const totalItems = kpisData.totalItems ?? 0;
  const inStockItems = Math.max(totalItems - (kpisData.outOfStock ?? 0), 0);

  const kpis = [
    { label: 'In-Stock Items (Qty)', value: inStockItems, icon: <Boxes size={20} /> },
    { label: 'Low-Stock Alerts', value: kpisData.lowStock ?? 0, icon: <AlertTriangle size={20} /> },
    { label: 'Out-of-Stock SKUs', value: kpisData.outOfStock ?? 0, icon: <PackageX size={20} /> },
    { label: 'Inventory Value (SAR)', value: kpisData.inventoryValue ?? 0, icon: <DollarSign size={20} />, format: 'sar' as const },
  ];

  const chartOption = React.useMemo(() => {
    const categories = movementsData.categories ?? [];
    const series = movementsData.series ?? [];
    if (!categories.length || !series.length) return null;

    const palette = [chartTheme.mkGradient(chartTheme.brandPrimary), chartTheme.mkGradient(chartTheme.brandSecondary)];

    return {
      aria: { enabled: true },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: number) => Number(value ?? 0).toLocaleString(),
      },
      legend: { bottom: 0 },
      grid: { left: 28, right: 18, top: 16, bottom: 48, containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: chartTheme.neutralGrid() } },
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } }, minInterval: 1 },
      series: series.map((serie, index) => ({
        name: serie.name,
        type: 'bar',
        data: serie.data,
        itemStyle: { color: palette[index % palette.length], borderRadius: [8, 8, 0, 0] },
      })),
    };
  }, [movementsData.categories, movementsData.series]);

  const loading = loadingKpis || loadingMovements;
  const errorMessage = kpisError || movementsError;

  return (
    <CardWrap ariaLabel="Warehouse KPIs and Monthly Stock Movements">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900">Inventory</div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={loading ? '—' : k.value ?? 0}
            valueFormat={typeof k.format === 'string' ? k.format : 'number'}
            icon={k.icon}
            delta={null}
            className="h-full"
          />
        ))}
      </div>
      {/* Bar Chart */}
      <div className="mt-6">
        <div className="text-[16px] font-semibold mb-1">Monthly Stock Movements</div>
        {errorMessage ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-red-600">
            Unable to load inventory trend.
          </div>
        ) : chartOption ? (
          <AsyncECharts option={chartOption as any} style={{ height: 300 }} notMerge fallbackHeight={300} />
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
            {loading ? 'Loading inventory trend…' : 'No stock movement data available.'}
          </div>
        )}
      </div>
    </CardWrap>
  );
}
