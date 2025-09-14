import React from 'react';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../../styles/chartTheme';
import { Boxes, AlertTriangle, PackageX, DollarSign } from 'lucide-react';
import KPICard from '../ui/KPICard';

type Delta = { value: number; direction: 'up' | 'down' };
type Kpi = { label: string; value: string | number; icon: React.ReactNode; delta: Delta };

const CardWrap: React.FC<React.PropsWithChildren<{ ariaLabel?: string }>> = ({ children, ariaLabel }) => (
  <section aria-label={ariaLabel}
    className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6">
    {children}
  </section>
);

const KpiCardLocal: React.FC<Kpi> = ({ label, value, icon, delta }) => (
  <KPICard label={label} value={value} icon={icon} delta={{ pct: `${Math.abs(delta.value).toFixed(2)}%`, trend: delta.direction==='up'?'up':'down' }} />
);

export default function WarehouseKpiMovementsBlock() {
  // Demo data slots (replace with real values later)
  const kpis: Kpi[] = [
    { label: 'In-Stock Items (Qty)', value: 12840, icon: <Boxes size={20} />, delta: { value: 2.4, direction: 'up' } },
    { label: 'Low-Stock Alerts', value: 37, icon: <AlertTriangle size={20} />, delta: { value: -1.1, direction: 'down' } },
    { label: 'Out-of-Stock SKUs', value: 12, icon: <PackageX size={20} />, delta: { value: 0.6, direction: 'up' } },
    { label: 'Inventory Value (SAR)', value: '6.2M', icon: <DollarSign size={20} />, delta: { value: 1.9, direction: 'up' } },
  ];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const inbound = [1200, 2100, 1800, 2200, 1500, 1900, 2400, 1700, 2100, 2600, 2000, 1800];
  const outbound = [800,  1600, 1200, 1800, 1100, 1500, 2000, 1400, 1700, 2200, 1500, 1300];

  const option = React.useMemo(() => ({
    aria: { enabled: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: any) => Number(v).toLocaleString(),
    },
    legend: { bottom: 0 },
    grid: { left: 28, right: 18, top: 16, bottom: 48, containLabel: true },
    xAxis: { type: 'category', data: months, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    series: [
      { name: 'Inbound Receipts', type: 'bar', data: inbound, itemStyle: { color: chartTheme.mkGradient(chartTheme.brandPrimary), borderRadius: [8,8,0,0] } },
      { name: 'Outbound Issues', type: 'bar', data: outbound, itemStyle: { color: chartTheme.mkGradient(chartTheme.brandSecondary), borderRadius: [8,8,0,0] } },
    ],
  }), []);

  return (
    <CardWrap ariaLabel="Warehouse KPIs and Monthly Stock Movements">
      <div className="text-[16px] font-semibold text-gray-900 mb-4">Inventory</div>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(k => <KpiCardLocal key={k.label} {...k} />)}
      </div>
      {/* Bar Chart */}
      <div className="mt-6">
        <div className="text-[16px] font-semibold mb-1">Monthly Stock Movements</div>
        <ReactECharts option={option as any} style={{ height: 300 }} notMerge />
      </div>
    </CardWrap>
  );
}
