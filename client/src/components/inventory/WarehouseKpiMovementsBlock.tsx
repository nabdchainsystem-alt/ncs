import React from 'react';
import { Boxes, AlertTriangle, DollarSign, PackageX } from 'lucide-react';

import { useMonthlyStockMovements } from '../../features/overview/hooks';
import { useAllInventoryTableItems, useInventoryKpis } from '../../features/inventory/hooks';
import type { InventoryStoreSnapshot } from '../../features/inventory/types';
import chartTheme from '../../styles/chartTheme';
import { StatCard } from '../shared';
import { AsyncECharts } from '../charts/AsyncECharts';

const CardWrap: React.FC<React.PropsWithChildren<{ ariaLabel?: string }>> = ({ children, ariaLabel }) => (
  <section aria-label={ariaLabel} className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6">
    {children}
  </section>
);

export default function WarehouseKpiMovementsBlock({ subtitle }: { subtitle?: string } = {}) {
  const {
    data: inventoryItems = [],
    isLoading: loadingInventory,
    error: inventoryError,
  } = useAllInventoryTableItems();
  const {
    data: inventoryKpis,
    isLoading: loadingInventoryKpis,
    error: inventoryKpisError,
  } = useInventoryKpis();
  const {
    data: movementsData,
    isLoading: loadingMovements,
    error: movementsError,
  } = useMonthlyStockMovements();

  const inventorySummary = React.useMemo(() => {
    if (inventoryKpis && !inventoryKpisError) {
      const hasCurrency = inventoryKpis.inventoryValue > 0;
      return {
        lowStock: inventoryKpis.lowStock,
        outOfStock: inventoryKpis.outOfStock,
        totalItems: inventoryKpis.totalItems,
        totalQty: inventoryKpis.stores.reduce((sum, store) => sum + store.qty, 0),
        displayValue: inventoryKpis.inventoryValue,
        hasCurrency,
      };
    }

    let lowStock = 0;
    let outOfStock = 0;
    let totalQty = 0;
    let totalItems = inventoryItems.length;
    let valueSar = 0;
    let hasCurrency = false;

    inventoryItems.forEach((item) => {
      const qty = Number.isFinite(item.qty) ? Number(item.qty) : 0;
      totalQty += qty;
      if (item.status === 'low-stock') lowStock += 1;
      if (item.status === 'out-of-stock') outOfStock += 1;
      const unitCost = typeof item.unitCost === 'number' && Number.isFinite(item.unitCost) ? item.unitCost : 0;
      if (unitCost > 0) {
        valueSar += unitCost * qty;
        hasCurrency = true;
      }
    });

    const displayValue = hasCurrency ? valueSar : totalQty;

    return {
      lowStock,
      outOfStock,
      totalItems,
      totalQty,
      displayValue,
      hasCurrency,
    };
  }, [inventoryItems, inventoryKpis, inventoryKpisError]);

  const topInventoryStores = React.useMemo<InventoryStoreSnapshot[]>(() => {
    if (!inventoryKpis || inventoryKpisError) return [];
    return inventoryKpis.stores.slice(0, 3);
  }, [inventoryKpis, inventoryKpisError]);

  const storeRows = React.useMemo<InventoryStoreSnapshot[]>(() => {
    if (!inventoryKpis || inventoryKpisError) return [];
    return [...inventoryKpis.stores].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  }, [inventoryKpis, inventoryKpisError]);

  const cards = React.useMemo(() => (
    [
      {
        key: 'low-stock',
        label: 'Low Stock',
        icon: <AlertTriangle size={20} />,
        value: inventorySummary.lowStock,
        format: 'number' as const,
      },
      {
        key: 'out-of-stock',
        label: 'Out of Stock',
        icon: <PackageX size={20} />,
        value: inventorySummary.outOfStock,
        format: 'number' as const,
      },
      {
        key: 'inventory-value',
        label: inventorySummary.hasCurrency ? 'Inventory Value (SAR)' : 'Inventory Quantity',
        icon: <DollarSign size={20} />,
        value: inventorySummary.displayValue,
        format: inventorySummary.hasCurrency ? ('sar' as const) : ('number' as const),
      },
      {
        key: 'total-items',
        label: 'Total Items',
        icon: <Boxes size={20} />,
        value: inventorySummary.totalItems,
        format: 'number' as const,
      },
    ]
  ), [inventorySummary]);

  const currencyFormatter = React.useMemo(() => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }), []);
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }), []);

  const chartOption = React.useMemo(() => {
    const categories = movementsData.months ?? [];
    if (!categories.length) return null;

    const hasValueSeries = Array.isArray(movementsData.inboundValue)
      && movementsData.inboundValue.length === categories.length;

    const inbound = hasValueSeries
      ? movementsData.inboundValue ?? []
      : movementsData.inbound ?? [];
    const outbound = hasValueSeries
      ? movementsData.outboundValue ?? []
      : movementsData.outbound ?? [];

    return {
      aria: { enabled: true },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: number) => hasValueSeries
          ? currencyFormatter.format(Number(value ?? 0))
          : Number(value ?? 0).toLocaleString(),
      },
      legend: { bottom: 0, data: hasValueSeries ? ['Inbound Value', 'Outbound Value'] : ['Inbound Receipts', 'Outbound Issues'] },
      grid: { left: 28, right: 18, top: 16, bottom: 48, containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: chartTheme.neutralGrid() } },
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } }, minInterval: 1 },
      series: [
        {
          name: hasValueSeries ? 'Inbound Value' : 'Inbound Receipts',
          type: 'bar',
          data: inbound,
          itemStyle: { color: chartTheme.mkGradient(chartTheme.brandPrimary), borderRadius: [8, 8, 0, 0] },
        },
        {
          name: hasValueSeries ? 'Outbound Value' : 'Outbound Issues',
          type: 'bar',
          data: outbound,
          itemStyle: { color: chartTheme.mkGradient(chartTheme.brandSecondary), borderRadius: [8, 8, 0, 0] },
        },
      ],
    };
  }, [movementsData.months, movementsData.inbound, movementsData.outbound, movementsData.inboundValue, movementsData.outboundValue, currencyFormatter]);

  const cardsLoadingOrError = loadingInventoryKpis || Boolean(inventoryKpisError) || loadingInventory || Boolean(inventoryError);
  const loading = loadingInventory || loadingMovements;
  const errorMessage = movementsError;

  return (
    <CardWrap ariaLabel="Warehouse KPIs and Monthly Stock Movements">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900">Inventory</div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={cardsLoadingOrError ? '—' : card.value}
            valueFormat={cardsLoadingOrError ? undefined : card.format}
            icon={card.icon}
            delta={null}
            className="h-full"
          />
        ))}
      </div>
      {/* Bar Chart */}
      <div className="mt-6">
        <div className="text-[16px] font-semibold mb-1">Monthly Stock Movements</div>
        {inventoryError ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-red-600">
            Unable to load inventory metrics.
          </div>
        ) : errorMessage ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-red-600">
            Unable to load inventory trend.
          </div>
        ) : chartOption ? (
          <AsyncECharts option={chartOption as any} style={{ height: 300 }} notMerge fallbackHeight={300} />
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
            {loading ? 'Loading inventory trend…' : 'No stock movement data available.'}
          </div>
        )}
        {movementsData.stores && movementsData.stores.length ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/60">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Top Stores by Movement Value</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {movementsData.stores.slice(0, 3).map((store) => (
                <div key={store.store} className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{store.store}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Inbound: <span className="font-medium text-emerald-600 dark:text-emerald-400">{currencyFormatter.format(store.inboundValue)}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Outbound: <span className="font-medium text-rose-600 dark:text-rose-400">{currencyFormatter.format(store.outboundValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {topInventoryStores.length ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm shadow-inner dark:border-gray-800 dark:bg-gray-900/60">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Store Snapshot</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topInventoryStores.map((store) => (
              <div key={`${store.store}-${store.storeId ?? 'n/a'}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{store.store}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Value: <span className="font-medium text-gray-900 dark:text-gray-100">{currencyFormatter.format(store.value)}</span></div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Items: <span className="font-medium">{store.items}</span> • Low: <span className="font-medium text-amber-600 dark:text-amber-400">{store.lowStock}</span> • Out: <span className="font-medium text-rose-600 dark:text-rose-400">{store.outOfStock}</span></div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Store Breakdown</div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">Sorted by inventory value</div>
        </div>
        {storeRows.length ? (
          <div className="max-h-64 overflow-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-100 text-xs dark:divide-gray-800">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Store</th>
                  <th className="px-3 py-2 text-right">Value (SAR)</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Items</th>
                  <th className="px-3 py-2 text-right">Low</th>
                  <th className="px-3 py-2 text-right">Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {storeRows.map((store) => (
                  <tr key={`${store.store}-${store.storeId ?? 'n/a'}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/70">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{store.store}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{currencyFormatter.format(store.value)}</td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{numberFormatter.format(store.qty)}</td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{numberFormatter.format(store.items)}</td>
                    <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400">{numberFormatter.format(store.lowStock)}</td>
                    <td className="px-3 py-2 text-right text-rose-600 dark:text-rose-400">{numberFormatter.format(store.outOfStock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid h-24 place-items-center text-xs text-gray-500 dark:text-gray-400">
            No store allocations available yet.
          </div>
        )}
      </div>
    </CardWrap>
  );
}
