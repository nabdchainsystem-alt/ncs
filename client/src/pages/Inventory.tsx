import React from 'react';
import { useQueryClient } from '@tanstack/react-query';

import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import ChartCard from '../components/charts/ChartCard';
import PieInsightCard from '../components/charts/PieInsightCard';
import BarChart from '../components/charts/BarChart';
import DataTable, { type DataTableColumn } from '../components/table/DataTable';
import TableToolbar from '../components/table/TableToolbar';
import Button from '../components/ui/Button';
import {
  useActivityByTypePie,
  useCapacityVsUsedBar,
  useCriticalByCategoryPie,
  useCriticalByWarehouseBar,
  useCriticalKpis,
  useDailyMovementsBar,
  useExcessByCategoryPie,
  useInventoryActivityKpis,
  useInventoryItemsFromOrders,
  useInventoryKpis,
  useItemsByWarehouseBar,
  useRecentMovements,
  useSlowExcessKpis,
  useStockHealthPie,
  useTopSlowMovingBar,
  useUtilizationKpis,
  useUtilizationSharePie,
  useValueByCategoryBar,
} from '../features/inventory/hooks';
import type {
  BarChartResponse,
  InventoryItemsFromOrdersRow,
  PieDatum,
  RecentMovementRow,
} from '../features/inventory/types';
import { getInventoryItems, createMovement, createInventoryItem, type InventoryItemDTO } from '../lib/api';
import { toast } from 'react-hot-toast';
import {
  Truck,
  AlertTriangle,
  ArrowLeftRight,
  UploadCloud,
  DownloadCloud,
  ClipboardList,
  Scan,
  RefreshCw,
  PackagePlus,
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'SAR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-stock', label: 'In Stock' },
  { id: 'low-stock', label: 'Low Stock' },
  { id: 'out-of-stock', label: 'Out of Stock' },
] as const;

type StatusFilterId = typeof STATUS_FILTERS[number]['id'];

const MOVEMENT_TYPES = ['All', 'Inbound', 'Outbound', 'Transfer'] as const;
type MovementType = typeof MOVEMENT_TYPES[number];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const MOVEMENT_PAGE_SIZES = [5, 10, 20];

const STATUS_BADGE_STYLES: Record<string, string> = {
  'In Stock': 'bg-emerald-50 text-emerald-600',
  'Low Stock': 'bg-amber-50 text-amber-600',
  'Out of Stock': 'bg-red-50 text-red-600',
};

const severityOrder: Record<string, number> = {
  'Out of Stock': 0,
  'Low Stock': 1,
};

function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(Number.isFinite(value) ? value : 0));
}

function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(Number.isFinite(value) ? value : 0));
}

function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${percentFormatter.format(safe)}%`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Failed to load data';
}

type SingleSeriesDatum = { category: string; value: number };
type DualSeriesDatum = { category: string; first: number; second: number };

type ChartStateProps = {
  loading: boolean;
  error: unknown;
  isEmpty: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

function ChartState({ loading, error, isEmpty, emptyMessage, children }: ChartStateProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500" /></div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-600 dark:text-red-400">
        {getErrorMessage(error)}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {emptyMessage ?? 'No data available'}
      </div>
    );
  }
  return <>{children}</>;
}

type KpiTileProps = {
  label: string;
  value: string;
  hint?: string;
};

function KpiTile({ label, value, hint }: KpiTileProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition dark:border-gray-800 dark:bg-gray-900">
      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      {hint ? <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</div> : null}
    </div>
  );
}

function prepareSingleSeriesData(response?: BarChartResponse | null): SingleSeriesDatum[] {
  if (!response || !Array.isArray(response.categories) || response.categories.length === 0) return [];
  const firstSeries = response.series?.[0];
  if (!firstSeries || !Array.isArray(firstSeries.data)) return [];
  return response.categories.map((category, index) => ({
    category: String(category ?? ''),
    value: Number(firstSeries.data[index] ?? 0),
  }));
}

function prepareDualSeriesData(response?: BarChartResponse | null): DualSeriesDatum[] {
  if (!response || !Array.isArray(response.categories) || response.categories.length === 0) return [];
  const first = response.series?.[0];
  const second = response.series?.[1];
  return response.categories.map((category, index) => ({
    category: String(category ?? ''),
    first: Number(first?.data?.[index] ?? 0),
    second: Number(second?.data?.[index] ?? 0),
  }));
}

const MOVEMENT_STATUS_FILTERS = MOVEMENT_TYPES.map((type) => ({ id: type, label: type }));

type MovementActionState = {
  key: 'receive' | 'issue';
  title: string;
  moveType: 'IN' | 'OUT';
};

export default function Inventory() {
  const queryClient = useQueryClient();
  const inventoryKpisQuery = useInventoryKpis();
  const stockHealthQuery = useStockHealthPie();
  const itemsByWarehouseQuery = useItemsByWarehouseBar();
  const categoryBarQuery = useValueByCategoryBar();
  const criticalKpisQuery = useCriticalKpis();
  const criticalCategoryQuery = useCriticalByCategoryPie();
  const criticalWarehouseQuery = useCriticalByWarehouseBar();
  const slowExcessQuery = useSlowExcessKpis();
  const excessCategoryQuery = useExcessByCategoryPie();
  const topSlowMovingQuery = useTopSlowMovingBar();
  const activityKpisQuery = useInventoryActivityKpis();
  const activityByTypeQuery = useActivityByTypePie();
  const dailyMovementsQuery = useDailyMovementsBar();
  const utilizationKpisQuery = useUtilizationKpis();
  const utilizationShareQuery = useUtilizationSharePie();
  const capacityVsUsedQuery = useCapacityVsUsedBar();

  const [inventoryStatusFilter, setInventoryStatusFilter] = React.useState<StatusFilterId>('all');
  const [inventoryPage, setInventoryPage] = React.useState(0);
  const [inventoryPageSize, setInventoryPageSize] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [movementType, setMovementType] = React.useState<MovementType>('All');
  const [movementPage, setMovementPage] = React.useState(0);
  const [movementPageSize, setMovementPageSize] = React.useState(10);
  const [movementAction, setMovementAction] = React.useState<MovementActionState | null>(null);

  React.useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  const inventoryItemsQuery = useInventoryItemsFromOrders({
    page: inventoryPage + 1,
    pageSize: inventoryPageSize,
    status: inventoryStatusFilter === 'all' ? undefined : inventoryStatusFilter,
    q: searchTerm || undefined,
  });

  const recentMovementsQuery = useRecentMovements({
    page: movementPage + 1,
    pageSize: movementPageSize,
    type: movementType === 'All' ? undefined : movementType,
  });

  const criticalOutQuery = useInventoryItemsFromOrders({ page: 1, pageSize: 5, status: 'out-of-stock' });
  const criticalLowQuery = useInventoryItemsFromOrders({ page: 1, pageSize: 5, status: 'low-stock' });

  const kpisData = inventoryKpisQuery.data ?? { lowStock: 0, outOfStock: 0, inventoryValue: 0, totalItems: 0 };
  const stockHealthData = stockHealthQuery.data ?? [];
  const warehouseBarRaw = itemsByWarehouseQuery.data;
  const categoryBarRaw = categoryBarQuery.data;
  const criticalKpis = criticalKpisQuery.data;
  const criticalCategoryPie = criticalCategoryQuery.data ?? [];
  const criticalWarehouseRaw = criticalWarehouseQuery.data;
  const slowExcessKpis = slowExcessQuery.data;
  const excessCategoryPie = excessCategoryQuery.data ?? [];
  const topSlowMovingRaw = topSlowMovingQuery.data;
  const activityKpis = activityKpisQuery.data;
  const activityByType = activityByTypeQuery.data ?? [];
  const dailyMovementsRaw = dailyMovementsQuery.data;
  const utilizationKpis = utilizationKpisQuery.data;
  const utilizationShare = utilizationShareQuery.data ?? [];
  const capacityVsUsedRaw = capacityVsUsedQuery.data;

  const totalItems = kpisData.totalItems ?? 0;
  const lowStockCount = stockHealthData.find((entry) => entry.name === 'Low Stock')?.value ?? kpisData.lowStock ?? 0;
  const outOfStockCount = stockHealthData.find((entry) => entry.name === 'Out of Stock')?.value ?? kpisData.outOfStock ?? 0;
  const inStockCount = Math.max(totalItems - lowStockCount - outOfStockCount, 0);
  const statusDistribution: PieDatum[] = React.useMemo(() => [
    { name: 'In Stock', value: inStockCount },
    { name: 'Low Stock', value: lowStockCount },
    { name: 'Out of Stock', value: outOfStockCount },
  ], [inStockCount, lowStockCount, outOfStockCount]);

  const warehouseBarData = React.useMemo(() => prepareSingleSeriesData(warehouseBarRaw), [warehouseBarRaw]);
  const valueByCategoryData = React.useMemo(() => prepareSingleSeriesData(categoryBarRaw), [categoryBarRaw]);
  const criticalWarehouseData = React.useMemo(() => prepareSingleSeriesData(criticalWarehouseRaw), [criticalWarehouseRaw]);
  const topSlowMovingData = React.useMemo(() => prepareSingleSeriesData(topSlowMovingRaw), [topSlowMovingRaw]);
  const dailyMovementsData = React.useMemo(() => prepareSingleSeriesData(dailyMovementsRaw), [dailyMovementsRaw]);
  const capacityVsUsedData = React.useMemo(() => prepareDualSeriesData(capacityVsUsedRaw), [capacityVsUsedRaw]);

  const topCriticalRows = React.useMemo(() => {
    const outItems = criticalOutQuery.data?.items ?? [];
    const lowItems = criticalLowQuery.data?.items ?? [];
    const map = new Map<string, InventoryItemsFromOrdersRow>();
    [...outItems, ...lowItems].forEach((row) => {
      const key = row.code || row.name;
      if (!map.has(key)) {
        map.set(key, row);
      }
    });
    return Array.from(map.values())
      .sort((a, b) => {
        const severityDiff = (severityOrder[a.status] ?? 2) - (severityOrder[b.status] ?? 2);
        if (severityDiff !== 0) return severityDiff;
        return a.qty - b.qty;
      })
      .slice(0, 5);
  }, [criticalOutQuery.data, criticalLowQuery.data]);

  const topCriticalLoading = criticalOutQuery.isLoading || criticalLowQuery.isLoading;
  const topCriticalError = criticalOutQuery.error ?? criticalLowQuery.error;

  const inventoryRows = inventoryItemsQuery.data?.items ?? [];
  const inventoryTotal = inventoryItemsQuery.data?.total ?? 0;
  const movementRows = recentMovementsQuery.data?.items ?? [];
  const movementTotal = recentMovementsQuery.data?.total ?? 0;

  const handleStatusFilter = (id: string) => {
    setInventoryStatusFilter(id as StatusFilterId);
    setInventoryPage(0);
  };

  const handleInventorySearchSubmit = (value: string) => {
    setSearchTerm(value.trim());
    setInventoryPage(0);
  };

  const handleMovementFilter = (id: string) => {
    setMovementType(id as MovementType);
    setMovementPage(0);
  };

  const invalidateCoreInventoryQueries = React.useCallback(() => {
    const keys: Array<readonly unknown[]> = [
      ['inventory', 'kpis'],
      ['inventory', 'stock-health'],
      ['inventory', 'items-by-warehouse'],
      ['inventory', 'orders-items'],
      ['inventory', 'value-by-category'],
    ];
    keys.forEach((key) => {
      void queryClient.invalidateQueries({ queryKey: key });
    });
  }, [queryClient]);

  const handleItemCreated = React.useCallback(() => {
    setInventoryPage(0);
    invalidateCoreInventoryQueries();
    toast.success('Inventory item created');
  }, [invalidateCoreInventoryQueries, setInventoryPage]);

  const handleMovementSuccess = React.useCallback(() => {
    invalidateCoreInventoryQueries();
    void queryClient.invalidateQueries({ queryKey: ['inventory', 'activity'] });
  }, [invalidateCoreInventoryQueries, queryClient]);

  const handleRefresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    toast.success('Inventory data refreshed');
  }, [queryClient]);

  const [createItemOpen, setCreateItemOpen] = React.useState(false);

  const quickActions = React.useMemo<PageHeaderItem[]>(() => [
    {
      key: 'add-item',
      label: 'Add Inventory Item',
      icon: <PackagePlus className="w-4.5 h-4.5" />,
      onClick: () => setCreateItemOpen(true),
    },
    {
      key: 'receive-stock',
      label: 'Receive Stock',
      icon: <Truck className="w-4.5 h-4.5" />, 
      onClick: () => setMovementAction({ key: 'receive', title: 'Receive Stock', moveType: 'IN' }),
    },
    {
      key: 'issue-stock',
      label: 'Issue Stock',
      icon: <AlertTriangle className="w-4.5 h-4.5" />, 
      onClick: () => setMovementAction({ key: 'issue', title: 'Issue Stock', moveType: 'OUT' }),
    },
    {
      key: 'transfer',
      label: 'Transfer',
      icon: <ArrowLeftRight className="w-4.5 h-4.5" />,
      disabled: true,
      comingSoonMessage: 'Transfer coming soon',
    },
    {
      key: 'import-items',
      label: 'Import Items',
      icon: <UploadCloud className="w-4.5 h-4.5" />,
      disabled: true,
      comingSoonMessage: 'Bulk import coming soon',
      separatorBefore: true,
    },
    {
      key: 'export-inventory',
      label: 'Export Inventory',
      icon: <DownloadCloud className="w-4.5 h-4.5" />,
      disabled: true,
      comingSoonMessage: 'Export coming soon',
    },
    {
      key: 'schedule-count',
      label: 'Schedule Count',
      icon: <ClipboardList className="w-4.5 h-4.5" />,
      disabled: true,
      comingSoonMessage: 'Cycle counting coming soon',
    },
    {
      key: 'quick-scan',
      label: 'Quick Scan',
      icon: <Scan className="w-4.5 h-4.5" />,
      disabled: true,
      comingSoonMessage: 'Scanner integration coming soon',
    },
    {
      key: 'refresh',
      label: 'Refresh',
      icon: <RefreshCw className="w-4.5 h-4.5" />,
      onClick: handleRefresh,
      separatorBefore: true,
    },
  ], [handleRefresh]);

  const inventoryColumns: DataTableColumn<InventoryItemsFromOrdersRow>[] = React.useMemo(() => [
    {
      id: 'code',
      header: 'Item Code',
      renderCell: (row) => <span className="font-semibold text-gray-900 dark:text-gray-100">{row.code}</span>,
      minWidth: 120,
    },
    {
      id: 'name',
      header: 'Name',
      renderCell: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.category}</div>
        </div>
      ),
      minWidth: 200,
    },
    {
      id: 'warehouse',
      header: 'Warehouse',
      renderCell: (row) => row.warehouse,
      minWidth: 140,
    },
    {
      id: 'qty',
      header: 'Qty',
      align: 'right',
      renderCell: (row) => formatNumber(row.qty),
      width: 80,
    },
    {
      id: 'reorder',
      header: 'Reorder',
      align: 'right',
      renderCell: (row) => formatNumber(row.reorder),
      width: 100,
    },
    {
      id: 'value',
      header: 'Value (SAR)',
      align: 'right',
      renderCell: (row) => formatCurrency(row.value),
      minWidth: 130,
    },
    {
      id: 'status',
      header: 'Status',
      renderCell: (row) => {
        const tone = STATUS_BADGE_STYLES[row.status] ?? 'bg-gray-100 text-gray-600';
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
            {row.status}
          </span>
        );
      },
      minWidth: 110,
    },
    {
      id: 'actions',
      header: 'Actions',
      renderCell: () => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">View</Button>
          <Button variant="outline" size="sm">Export</Button>
        </div>
      ),
      minWidth: 160,
    },
  ], []);

  const movementColumns: DataTableColumn<RecentMovementRow>[] = React.useMemo(() => [
    { id: 'date', header: 'Date', renderCell: (row) => formatDate(row.date), minWidth: 120 },
    { id: 'item', header: 'Item', renderCell: (row) => row.item, minWidth: 180 },
    { id: 'warehouse', header: 'Warehouse', renderCell: (row) => row.warehouse, minWidth: 140 },
    { id: 'type', header: 'Type', renderCell: (row) => row.type, minWidth: 120 },
    { id: 'qty', header: 'Qty', align: 'right', renderCell: (row) => formatNumber(row.qty), width: 80 },
    { id: 'value', header: 'Value', align: 'right', renderCell: (row) => formatCurrency(row.value), minWidth: 120 },
  ], []);

  const inventoryKpiContent = inventoryKpisQuery.isLoading ? '—' : inventoryKpisQuery.error ? '—' : undefined;
  const criticalKpiContent = criticalKpisQuery.isLoading ? '—' : criticalKpisQuery.error ? '—' : undefined;
  const slowExcessContent = slowExcessQuery.isLoading ? '—' : slowExcessQuery.error ? '—' : undefined;
  const activityKpiContent = activityKpisQuery.isLoading ? '—' : activityKpisQuery.error ? '—' : undefined;
  const utilizationKpiContent = utilizationKpisQuery.isLoading ? '—' : utilizationKpisQuery.error ? '—' : undefined;

  const averageUnitCost = totalItems > 0 ? kpisData?.inventoryValue ? kpisData.inventoryValue / totalItems : 0 : 0;
  const inStockPercent = totalItems > 0 ? ((totalItems - outOfStockCount) / totalItems) * 100 : 0;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Inventory"
        menuItems={quickActions}
        onSearch={handleInventorySearchSubmit}
      />

      <BaseCard title="Inventory Overview" subtitle="Real-time health of stock levels">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Low Stock"
              value={inventoryKpiContent ?? formatNumber(kpisData?.lowStock ?? lowStockCount)}
            />
            <KpiTile
              label="Out of Stock"
              value={inventoryKpiContent ?? formatNumber(kpisData?.outOfStock ?? outOfStockCount)}
            />
            <KpiTile
              label="Inventory Value"
              value={inventoryKpiContent ?? formatCurrency(kpisData?.inventoryValue ?? 0)}
            />
            <KpiTile
              label="Total Items"
              value={inventoryKpiContent ?? formatNumber(totalItems)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Low vs Out of Stock"
              subtitle="Stock health distribution"
              data={stockHealthData}
              loading={stockHealthQuery.isLoading}
              error={stockHealthQuery.error as Error | null}
            />
            <ChartCard title="Items per Warehouse" height={280}>
              <ChartState
                loading={itemsByWarehouseQuery.isLoading}
                error={itemsByWarehouseQuery.error}
                isEmpty={warehouseBarData.length === 0}
              >
                <BarChart
                  data={warehouseBarData}
                  categoryKey="category"
                  series={[{ id: 'items', valueKey: 'value', name: 'Items' }]}
                  height={220}
                />
              </ChartState>
            </ChartCard>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Inventory Items" subtitle="Sortable, filterable, and exportable">
        <DataTable<InventoryItemsFromOrdersRow>
          columns={inventoryColumns}
          rows={inventoryRows}
          loading={inventoryItemsQuery.isLoading}
          errorState={inventoryItemsQuery.error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(inventoryItemsQuery.error)}</div>
          ) : undefined}
          emptyState={<div className="text-sm text-gray-500">No inventory items found</div>}
          pagination={{
            page: inventoryPage,
            pageSize: inventoryPageSize,
            total: inventoryTotal,
            onPageChange: setInventoryPage,
            onPageSizeChange: (size) => {
              setInventoryPageSize(size);
              setInventoryPage(0);
            },
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
          toolbar={(
            <TableToolbar
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchSubmit={handleInventorySearchSubmit}
              searchPlaceholder="Search items…"
              filters={STATUS_FILTERS.map((filter) => ({
                id: filter.id,
                label: filter.label,
                active: inventoryStatusFilter === filter.id,
                onClick: () => handleStatusFilter(filter.id),
              }))}
              onExport={() => undefined}
              exportLabel="Export CSV"
              canExport
            >
              <Button variant="outline" size="sm">Export CSV</Button>
            </TableToolbar>
          )}
        />
      </BaseCard>

      <BaseCard title="Recent Movements" subtitle="Inbound, outbound, and transfer records">
        <DataTable<RecentMovementRow>
          columns={movementColumns}
          rows={movementRows}
          loading={recentMovementsQuery.isLoading}
          errorState={recentMovementsQuery.error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(recentMovementsQuery.error)}</div>
          ) : undefined}
          emptyState={<div className="text-sm text-gray-500">No recent movements</div>}
          pagination={{
            page: movementPage,
            pageSize: movementPageSize,
            total: movementTotal,
            onPageChange: setMovementPage,
            onPageSizeChange: (size) => {
              setMovementPageSize(size);
              setMovementPage(0);
            },
            pageSizeOptions: MOVEMENT_PAGE_SIZES,
          }}
          toolbar={(
            <TableToolbar
              searchValue=""
              searchPlaceholder="Search movements…"
              onSearchChange={() => undefined}
              onSearchSubmit={() => undefined}
              filters={MOVEMENT_STATUS_FILTERS.map((filter) => ({
                id: filter.id,
                label: filter.label,
                active: movementType === filter.id,
                onClick: () => handleMovementFilter(filter.id),
              }))}
            />
          )}
        />
      </BaseCard>

      <BaseCard title="Inventory Details" subtitle="Explore all SKUs, values, and status">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile label="Total SKUs" value={inventoryKpiContent ?? formatNumber(totalItems)} />
            <KpiTile label="Inventory Value" value={inventoryKpiContent ?? formatCurrency(kpisData?.inventoryValue ?? 0)} />
            <KpiTile label="Average Unit Cost" value={inventoryKpiContent ?? formatCurrency(averageUnitCost)} />
            <KpiTile label="In-Stock %" value={inventoryKpiContent ?? formatPercent(inStockPercent)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Status Distribution"
              subtitle="In / Low / Out"
              data={statusDistribution}
              loading={stockHealthQuery.isLoading || inventoryKpisQuery.isLoading}
              error={(stockHealthQuery.error ?? inventoryKpisQuery.error) as Error | null}
            />
            <ChartCard title="Value by Category" height={280}>
              <ChartState
                loading={categoryBarQuery.isLoading}
                error={categoryBarQuery.error}
                isEmpty={valueByCategoryData.length === 0}
              >
                <BarChart
                  data={valueByCategoryData}
                  categoryKey="category"
                  series={[{ id: 'value', valueKey: 'value', name: 'Value (SAR)' }]}
                  height={220}
                />
              </ChartState>
            </ChartCard>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Critical Alerts" subtitle="Priority inventory requiring attention">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Critical Items"
              value={criticalKpiContent ?? formatNumber(criticalKpis?.criticalItems ?? 0)}
            />
            <KpiTile
              label="Critical Out of Stock"
              value={criticalKpiContent ?? formatNumber(criticalKpis?.criticalOOS ?? 0)}
            />
            <KpiTile
              label="Critical Low Stock"
              value={criticalKpiContent ?? formatNumber(criticalKpis?.criticalLow ?? 0)}
            />
            <KpiTile
              label="Linked Requests"
              value={criticalKpiContent ?? formatNumber(criticalKpis?.linkedRequests ?? 0)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Critical Items by Category"
              data={criticalCategoryPie}
              loading={criticalCategoryQuery.isLoading}
              error={criticalCategoryQuery.error as Error | null}
            />
            <ChartCard title="Critical Items by Warehouse" height={280}>
              <ChartState
                loading={criticalWarehouseQuery.isLoading}
                error={criticalWarehouseQuery.error}
                isEmpty={criticalWarehouseData.length === 0}
              >
                <BarChart
                  data={criticalWarehouseData}
                  categoryKey="category"
                  series={[{ id: 'critical', valueKey: 'value', name: 'Critical SKUs' }]}
                  height={220}
                />
              </ChartState>
            </ChartCard>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Top Critical Items" subtitle="Immediate replenishment required">
        <ChartState
          loading={topCriticalLoading}
          error={topCriticalError}
          isEmpty={topCriticalRows.length === 0}
          emptyMessage="No critical items found"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Warehouse</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Reorder</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Age (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {topCriticalRows.map((row) => (
                  <tr key={row.code} className="bg-white dark:bg-gray-950">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{row.code}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.warehouse}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatNumber(row.qty)}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatNumber(row.reorder)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{row.ageDays ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartState>
      </BaseCard>

      <BaseCard title="Slow-Moving & Excess Stock" subtitle="Identify optimisation opportunities">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Slow-Moving Items"
              value={slowExcessContent ?? formatNumber(slowExcessKpis?.slowCount ?? 0)}
            />
            <KpiTile
              label="Slow-Moving Value"
              value={slowExcessContent ?? formatCurrency(slowExcessKpis?.slowValue ?? 0)}
            />
            <KpiTile
              label="Excess Stock"
              value={slowExcessContent ?? formatNumber(slowExcessKpis?.excessCount ?? 0)}
            />
            <KpiTile
              label="Excess Stock Value"
              value={slowExcessContent ?? formatCurrency(slowExcessKpis?.excessValue ?? 0)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Excess by Category"
              data={excessCategoryPie}
              loading={excessCategoryQuery.isLoading}
              error={excessCategoryQuery.error as Error | null}
            />
            <ChartCard title="Top Slow-Moving Items" height={280}>
              <ChartState
                loading={topSlowMovingQuery.isLoading}
                error={topSlowMovingQuery.error}
                isEmpty={topSlowMovingData.length === 0}
              >
                <BarChart
                  data={topSlowMovingData}
                  categoryKey="category"
                  series={[{ id: 'value', valueKey: 'value', name: 'Value at risk (SAR)' }]}
                  height={220}
                />
              </ChartState>
            </ChartCard>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Recent Activity" subtitle="Inventory movements and transactions">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Inbound Today"
              value={activityKpiContent ?? formatNumber(activityKpis?.inboundToday ?? 0)}
            />
            <KpiTile
              label="Outbound Today"
              value={activityKpiContent ?? formatNumber(activityKpis?.outboundToday ?? 0)}
            />
            <KpiTile
              label="Transfers Today"
              value={activityKpiContent ?? formatNumber(activityKpis?.transfersToday ?? 0)}
            />
            <KpiTile
              label="Movement Value"
              value={activityKpiContent ?? formatCurrency(activityKpis?.movementValue ?? 0)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Movements by Type"
              data={activityByType}
              loading={activityByTypeQuery.isLoading}
              error={activityByTypeQuery.error as Error | null}
            />
            <ChartCard title="Daily Movements (Last 7 Days)" height={280}>
              <ChartState
                loading={dailyMovementsQuery.isLoading}
                error={dailyMovementsQuery.error}
                isEmpty={dailyMovementsData.length === 0}
              >
                <BarChart
                  data={dailyMovementsData}
                  categoryKey="category"
                  series={[{ id: 'movements', valueKey: 'value', name: 'Movements' }]}
                  height={220}
                />
              </ChartState>
            </ChartCard>
          </div>

        </div>
      </BaseCard>

      <BaseCard title="Warehouse Utilization" subtitle="Capacity and usage by warehouse">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Total Capacity"
              value={utilizationKpiContent ?? formatNumber(utilizationKpis?.totalCapacity ?? 0)}
            />
            <KpiTile
              label="Used Capacity"
              value={utilizationKpiContent ?? formatNumber(utilizationKpis?.usedCapacity ?? 0)}
            />
            <KpiTile
              label="Free Capacity"
              value={utilizationKpiContent ?? formatNumber(utilizationKpis?.freeCapacity ?? 0)}
            />
            <KpiTile
              label="Utilization %"
              value={utilizationKpiContent ?? formatPercent(utilizationKpis?.utilizationPct ?? 0)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Utilization Share"
              data={utilizationShare}
              loading={utilizationShareQuery.isLoading}
              error={utilizationShareQuery.error as Error | null}
            />
            <ChartCard title="Capacity vs Used" height={280}>
              <ChartState
                loading={capacityVsUsedQuery.isLoading}
                error={capacityVsUsedQuery.error}
                isEmpty={capacityVsUsedData.length === 0}
              >
                <BarChart
                  data={capacityVsUsedData.map((row) => ({ category: row.category, capacity: row.first, used: row.second }))}
                  categoryKey="category"
                  series={[
                    { id: 'capacity', valueKey: 'capacity', name: 'Capacity' },
                    { id: 'used', valueKey: 'used', name: 'Used' },
                  ]}
                  height={220}
                />
              </ChartState>
            </ChartCard>
          </div>
        </div>
      </BaseCard>

      <AddItemModal
        open={createItemOpen}
        onClose={() => setCreateItemOpen(false)}
        onSuccess={handleItemCreated}
      />

      <MovementModal
        action={movementAction}
        onClose={() => setMovementAction(null)}
        onSuccess={handleMovementSuccess}
      />
    </div>
  );
}

type MovementModalProps = {
  action: MovementActionState | null;
  onClose: () => void;
  onSuccess: () => void;
};

function MovementModal({ action, onClose, onSuccess }: MovementModalProps) {
  const open = Boolean(action);
  const [items, setItems] = React.useState<InventoryItemDTO[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [selectedItemId, setSelectedItemId] = React.useState<number | ''>('');
  const [qty, setQty] = React.useState(1);
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLoadingItems(true);
    getInventoryItems({ page: 1, pageSize: 200 })
      .then((response) => {
        const list = response.items ?? [];
        setItems(list);
        setSelectedItemId(list[0]?.id ?? '');
        if (!list.length) {
          setModalError('No inventory items found. Please add an item before recording movements.');
        } else {
          setModalError(null);
        }
      })
      .catch((error) => {
        setModalError(getErrorMessage(error));
      })
      .finally(() => {
        setLoadingItems(false);
      });
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setQty(1);
      setNote('');
      setModalError(null);
    }
  }, [open]);

  if (!open || !action) return null;

  const selectedItem = typeof selectedItemId === 'number'
    ? items.find((item) => item.id === selectedItemId)
    : undefined;

  const description = action.moveType === 'IN'
    ? 'Increase on-hand quantity for the selected item.'
    : 'Record an outbound movement for the selected item.';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action) return;
    if (typeof selectedItemId !== 'number') {
      setModalError('Select an inventory item.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setModalError('Quantity must be greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      await createMovement(selectedItemId, {
        moveType: action.moveType,
        qty,
        note: note.trim() ? note.trim() : undefined,
      });
      toast.success(action.moveType === 'IN' ? 'Stock received' : 'Stock issued');
      onSuccess();
      onClose();
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{action.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition hover:text-gray-700"
            disabled={submitting}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Item
            {loadingItems ? (
              <div className="mt-2 text-sm text-gray-500">Loading items…</div>
            ) : (
              <select
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                value={selectedItemId}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setSelectedItemId(value ? Number(value) : '');
                }}
                disabled={loadingItems || submitting || !items.length}
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.materialNo} — {item.name}
                  </option>
                ))}
              </select>
            )}
          </label>

          {selectedItem ? (
            <div className="text-xs text-gray-500">
              Current on-hand: {formatNumber(selectedItem.qtyOnHand)}
              {selectedItem.lowStock ? ' • Low stock' : ''}
            </div>
          ) : null}

          <label className="block text-sm font-medium text-gray-700">
            Quantity
            <input
              type="number"
              min={1}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={qty}
              onChange={(event) => setQty(Number(event.currentTarget.value) || 0)}
              disabled={submitting}
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Note <span className="text-gray-400">(optional)</span>
            <textarea
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              disabled={submitting}
            />
          </label>

          {modalError ? (
            <div className="text-sm text-red-600">{modalError}</div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || loadingItems || !items.length}>
              {submitting ? 'Saving…' : action.moveType === 'IN' ? 'Receive Stock' : 'Issue Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
type AddItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function AddItemModal({ open, onClose, onSuccess }: AddItemModalProps) {
  const [form, setForm] = React.useState({
    materialNo: '',
    name: '',
    category: '',
    unit: '',
    reorderPoint: '0',
    warehouseId: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setForm({ materialNo: '', name: '', category: '', unit: '', reorderPoint: '0', warehouseId: '' });
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = <T extends HTMLInputElement | HTMLTextAreaElement>(field: keyof typeof form) => (
    event: React.ChangeEvent<T>,
  ) => {
    const value = event?.currentTarget?.value ?? '';
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      materialNo: form.materialNo.trim(),
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      unit: form.unit.trim() || undefined,
      reorderPoint: Number(form.reorderPoint) || 0,
      warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
    };

    if (!payload.materialNo || !payload.name) {
      setError('Material code and name are required.');
      setSubmitting(false);
      return;
    }

    try {
      await createInventoryItem(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Inventory Item</h2>
            <p className="mt-1 text-sm text-gray-500">Create a new SKU for your catalog.</p>
          </div>
          <button
            type="button"
            className="text-gray-500 transition hover:text-gray-700"
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700">
            Material Code
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={form.materialNo}
              onChange={handleChange('materialNo')}
              required
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Name
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={form.name}
              onChange={handleChange('name')}
              required
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Category
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={form.category}
              onChange={handleChange('category')}
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Unit
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={form.unit}
              onChange={handleChange('unit')}
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Reorder Point
            <input
              type="number"
              min={0}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={form.reorderPoint}
              onChange={handleChange('reorderPoint')}
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Warehouse ID
            <input
              type="number"
              min={0}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={form.warehouseId}
              onChange={handleChange('warehouseId')}
              disabled={submitting}
              placeholder="Optional"
            />
          </label>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
