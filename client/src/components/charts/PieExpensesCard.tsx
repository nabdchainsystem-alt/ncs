import React from 'react';
import ReactECharts from 'echarts-for-react';

export type DeptDatum = { name: string; value: number; deltaPct: number };

export type PieExpensesCardProps = {
  data?: DeptDatum[];
  title?: string;
  subtitle?: string;
  height?: number; // total card height
};

const COLORS: Record<string, string> = {
  Production: '#6366f1', // indigo
  Maintenance: '#10b981', // emerald
  Quality: '#f59e0b', // amber
};

function formatSAR(n: number) {
  return `${n.toLocaleString()} SAR`;
}

function deltaChip(delta: number) {
  const up = delta >= 0;
  const color = up ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50';
  const arrow = up ? '▲' : '▼';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      {arrow} {Math.abs(delta).toFixed(2)}%
    </span>
  );
}

export default function PieExpensesCard({
  data = [
    { name: 'Production', value: 42000, deltaPct: 3.8 },
    { name: 'Maintenance', value: 31000, deltaPct: -1.3 },
    { name: 'Quality', value: 27000, deltaPct: 0.9 },
  ],
  title = 'Monthly Expenses',
  subtitle = 'Total Monthly Transfers & Cash / Department',
  height = 440,
}: PieExpensesCardProps) {
  const palette = data.map(d => COLORS[d.name] || '#94a3b8');
  const option = React.useMemo(() => ({
    aria: { enabled: true },
    color: palette,
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        const d = p?.data || {};
        const delta = typeof d.deltaPct === 'number' ? d.deltaPct : 0;
        const arrow = delta >= 0 ? '▲' : '▼';
        const color = delta >= 0 ? '#10b981' : '#ef4444';
        return (
          `<div style="font-size:12px">`+
          `<div><strong>${p.name}</strong></div>`+
          `<div>${Number(p.value).toLocaleString()} SAR</div>`+
          `<div style="color:${color}">${arrow} ${Math.abs(delta).toFixed(2)}%</div>`+
          `</div>`
        );
      },
    },
    series: [
      {
        type: 'pie',
        roseType: 'radius',
        radius: ['36%', '72%'],
        center: ['50%', '55%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
        animation: true,
        animationDuration: 600,
        selectedMode: 'single',
        data: data.map(d => ({ name: d.name, value: d.value, deltaPct: d.deltaPct })),
      },
    ],
  }), [data, palette]);

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card overflow-hidden" style={{ height }}>
      {/* Header band */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 px-6 py-4">
        <div>
          <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">{title}</div>
          <div className="text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.name] || '#94a3b8' }} />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pie chart */}
      <div className="px-6 pt-4" role="img" aria-label="Monthly expenses by department pie chart">
        <ReactECharts option={option as any} style={{ height: height - 64 - 92 }} notMerge />
      </div>

      {/* Footer stats */}
      <div className="mt-auto border-t px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.name] || '#94a3b8' }} />
                <span className="text-[14px] font-medium text-gray-700 dark:text-gray-200">{d.name}</span>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{formatSAR(d.value)}</div>
                <div className="mt-1">{deltaChip(d.deltaPct)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

