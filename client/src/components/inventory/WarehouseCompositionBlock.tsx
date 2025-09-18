import React from 'react';
import { PieChartCard } from '../shared';
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

  const statusChart = statusData.map((item, index) => ({
    ...item,
    color: [chartTheme.accentTeal, '#F59E0B', '#EF4444'][index % 3],
  }));

  const warehouseChart = React.useMemo(() => {
    const data = dataset === 'raw' ? byWhRaw : byWhFinished;
    const colors = [chartTheme.brandPrimary, '#06B6D4', chartTheme.brandSecondary];
    return data.map((item, index) => ({ ...item, color: colors[index % colors.length] }));
  }, [dataset]);

  return (
    <Wrap ariaLabel="Warehouse Composition pies">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[16px] font-semibold">Warehouse Composition</div>
        <div className="text-[12px] text-gray-500">Raw / Finished toggle</div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PieChartCard
          title="Stock Status"
          subtitle="In Stock / Low Stock / Out Of Stock"
          data={statusChart}
          className="h-full"
        />
        <div className="relative">
          <PieChartCard
            title={`Inventory by Warehouse (${dataset === 'raw' ? 'Raw' : 'Finished'})`}
            subtitle="Total quantity"
            data={warehouseChart}
            className="h-full pr-20"
          />
          <div className="absolute right-6 top-6 flex items-center gap-2 text-xs">
            <button
              className={`rounded border px-2 py-1 ${dataset === 'raw' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => setDataset('raw')}
            >
              Raw
            </button>
            <button
              className={`rounded border px-2 py-1 ${dataset === 'finished' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => setDataset('finished')}
            >
              Finished
            </button>
          </div>
        </div>
      </div>
    </Wrap>
  );
}
