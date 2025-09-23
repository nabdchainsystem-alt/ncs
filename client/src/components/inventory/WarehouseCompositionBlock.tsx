import React from 'react';

import { useInventoryStockStatus, useInventoryByWarehouse } from '../../features/overview/hooks';
import chartTheme from '../../styles/chartTheme';
import PieInsightCard from '../charts/PieInsightCard';

const Wrap: React.FC<React.PropsWithChildren<{ ariaLabel?: string }>> = ({ children, ariaLabel }) => (
  <section aria-label={ariaLabel} className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6">
    {children}
  </section>
);

export default function WarehouseCompositionBlock({ subtitle }: { subtitle?: string } = {}) {
  const [dataset, setDataset] = React.useState<'raw' | 'finished'>('raw');
  const {
    data: stockStatusData,
    isLoading: loadingStatus,
    error: statusError,
  } = useInventoryStockStatus();
  const {
    data: warehouseData,
    isLoading: loadingWarehouse,
    error: warehouseError,
  } = useInventoryByWarehouse(dataset);

  const statusChart = React.useMemo(() => {
    const colors = [chartTheme.accentTeal, '#F59E0B', '#EF4444'];
    return (stockStatusData ?? []).map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
  }, [stockStatusData]);

  const warehouseChart = React.useMemo(() => {
    const colors = [chartTheme.brandPrimary, '#06B6D4', chartTheme.brandSecondary, '#6366F1'];
    return (warehouseData ?? []).map((item, index) => ({
      name: item.name,
      value: item.value,
      color: colors[index % colors.length],
    }));
  }, [warehouseData]);

  const loading = loadingStatus || loadingWarehouse;

  return (
    <Wrap ariaLabel="Warehouse Composition pies">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[16px] font-semibold">Warehouse Composition</div>
          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="text-[12px] text-gray-500">Raw / Finished toggle</div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PieInsightCard
          title="Stock Status"
          subtitle="In Stock / Low Stock / Out of Stock"
          data={statusChart}
          loading={loadingStatus}
          error={statusError ? new Error('Failed to load inventory status') : undefined}
          description="Breakdown of inventory health across all warehouses. Monitor this mix to prioritize replenishment actions."
          height={260}
        />
        <PieInsightCard
          title={`Inventory by Warehouse (${dataset === 'raw' ? 'Raw' : 'Finished'})`}
          subtitle="Total quantity"
          data={warehouseChart}
          loading={loading}
          error={warehouseError ? new Error('Failed to load warehouse composition') : undefined}
          description="Share of inventory held per warehouse for the selected material type. Switch between raw and finished goods to compare allocation."
          headerRight={(
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className={`rounded border px-2 py-1 ${dataset === 'raw' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                onClick={() => setDataset('raw')}
              >
                Raw
              </button>
              <button
                type="button"
                className={`rounded border px-2 py-1 ${dataset === 'finished' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                onClick={() => setDataset('finished')}
              >
                Finished
              </button>
            </div>
          )}
          height={260}
        />
      </div>
    </Wrap>
  );
}
