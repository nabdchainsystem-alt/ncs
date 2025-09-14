import React from 'react';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../../styles/chartTheme';

export default function VendorsInsightsBlock() {
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

  const spendOption = React.useMemo(() => ({
    aria: { enabled: true },
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${Number(p.value).toLocaleString()} SAR (${p.percent}%)` },
    color: [chartTheme.brandPrimary, chartTheme.brandSecondary, chartTheme.accentTeal, '#06B6D4','#22C55E','#F59E0B','#EF4444','#A855F7','#64748B','#0EA5E9'],
    series: [{
      type: 'pie', roseType: 'area', radius: ['30%','70%'], center:['50%','55%'],
      itemStyle:{ borderColor:'#fff', borderWidth:2 },
      data: (mode==='Monthly' ? monthlyTop10 : yearlyTop10),
    }],
  }), [mode]);

  const perfOption = React.useMemo(() => ({
    aria: { enabled: true },
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${p.value} vendors (${p.percent}%)` },
    color: ['#10B981','#EAB308','#F59E0B','#EF4444'],
    series: [{
      type: 'pie', roseType: 'area', radius: ['30%','70%'], center:['50%','55%'],
      itemStyle:{ borderColor:'#fff', borderWidth:2 },
      data: [
        { name: 'Excellent', value: 18 },
        { name: 'Good', value: 34 },
        { name: 'Fair', value: 21 },
        { name: 'Poor', value: 7 },
      ],
    }],
  }), []);

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Vendor Insights">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Top 10 Vendors by Spend</div>
              <div className="text-[13px] text-gray-500">Top 10 Vendors</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {(['Monthly','Yearly'] as const).map(m => (
                <button key={m} onClick={()=>setMode(m)} className={`px-2 py-1 rounded border ${mode===m?'bg-gray-100 dark:bg-gray-800':''}`}>{m}</button>
              ))}
            </div>
          </div>
          <ReactECharts option={spendOption as any} style={{ height: 300 }} notMerge />
        </div>
        <div className="rounded-2xl border bg-white dark:bg-gray-900 p-4">
          <div className="text-sm font-semibold">Vendor Performance Score</div>
          <div className="text-[13px] text-gray-500">Excellent / Good / Fair / Poor</div>
          <ReactECharts option={perfOption as any} style={{ height: 300 }} notMerge />
        </div>
      </div>
    </section>
  );
}
