import React from 'react';

import { useVendorsAnalytics } from '../../features/vendors/hooks';
import chartTheme from '../../styles/chartTheme';
import PieInsightCard from '../charts/PieInsightCard';

const palette = [chartTheme.brandPrimary, chartTheme.brandSecondary, chartTheme.accentTeal, '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#64748B', '#0EA5E9'];

const mapStatusToBucket = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized.includes('approve')) return 'Performing';
  if (normalized.includes('hold') || normalized.includes('review')) return 'Watchlist';
  if (normalized.includes('suspend') || normalized.includes('block')) return 'Critical';
  return 'Other';
};

export default function VendorsInsightsBlock({ subtitle }: { subtitle?: string } = {}) {
  const { data, isLoading, error } = useVendorsAnalytics();
  const [mode, setMode] = React.useState<'Monthly' | 'Yearly'>('Monthly');

  const spendData = React.useMemo(() => {
    const list = (data.spendByVendor ?? []).slice(0, 10);
    return list.map((entry, index) => ({
      name: entry.vendorName || `Vendor ${index + 1}`,
      value: entry.total,
      color: palette[index % palette.length],
    }));
  }, [data.spendByVendor]);

  const performanceData = React.useMemo(() => {
    const grouped = new Map<string, number>();
    (data.byStatus ?? []).forEach((entry) => {
      const bucket = mapStatusToBucket(entry.status);
      grouped.set(bucket, (grouped.get(bucket) ?? 0) + entry.count);
    });
    return Array.from(grouped.entries()).map(([name, value], index) => ({
      name,
      value,
      color: palette[index % palette.length],
    }));
  }, [data.byStatus]);

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Vendor Insights">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Vendor Insights</div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieInsightCard
          title="Top 10 Vendors by Spend"
          subtitle="Total spend (SAR)"
          data={spendData}
          loading={isLoading}
          error={error ? new Error('Failed to load vendor spend analysis') : undefined}
          description="Share of total spend captured by the top suppliers for the selected period. Toggle between monthly and yearly to spot shifts in supplier concentration."
          headerRight={(
            <div className="flex items-center gap-2 text-xs">
              {(['Monthly', 'Yearly'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded border px-2 py-1 ${mode === m ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          height={300}
        />
        <PieInsightCard
          title="Vendor Status Mix"
          subtitle="Performing / Watchlist / Critical / Other"
          data={performanceData}
          loading={isLoading}
          error={error ? new Error('Failed to load vendor status mix') : undefined}
          description="Vendor portfolio split by performance rating. Use this mix to plan supplier development or corrective actions."
          height={300}
        />
      </div>
    </section>
  );
}
