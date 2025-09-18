import React from 'react';
import { Users, UserPlus, Timer, Wallet } from 'lucide-react';
import { StatCard, BarChartCard } from '../shared';

type Kpi = { label: string; value: string | number; icon: React.ReactNode; delta: { value: number; direction: 'up' | 'down' } };

export default function VendorsKpiSpendBlock({ subtitle }: { subtitle?: string } = {}) {
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

  const monthlySpendData = React.useMemo(
    () => months.map((month, index) => ({ label: month, value: spend[index] })),
    [months, spend],
  );

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Vendors KPIs and Monthly Spend">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Vendors</div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            delta={{ label: `${Math.abs(k.delta.value).toFixed(2)}%`, trend: k.delta.direction }}
            className="h-full"
          />
        ))}
      </div>
      <div className="mt-6" role="img" aria-label="Monthly Vendor Spend">
        <div className="relative">
          <BarChartCard
            title="Monthly Vendor Spend"
            subtitle="Values in k SAR"
            data={monthlySpendData}
            height={300}
            axisValueSuffix="k"
            tooltipValueSuffix="k SAR"
          />
          <button type="button" aria-label="More options" className="absolute right-6 top-6 text-gray-400">•••</button>
        </div>
      </div>
    </section>
  );
}
