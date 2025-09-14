import React from 'react';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../../styles/chartTheme';

const Wrap: React.FC<React.PropsWithChildren<{ ariaLabel?: string }>> = ({ children, ariaLabel }) => (
  <section aria-label={ariaLabel} className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6">
    {children}
  </section>
);

export default function WarehouseCompositionBlock() {
  // Demo datasets (replace with real values later)
  const statusData = [
    { name: 'In Stock', value: 8200 },
    { name: 'Low Stock', value: 740 },
    { name: 'Out of Stock', value: 120 },
  ];
  const byWhRaw = [
    { name: 'WH-A', value: 3400 },
    { name: 'WH-B', value: 2800 },
    { name: 'WH-C', value: 2100 },
  ];
  const byWhFinished = [
    { name: 'WH-A', value: 2200 },
    { name: 'WH-B', value: 2600 },
    { name: 'WH-C', value: 1900 },
  ];
  const [dataset, setDataset] = React.useState<'raw'|'finished'>('raw');

  const statusOption = React.useMemo(() => ({
    aria: { enabled: true },
    color: [chartTheme.accentTeal, '#F59E0B', '#EF4444'],
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{ type: 'pie', roseType: 'area', radius: ['30%','70%'], center:['50%','55%'], itemStyle:{ borderColor:'#fff', borderWidth:2 }, data: statusData }],
  }), []);

  const byWhOption = React.useMemo(() => {
    const data = dataset==='raw' ? byWhRaw : byWhFinished;
    return {
      aria: { enabled: true },
      color: [chartTheme.brandPrimary, '#06B6D4', chartTheme.brandSecondary],
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{ type: 'pie', roseType: 'area', radius: ['30%','70%'], center:['50%','55%'], itemStyle:{ borderColor:'#fff', borderWidth:2 }, data }],
    } as any;
  }, [dataset]);

  return (
    <Wrap ariaLabel="Warehouse Composition pies">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[16px] font-semibold">Warehouse Composition</div>
        <div className="text-[12px] text-gray-500">Raw / Finished toggle</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white dark:bg-gray-900 p-4">
        <div className="text-sm font-semibold">Stock Status</div>
        <div className="text-[13px] text-gray-500">In Stock / Low Stock / Out Of Stock</div>
          <ReactECharts option={statusOption as any} style={{ height: 300 }} notMerge />
        </div>
        <div className="rounded-2xl border bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Inventory by Warehouse</div>
              <div className="text-[13px] text-gray-500">Total quantity</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button className={`px-2 py-1 rounded border ${dataset==='raw'?'bg-gray-100':''}`} onClick={()=>setDataset('raw')}>Raw</button>
              <button className={`px-2 py-1 rounded border ${dataset==='finished'?'bg-gray-100':''}`} onClick={()=>setDataset('finished')}>Finished</button>
            </div>
          </div>
          <ReactECharts option={byWhOption as any} style={{ height: 300 }} notMerge />
        </div>
      </div>
    </Wrap>
  );
}
