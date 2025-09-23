import React from 'react';
import { Timer, UserPlus, Users, Wallet } from 'lucide-react';

import { useVendorsAnalytics, useVendorsKpis } from '../../features/vendors/hooks';
import { StatCard, BarChartCard } from '../shared';

type VendorStat = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  valueFormat?: 'number' | 'sar' | 'percent';
};

export default function VendorsKpiSpendBlock({ subtitle }: { subtitle?: string } = {}) {
  const { data: kpis, isLoading: loadingKpis, error: kpisError } = useVendorsKpis();
  const { data: analytics, isLoading: loadingAnalytics, error: analyticsError } = useVendorsAnalytics();

  const stats: VendorStat[] = [
    { label: 'Active Vendors', value: kpis.active ?? 0, icon: <Users size={20} />, valueFormat: 'number' as const },
    { label: 'New Vendors (This Month)', value: kpis.newThisMonth ?? 0, icon: <UserPlus size={20} />, valueFormat: 'number' as const },
    {
      label: 'Average Trust Score (%)',
      value: analytics.ratingAvg != null ? analytics.ratingAvg : '—',
      icon: <Timer size={20} />,
      valueFormat: analytics.ratingAvg != null ? 'percent' : undefined,
    },
    { label: 'Total Vendor Spend (SAR)', value: kpis.totalSpend ?? 0, icon: <Wallet size={20} />, valueFormat: 'sar' as const },
  ];

  const monthlySpendData = React.useMemo(
    () => (analytics.monthlySpend ?? []).map((entry) => ({ label: entry.month, value: entry.total })),
    [analytics.monthlySpend],
  );

  const loading = loadingKpis || loadingAnalytics;
  const error = kpisError || analyticsError;

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Vendors KPIs and Monthly Spend">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Vendors</div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={loading ? '—' : k.value}
            valueFormat={typeof k.value === 'number' ? k.valueFormat : undefined}
            icon={k.icon}
            delta={null}
            className="h-full"
          />
        ))}
      </div>
      <div className="mt-6" role="img" aria-label="Monthly Vendor Spend">
        <div className="relative">
          {error ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-red-600">
              Unable to load vendor spend trend.
            </div>
          ) : (
            <BarChartCard
              title="Monthly Vendor Spend"
              subtitle="Values in SAR"
              data={monthlySpendData}
              height={300}
              loading={loading}
              axisValueSuffix=""
              tooltipValueSuffix=" SAR"
            />
          )}
          <button type="button" aria-label="More options" className="absolute right-6 top-6 text-gray-400">•••</button>
        </div>
      </div>
    </section>
  );
}
