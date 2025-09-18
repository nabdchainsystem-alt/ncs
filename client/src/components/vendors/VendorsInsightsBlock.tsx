import React from 'react';
import chartTheme from '../../styles/chartTheme';
import PieInsightCard from '../charts/PieInsightCard';

export default function VendorsInsightsBlock({ subtitle }: { subtitle?: string } = {}) {
  // Demo datasets (replace with real data later)
  const monthlyTop10 = [
    { name: 'Alpha Co.', value: 820000 },
    { name: 'Beta Ltd.', value: 610000 },
    { name: 'Gamma Inc.', value: 550000 },
    { name: 'Delta LLC', value: 420000 },
    { name: 'Epsilon', value: 380000 },
    { name: 'Zeta', value: 340000 },
    { name: 'Eta', value: 300000 },
    { name: 'Theta', value: 280000 },
    { name: 'Iota', value: 250000 },
    { name: 'Kappa', value: 220000 },
  ];
  const yearlyTop10 = monthlyTop10.map((d) => ({ ...d, value: Math.round(d.value * 8.5) }));
  const [mode, setMode] = React.useState<'Monthly'|'Yearly'>('Monthly');

  const spendPalette = React.useMemo(
    () => [chartTheme.brandPrimary, chartTheme.brandSecondary, chartTheme.accentTeal, '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#64748B', '#0EA5E9'],
    [],
  );

  const spendData = React.useMemo(
    () =>
      (mode === 'Monthly' ? monthlyTop10 : yearlyTop10).map((slice, index) => ({
        name: slice.name,
        value: slice.value,
        color: spendPalette[index % spendPalette.length],
      })),
    [mode, spendPalette],
  );

  const performanceData = React.useMemo(
    () => [
      { name: 'Excellent', value: 18, color: '#10B981' },
      { name: 'Good', value: 34, color: '#EAB308' },
      { name: 'Fair', value: 21, color: '#F59E0B' },
      { name: 'Poor', value: 7, color: '#EF4444' },
    ],
    [],
  );

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Vendor Insights">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Vendor Insights</div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieInsightCard
          title="Top 10 Vendors by Spend"
          subtitle={`${mode} totals (SAR)`}
          data={spendData}
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
          title="Vendor Performance Score"
          subtitle="Excellent / Good / Fair / Poor"
          data={performanceData}
          description="Vendor portfolio split by performance rating. Use this mix to plan supplier development or corrective actions."
          height={300}
        />
      </div>
    </section>
  );
}
