import React from 'react';
import ReactECharts from 'echarts-for-react';
import BaseCard from '../ui/BaseCard';
import KPICard from '../ui/KPICard';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { Wallet, Clock, CheckCircle2, CalendarDays } from 'lucide-react';

type Delta = { pct: string; trend: 'up'|'down' } | null;
type Kpi = { label: string; value: string | number; icon?: React.ReactNode; delta?: Delta };

export type FinancialOverviewProps = {
  kpis?: Kpi[];
  statusData?: { name: 'Open'|'Pending'|'Closed'|'Scheduled'; value: number }[];
  methodData?: { name: 'Cash'|'Credit'|'Transfer'; value: number }[];
};

export default function FinancialOverviewBlock({
  kpis = [
    { label: 'Open Payments',     value: '128',  icon: <Wallet size={20} />,        delta: { pct: '+2.4%', trend: 'up' } },
    { label: 'Pending Payments',  value: '54',   icon: <Clock size={20} />,         delta: { pct: '−1.2%', trend: 'down' } },
    { label: 'Closed Payments',   value: '930',  icon: <CheckCircle2 size={20} />,  delta: { pct: '+0.8%', trend: 'up' } },
    { label: 'Scheduled Payments',value: '42',   icon: <CalendarDays size={20} />,  delta: { pct: '+3.1%', trend: 'up' } },
  ],
  statusData = [
    { name: 'Open', value: 42000 },
    { name: 'Pending', value: 18000 },
    { name: 'Closed', value: 96000 },
    { name: 'Scheduled', value: 22000 },
  ],
  methodData = [
    { name: 'Cash', value: 38000 },
    { name: 'Credit', value: 52000 },
    { name: 'Transfer', value: 88000 },
  ],
}: FinancialOverviewProps) {

  const statusOption = React.useMemo(() => ({
    aria: { enabled: true },
    color: [chartTheme.brandPrimary, chartTheme.brandSecondary, chartTheme.accentTeal, '#06B6D4'],
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name} — ${Number(p.value).toLocaleString()} SAR (${p.percent}%)` },
    legend: { show: false },
    series: [{
      type: 'pie', roseType: 'area', radius: ['30%','70%'], center:['50%','55%'],
      itemStyle: { borderColor:'#fff', borderWidth:2 },
      label: { show: true, formatter: '{b}' },
      labelLine: { show: true, length: 10, length2: 6 },
      emphasis: { scale: true, scaleSize: 4 },
      data: statusData,
    }],
  }), [statusData]);

  const methodOption = React.useMemo(() => ({
    aria: { enabled: true },
    color: ['#A855F7', '#F59E0B', '#22C55E'],
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name} — ${Number(p.value).toLocaleString()} SAR (${p.percent}%)` },
    legend: { show: false },
    series: [{
      type: 'pie', roseType: 'area', radius: ['30%','70%'], center:['50%','55%'],
      itemStyle: { borderColor:'#fff', borderWidth:2 },
      label: { show: true, formatter: '{b}' },
      labelLine: { show: true, length: 10, length2: 6 },
      emphasis: { scale: true, scaleSize: 4 },
      data: methodData,
    }],
  }), [methodData]);

  return (
    <div className="space-y-6">
      {/* Block A — KPI row */}
      <BaseCard title="Financial Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((k) => (
            <KPICard key={k.label} label={k.label} value={k.value} icon={k.icon} delta={k.delta || null} />
          ))}
        </div>
      </BaseCard>

      {/* Block B — Two pies side by side, each separated inside the card */}
      <BaseCard title="Payments Breakdown">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section aria-label="Payments by Status" className="rounded-2xl border p-4 bg-white dark:bg-gray-900">
            <div className="text-sm font-semibold">Payments by Status</div>
            <div className="text-[13px] text-gray-500">Open / Pending / Closed / Scheduled</div>
            <ReactECharts option={statusOption as any} style={{ height: 300 }} notMerge />
          </section>
          <section aria-label="Payments by Method" className="rounded-2xl border p-4 bg-white dark:bg-gray-900">
            <div className="text-sm font-semibold">Payments by Method</div>
            <div className="text-[13px] text-gray-500">Cash / Credit / Transfer</div>
            <ReactECharts option={methodOption as any} style={{ height: 300 }} notMerge />
          </section>
        </div>
      </BaseCard>
    </div>
  );
}
