import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, UserPlus, Timer, Wallet } from 'lucide-react';
import KPICard from '../ui/KPICard';

type Kpi = { label: string; value: string | number; icon: React.ReactNode; delta: { value: number; direction: 'up' | 'down' } };

export default function VendorsKpiSpendBlock() {
  // Demo KPI data (replace later)
  const kpis: Kpi[] = [
    { label: 'Active Vendors', value: 84, icon: <Users size={20} />, delta: { value: 2.1, direction: 'up' } },
    { label: 'New Vendors (YTD)', value: 12, icon: <UserPlus size={20} />, delta: { value: 0.8, direction: 'up' } },
    { label: 'On-Time Delivery Rate (%)', value: '92%', icon: <Timer size={20} />, delta: { value: -1.4, direction: 'down' } },
    { label: 'Total Vendor Spend (SAR)', value: '4.1M', icon: <Wallet size={20} />, delta: { value: 3.2, direction: 'up' } },
  ];

  // Demo bar data slots (replace later)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const spend = [180, 320, 240, 260, 210, 230, 280, 190, 420, 360, 260, 200]; // in k SAR

  const option = React.useMemo(() => ({
    aria: { enabled: true },
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => `${Number(v).toLocaleString()}k SAR` },
    grid: { left: 28, right: 18, top: 24, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: months, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: '#e5e7eb' } } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}k' }, splitLine: { lineStyle: { color: '#e5e7eb' } } },
    series: [
      {
        type: 'bar',
        data: spend,
        barWidth: 18,
        itemStyle: {
          borderRadius: [6,6,0,0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [ { offset: 0, color: '#3b82f6' }, { offset: 1, color: '#4f46e5' } ],
          },
        },
      },
    ],
  }), []);

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Vendors KPIs and Monthly Spend">
      <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Vendors</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(k => (
          <KPICard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            delta={{ pct: `${Math.abs(k.delta.value).toFixed(2)}%`, trend: k.delta.direction==='up'?'up':'down' }}
          />
        ))}
      </div>
      <div className="mt-6 relative" role="img" aria-label="Monthly Vendor Spend">
        <div className="text-[16px] font-semibold mb-2">Monthly Vendor Spend</div>
        <button type="button" aria-label="More options" className="absolute top-0 right-0 text-gray-400">•••</button>
        <ReactECharts option={option as any} style={{ height: 300 }} notMerge />
      </div>
    </section>
  );
}
