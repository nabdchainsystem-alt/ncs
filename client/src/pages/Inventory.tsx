import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import '../styles/inventory.css';
import { InventoryProvider, useInventory, type InvItem } from '../context/InventoryContext';
import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import { StatCard, RecentActivityFeed, type RecentActivityEntry } from '../components/shared';
import BarChart from '../components/charts/BarChart';
import PieInsightCard from '../components/charts/PieInsightCard';
import DataTable, { type DataTableColumn } from '../components/table/DataTable';
import TableToolbar, { type ColumnToggle, type ToolbarFilter } from '../components/table/TableToolbar';
import Button from '../components/ui/Button';
import { formatNumber, formatSAR, percent } from '../shared/format';
import {
  AlertTriangle,
  PackageX,
  Coins,
  Cuboid,
  Factory,
  Building2,
  Warehouse,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Truck,
  Boxes,
  Gauge,
  ClipboardList,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ScanBarcode,
  Route,
  Info,
} from 'lucide-react';

const COST_BY_CATEGORY: Record<string, number> = {
  'Spare Parts': 280,
  Equipment: 2200,
  Safety: 45,
  Consumables: 65,
  Chemicals: 140,
  Electronics: 190,
  Packaging: 18,
  'Raw Material': 320,
};

const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50];
const MOVEMENT_TYPES = ['Inbound', 'Outbound', 'Transfer'] as const;
type MovementType = (typeof MOVEMENT_TYPES)[number];

type StockStatus = 'In' | 'Low' | 'Out';

type EnrichedItem = InvItem & {
  unitCost: number;
  value: number;
  status: StockStatus;
  reorderLevel: number;
  ageDays: number;
};

type TableFilter =
  | { type: 'status'; value: StockStatus }
  | { type: 'warehouse'; value: string }
  | { type: 'category'; value: string }
  | { type: 'critical'; value: string }
  | { type: 'slow'; value: string }
  | { type: 'excess'; value: string };

type MovementRow = {
  id: string;
  date: string;
  itemCode: string;
  itemName: string;
  warehouse: string;
  type: MovementType;
  qty: number;
  unitCost: number;
  value: number;
};

const movementTypeIcon: Record<MovementType, React.ReactNode> = {
  Inbound: <Truck className="h-4 w-4 text-emerald-500" />,
  Outbound: <Truck className="h-4 w-4 text-sky-500" />,
  Transfer: <Route className="h-4 w-4 text-violet-500" />,
};

const CHART_CARD_CLASS = 'rounded-2xl border bg-white p-4 shadow-card dark:bg-gray-900 flex flex-col';

function infoButton(text: string) {
  return (
    <Tooltip.Root delayDuration={120}>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Info"
        >
          <Info className="h-4 w-4" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="max-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          {text}
          <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

const formatInt = (value: number) => formatNumber(value, { maximumFractionDigits: 0 });
const formatCurrency = (value: number) => formatSAR(value, { maximumFractionDigits: 0 });

function InventoryContent() {
  const { query, setQuery, items, kpis, exportCsv } = useInventory();

  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<TableFilter | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(TABLE_PAGE_SIZE_OPTIONS[0]);
  const [tableSort, setTableSort] = useState<{ sortBy: string; direction: 'asc' | 'desc' }>({ sortBy: 'code', direction: 'asc' });

  const [movementSearch, setMovementSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<MovementType | 'All'>('All');
  const [movementDateFilter, setMovementDateFilter] = useState<string | null>(null);
  const [movementPage, setMovementPage] = useState(1);

  const tableSectionRef = useRef<HTMLDivElement | null>(null);
  const movementSectionRef = useRef<HTMLDivElement | null>(null);

  // TODO: wire with actual RBAC when available
  const isViewer = false;
  const canExport = !isViewer;

  const handleScrollTo = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const enrichedItems = useMemo<EnrichedItem[]>(() => {
    if (!items.length) return [];
    return items.map((item, index) => {
      const baseCost = COST_BY_CATEGORY[item.category] ?? 180;
      const unitCost = Math.max(12, baseCost);
      const status: StockStatus = item.qty <= 0 ? 'Out' : item.minLevel > 0 && item.qty < item.minLevel ? 'Low' : 'In';
      const value = Math.max(0, unitCost * Math.max(0, item.qty));
      const ageDays = 6 + index * 3;
      return {
        ...item,
        unitCost,
        value,
        status,
        reorderLevel: item.minLevel,
        ageDays,
      };
    });
  }, [items]);

  const inventoryAggregates = useMemo(() => {
    const totalSkus = enrichedItems.length;
    const lowItems = enrichedItems.filter((item) => item.status === 'Low');
    const outItems = enrichedItems.filter((item) => item.status === 'Out');
    const criticalItems = enrichedItems.filter((item) => item.status !== 'In');
    const slowMoving = enrichedItems.filter((item) => item.qty > 0 && item.qty <= Math.max(1, item.minLevel * 1.4));
    const excessItems = enrichedItems.filter((item) => item.qty > Math.max(item.minLevel * 4, item.minLevel + 10));

    const totalValue = enrichedItems.reduce((sum, item) => sum + item.value, 0);
    const totalQty = enrichedItems.reduce((sum, item) => sum + Math.max(0, item.qty), 0);
    const inCount = totalSkus - lowItems.length - outItems.length;

    const warehouseSummary = Array.from(
      enrichedItems.reduce((map, item) => {
        const existing = map.get(item.warehouse) ?? { warehouse: item.warehouse, count: 0, value: 0, critical: 0 };
        existing.count += 1;
        existing.value += item.value;
        if (item.status !== 'In') existing.critical += 1;
        map.set(item.warehouse, existing);
        return map;
      }, new Map<string, { warehouse: string; count: number; value: number; critical: number }>() ).values(),
    );

    const categorySummary = Array.from(
      enrichedItems.reduce((map, item) => {
        const existing = map.get(item.category) ?? { category: item.category, value: 0, count: 0 };
        existing.value += item.value;
        existing.count += 1;
        map.set(item.category, existing);
        return map;
      }, new Map<string, { category: string; value: number; count: number }>() ).values(),
    );

    const criticalByWarehouse = Array.from(
      criticalItems.reduce((map, item) => {
        const existing = map.get(item.warehouse) ?? { warehouse: item.warehouse, count: 0 };
        existing.count += 1;
        map.set(item.warehouse, existing);
        return map;
      }, new Map<string, { warehouse: string; count: number }>() ).values(),
    );

    const criticalByCategory = Array.from(
      criticalItems.reduce((map, item) => {
        const existing = map.get(item.category) ?? { category: item.category, count: 0 };
        existing.count += 1;
        map.set(item.category, existing);
        return map;
      }, new Map<string, { category: string; count: number }>() ).values(),
    );

    const slowTop = [...slowMoving]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item) => ({ name: item.name, code: item.code, value: item.value, qty: item.qty }));

    const excessByCategory = Array.from(
      excessItems.reduce((map, item) => {
        const existing = map.get(item.category) ?? { category: item.category, value: 0 };
        existing.value += item.value;
        map.set(item.category, existing);
        return map;
      }, new Map<string, { category: string; value: number }>() ).values(),
    );

    return {
      totalSkus,
      lowItems,
      outItems,
      criticalItems,
      slowMoving,
      excessItems,
      totalValue,
      totalQty,
      inCount,
      warehouseSummary,
      categorySummary,
      criticalByWarehouse,
      criticalByCategory,
      slowTop,
      excessByCategory,
    };
  }, [enrichedItems]);

  const stockHealthPie = useMemo(
    () => [
      { name: 'Low Stock', value: inventoryAggregates.lowItems.length },
      { name: 'Out of Stock', value: inventoryAggregates.outItems.length },
    ].filter((entry) => entry.value > 0),
    [inventoryAggregates.lowItems.length, inventoryAggregates.outItems.length],
  );

  const warehouseBarData = useMemo(
    () =>
      inventoryAggregates.warehouseSummary.map((entry) => ({
        warehouse: entry.warehouse,
        items: entry.count,
        value: entry.value,
        critical: entry.critical,
      })),
    [inventoryAggregates.warehouseSummary],
  );

  const statusDistribution = useMemo(
    () => [
      { name: 'In Stock', value: Math.max(0, inventoryAggregates.inCount) },
      { name: 'Low Stock', value: inventoryAggregates.lowItems.length },
      { name: 'Out of Stock', value: inventoryAggregates.outItems.length },
    ],
    [inventoryAggregates.inCount, inventoryAggregates.lowItems.length, inventoryAggregates.outItems.length],
  );

  const categoryValueData = useMemo(
    () =>
      inventoryAggregates.categorySummary.map((entry) => ({
        category: entry.category,
        value: entry.value,
      })),
    [inventoryAggregates.categorySummary],
  );

  const criticalWarehouseData = useMemo(
    () =>
      inventoryAggregates.criticalByWarehouse.map((entry) => ({
        warehouse: entry.warehouse,
        count: entry.count,
      })),
    [inventoryAggregates.criticalByWarehouse],
  );

  const criticalCategoryData = useMemo(
    () =>
      inventoryAggregates.criticalByCategory.map((entry) => ({
        name: entry.category,
        value: entry.count,
      })),
    [inventoryAggregates.criticalByCategory],
  );

  const slowMovingChartData = useMemo(
    () =>
      inventoryAggregates.slowTop.map((item) => ({
        item: item.name,
        value: item.value,
      })),
    [inventoryAggregates.slowTop],
  );

  const excessCategoryData = useMemo(
    () =>
      inventoryAggregates.excessByCategory.map((entry) => ({
        name: entry.category,
        value: entry.value,
      })),
    [inventoryAggregates.excessByCategory],
  );

  const unitCostMap = useMemo(() => new Map(enrichedItems.map((item) => [item.code, item.unitCost])), [enrichedItems]);

  const movementRows = useMemo<MovementRow[]>(() => {
    if (!enrichedItems.length) {
      return [
        {
          id: 'mv-empty-1',
          date: new Date().toISOString().slice(0, 10),
          itemCode: '—',
          itemName: 'No data',
          warehouse: 'Riyadh',
          type: 'Inbound',
          qty: 0,
          unitCost: 0,
          value: 0,
        },
      ];
    }

    const base = enrichedItems;
    const now = new Date();

    return Array.from({ length: Math.max(12, base.length * 2) }, (_, index) => {
      const source = base[index % base.length];
      const type = MOVEMENT_TYPES[index % MOVEMENT_TYPES.length];
      const day = new Date(now);
      day.setDate(now.getDate() - (index % 7));
      const dateIso = day.toISOString().slice(0, 10);
      const qty = Math.max(1, Math.round((source.qty || 1) / ((index % 4) + 1)));
      const unitCost = unitCostMap.get(source.code) ?? 120;
      const value = unitCost * qty;

      return {
        id: `mv-${index}`,
        date: dateIso,
        itemCode: source.code,
        itemName: source.name,
        warehouse: source.warehouse,
        type,
        qty,
        unitCost,
        value,
      };
    });
  }, [enrichedItems, unitCostMap]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const movementStats = useMemo(() => {
    const todayMovements = movementRows.filter((row) => row.date === todayIso);
    const inbound = todayMovements.filter((row) => row.type === 'Inbound');
    const outbound = todayMovements.filter((row) => row.type === 'Outbound');
    const transfers = todayMovements.filter((row) => row.type === 'Transfer');

    return {
      inboundCount: inbound.length,
      outboundCount: outbound.length,
      transferCount: transfers.length,
      totalValue: todayMovements.reduce((sum, row) => sum + row.value, 0),
    };
  }, [movementRows, todayIso]);

  const movementBarData = useMemo(() => {
    return Array.from({ length: 7 }, (_, offset) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - offset));
      const iso = day.toISOString().slice(0, 10);
      const label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayRows = movementRows.filter((row) => row.date === iso);
      return {
        label,
        iso,
        transactions: dayRows.length,
        value: dayRows.reduce((sum, row) => sum + row.value, 0),
      };
    });
  }, [movementRows]);

  const movementPieData = useMemo(
    () =>
      MOVEMENT_TYPES.map((type) => ({
        name: type,
        value: movementRows.filter((row) => row.type === type).reduce((sum, row) => sum + row.qty, 0),
      })),
    [movementRows],
  );

  const recentActivityItems = useMemo<RecentActivityEntry[]>(
    () =>
      movementRows.slice(0, 6).map((row) => ({
        id: row.id,
        title: `${row.type} • ${row.itemCode}`,
        meta: `${row.warehouse} • ${formatInt(row.qty)} units • ${row.date}`,
        icon: movementTypeIcon[row.type],
        actionLabel: 'View',
        onAction: () => setMovementFilter(row.type),
      })),
    [movementRows],
  );

  const applyInventoryFilter = useCallback(
    (filter: TableFilter) => {
      setTableFilter(filter);
      setTablePage(1);
      handleScrollTo(tableSectionRef);
    },
    [handleScrollTo],
  );

  const clearInventoryFilter = useCallback(() => {
    setTableFilter(null);
    setTablePage(1);
  }, []);

  const applyMovementFilter = useCallback(
    (type: MovementType | 'All') => {
      setMovementFilter(type);
      setMovementDateFilter(null);
      setMovementPage(1);
      handleScrollTo(movementSectionRef);
    },
    [handleScrollTo],
  );

  const inventoryRows = useMemo(() => enrichedItems, [enrichedItems]);

  const tableFilteredRows = useMemo(() => {
    let rows = inventoryRows;

    if (tableFilter) {
      switch (tableFilter.type) {
        case 'status':
          rows = rows.filter((row) => row.status === tableFilter.value);
          break;
        case 'warehouse':
          rows = rows.filter((row) => row.warehouse === tableFilter.value);
          break;
        case 'category':
          rows = rows.filter((row) => row.category === tableFilter.value);
          break;
        case 'critical':
          rows = rows.filter((row) => row.status !== 'In');
          break;
        case 'slow':
          rows = rows.filter((row) => inventoryAggregates.slowMoving.includes(row));
          break;
        case 'excess':
          rows = rows.filter((row) => inventoryAggregates.excessItems.includes(row));
          break;
        default:
          break;
      }
    }

    if (tableSearch.trim()) {
      const value = tableSearch.trim().toLowerCase();
      rows = rows.filter((row) => [row.code, row.name, row.category, row.warehouse].some((field) => String(field).toLowerCase().includes(value)));
    }

    return rows;
  }, [inventoryRows, tableFilter, tableSearch, inventoryAggregates.excessItems, inventoryAggregates.slowMoving]);

  const tableSortedRows = useMemo(() => {
    const rows = [...tableFilteredRows];
    const { sortBy, direction } = tableSort;

    rows.sort((a, b) => {
      const asc = direction === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * asc;
        case 'category':
          return a.category.localeCompare(b.category) * asc;
        case 'warehouse':
          return a.warehouse.localeCompare(b.warehouse) * asc;
        case 'qty':
          return (a.qty - b.qty) * asc;
        case 'value':
          return (a.value - b.value) * asc;
        case 'unitCost':
          return (a.unitCost - b.unitCost) * asc;
        case 'status':
          return a.status.localeCompare(b.status) * asc;
        default:
          return a.code.localeCompare(b.code) * asc;
      }
    });

    return rows;
  }, [tableFilteredRows, tableSort]);

  const tableTotalPages = Math.max(1, Math.ceil(tableSortedRows.length / tablePageSize));
  const tablePageSafe = Math.min(tablePage, tableTotalPages);

  const paginatedTableRows = useMemo(
    () => tableSortedRows.slice((tablePageSafe - 1) * tablePageSize, tablePageSafe * tablePageSize),
    [tableSortedRows, tablePageSafe, tablePageSize],
  );

  const inventoryColumnsDefinition: Array<{ id: string; label: string; column: DataTableColumn<EnrichedItem> }> = useMemo(
    () => [
      {
        id: 'code',
        label: 'Item Code',
        column: {
          id: 'code',
          header: 'Item Code',
          sortable: true,
          renderCell: (row) => (
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.code}</div>
          ),
        },
      },
      {
        id: 'name',
        label: 'Name',
        column: {
          id: 'name',
          header: 'Name',
          sortable: true,
          renderCell: (row) => (
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</div>
              <div className="text-xs text-gray-500">{row.location || '—'}</div>
            </div>
          ),
          minWidth: 200,
        },
      },
      {
        id: 'category',
        label: 'Category',
        column: {
          id: 'category',
          header: 'Category',
          sortable: true,
          renderCell: (row) => row.category,
        },
      },
      {
        id: 'warehouse',
        label: 'Warehouse',
        column: {
          id: 'warehouse',
          header: 'Warehouse',
          sortable: true,
          renderCell: (row) => row.warehouse,
        },
      },
      {
        id: 'qty',
        label: 'Qty',
        column: {
          id: 'qty',
          header: 'Qty',
          sortable: true,
          align: 'right',
          renderCell: (row) => formatInt(row.qty),
        },
      },
      {
        id: 'reorder',
        label: 'Reorder',
        column: {
          id: 'reorder',
          header: 'Reorder',
          align: 'right',
          sortable: true,
          renderCell: (row) => formatInt(row.reorderLevel),
        },
      },
      {
        id: 'unitCost',
        label: 'Unit Cost',
        column: {
          id: 'unitCost',
          header: 'Unit Cost',
          align: 'right',
          sortable: true,
          renderCell: (row) => formatCurrency(row.unitCost),
        },
      },
      {
        id: 'value',
        label: 'Value',
        column: {
          id: 'value',
          header: 'Value',
          align: 'right',
          sortable: true,
          renderCell: (row) => formatCurrency(row.value),
        },
      },
      {
        id: 'status',
        label: 'Status',
        column: {
          id: 'status',
          header: 'Status',
          sortable: true,
          renderCell: (row) => {
            const tone = row.status === 'Out' ? 'bg-red-100 text-red-700' : row.status === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
            return (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                {row.status === 'Out' ? 'Out of Stock' : row.status === 'Low' ? 'Low Stock' : 'In Stock'}
              </span>
            );
          },
        },
      },
      {
        id: 'actions',
        label: 'Actions',
        column: {
          id: 'actions',
          header: 'Actions',
          renderCell: (row) => (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="xs" onClick={() => console.log('View item', row.code)}>
                View
              </Button>
              <Button variant="outline" size="xs" onClick={() => console.log('Move item', row.code)} disabled={isViewer}>
                Move
              </Button>
            </div>
          ),
          minWidth: 160,
        },
      },
    ],
    [isViewer],
  );

  const [columnVisibility, setColumnVisibility] = useState<ColumnToggle[]>(() =>
    inventoryColumnsDefinition.map((column) => ({ id: column.id, label: column.label, visible: column.id !== 'actions' ? true : true })),
  );

  const visibleInventoryColumns = useMemo(() => {
    const lookup = new Map(columnVisibility.map((col) => [col.id, col.visible] as const));
    return inventoryColumnsDefinition
      .filter((column) => lookup.get(column.id) !== false)
      .map((column) => column.column);
  }, [columnVisibility, inventoryColumnsDefinition]);

  const handleColumnToggle = useCallback((id: string) => {
    setColumnVisibility((prev) => {
      const visibleCount = prev.filter((column) => column.visible).length;
      return prev.map((column) => {
        if (column.id !== id) return column;
        const nextVisible = !column.visible;
        if (!nextVisible && visibleCount <= 1) {
          return column;
        }
        return { ...column, visible: nextVisible };
      });
    });
  }, []);

  const handleInventorySort = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    setTableSort({ sortBy: columnId, direction });
  }, []);

  const movementFilteredRows = useMemo(() => {
    let rows = movementRows;

    if (movementFilter !== 'All') {
      rows = rows.filter((row) => row.type === movementFilter);
    }

    if (movementDateFilter) {
      rows = rows.filter((row) => row.date === movementDateFilter);
    }

    if (movementSearch.trim()) {
      const value = movementSearch.trim().toLowerCase();
      rows = rows.filter((row) =>
        [row.itemCode, row.itemName, row.warehouse, row.type].some((field) => String(field).toLowerCase().includes(value)),
      );
    }

    return rows;
  }, [movementRows, movementFilter, movementDateFilter, movementSearch]);

  const movementSortedRows = useMemo(() => {
    const rows = [...movementFilteredRows];
    rows.sort((a, b) => b.date.localeCompare(a.date) || b.value - a.value);
    return rows;
  }, [movementFilteredRows]);

  const movementPageSize = 8;
  const movementTotalPages = Math.max(1, Math.ceil(movementSortedRows.length / movementPageSize));
  const movementPageSafe = Math.min(movementPage, movementTotalPages);
  const paginatedMovementRows = useMemo(
    () => movementSortedRows.slice((movementPageSafe - 1) * movementPageSize, movementPageSafe * movementPageSize),
    [movementSortedRows, movementPageSafe, movementPageSize],
  );

  const movementColumns: DataTableColumn<MovementRow>[] = useMemo(
    () => [
      {
        id: 'date',
        header: 'Date',
        renderCell: (row) => row.date,
      },
      {
        id: 'item',
        header: 'Item',
        renderCell: (row) => (
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{row.itemCode}</div>
            <div className="text-xs text-gray-500">{row.itemName}</div>
          </div>
        ),
        minWidth: 180,
      },
      {
        id: 'warehouse',
        header: 'Warehouse',
        renderCell: (row) => row.warehouse,
      },
      {
        id: 'type',
        header: 'Type',
        renderCell: (row) => (
          <div className="inline-flex items-center gap-2">
            <span>{movementTypeIcon[row.type]}</span>
            <span className="text-sm font-medium">{row.type}</span>
          </div>
        ),
      },
      {
        id: 'qty',
        header: 'Qty',
        align: 'right',
        renderCell: (row) => formatInt(row.qty),
      },
      {
        id: 'value',
        header: 'Value',
        align: 'right',
        renderCell: (row) => formatCurrency(row.value),
      },
      {
        id: 'actions',
        header: 'Actions',
        renderCell: () => (
          <div className="flex gap-2">
            <Button variant="outline" size="xs">
              View
            </Button>
            <Button variant="outline" size="xs" disabled={isViewer}>
              Export
            </Button>
          </div>
        ),
      },
    ],
    [isViewer],
  );

  const statusToolbarFilters: ToolbarFilter[] = useMemo(
    () => [
      { id: 'all', label: 'All', active: tableFilter === null, onClick: () => clearInventoryFilter() },
      { id: 'In', label: 'In Stock', active: tableFilter?.type === 'status' && tableFilter.value === 'In', onClick: () => applyInventoryFilter({ type: 'status', value: 'In' }) },
      { id: 'Low', label: 'Low Stock', active: tableFilter?.type === 'status' && tableFilter.value === 'Low', onClick: () => applyInventoryFilter({ type: 'status', value: 'Low' }) },
      { id: 'Out', label: 'Out of Stock', active: tableFilter?.type === 'status' && tableFilter.value === 'Out', onClick: () => applyInventoryFilter({ type: 'status', value: 'Out' }) },
    ],
    [applyInventoryFilter, clearInventoryFilter, tableFilter],
  );

  const movementToolbarFilters: ToolbarFilter[] = useMemo(
    () => [
      { id: 'All', label: 'All', active: movementFilter === 'All', onClick: () => applyMovementFilter('All') },
      ...MOVEMENT_TYPES.map((type) => ({
        id: type,
        label: type,
        active: movementFilter === type,
        onClick: () => applyMovementFilter(type),
      })),
    ],
    [applyMovementFilter, movementFilter],
  );

  const movementDateLabel = useMemo(() => {
    if (!movementDateFilter) return null;
    const date = new Date(movementDateFilter);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, [movementDateFilter]);

  const menuItems = useMemo<PageHeaderItem[]>(() => {
    const actions: PageHeaderItem[] = [
      { key: 'receive', label: 'Receive Stock', icon: <Truck className="h-4.5 w-4.5" />, onClick: () => console.log('Receive stock'), disabled: isViewer },
      { key: 'issue', label: 'Issue Stock', icon: <AlertTriangle className="h-4.5 w-4.5" />, onClick: () => console.log('Issue stock'), disabled: isViewer },
      { key: 'transfer', label: 'Transfer', icon: <Route className="h-4.5 w-4.5" />, onClick: () => console.log('Transfer stock'), disabled: isViewer },
      { key: 'import', label: 'Import Items', icon: <UploadCloud className="h-4.5 w-4.5" />, onClick: () => console.log('Import inventory'), disabled: isViewer },
      { key: 'export', label: 'Export Inventory', icon: <DownloadCloud className="h-4.5 w-4.5" />, onClick: () => exportCsv(), disabled: !canExport },
      { key: 'count', label: 'Schedule Count', icon: <ClipboardList className="h-4.5 w-4.5" />, onClick: () => console.log('Schedule count'), disabled: isViewer },
      { key: 'scan', label: 'Quick Scan', icon: <ScanBarcode className="h-4.5 w-4.5" />, onClick: () => console.log('Launch scanner'), disabled: isViewer },
      { key: 'refresh', label: 'Refresh', icon: <RefreshCw className="h-4.5 w-4.5" />, onClick: () => console.log('Refresh inventory') },
    ];
    return actions;
  }, [canExport, exportCsv, isViewer]);

  const overviewStatCards = [
    {
      label: 'Low Stock',
      value: formatInt(inventoryAggregates.lowItems.length),
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      onClick: () => applyInventoryFilter({ type: 'status', value: 'Low' }),
    },
    {
      label: 'Out of Stock',
      value: formatInt(inventoryAggregates.outItems.length),
      icon: <PackageX className="h-5 w-5 text-red-600" />,
      onClick: () => applyInventoryFilter({ type: 'status', value: 'Out' }),
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(inventoryAggregates.totalValue || kpis.value || 0),
      icon: <Coins className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: 'Total Items',
      value: formatInt(inventoryAggregates.totalSkus || kpis.total || 0),
      icon: <Cuboid className="h-5 w-5 text-indigo-600" />,
    },
  ];

  const tableStats = [
    {
      label: 'Total SKUs',
      value: formatInt(inventoryAggregates.totalSkus),
      icon: <Boxes className="h-5 w-5 text-indigo-600" />,
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(inventoryAggregates.totalValue),
      icon: <Coins className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: 'Average Unit Cost',
      value: formatCurrency(inventoryAggregates.totalQty ? inventoryAggregates.totalValue / inventoryAggregates.totalQty : 0),
      icon: <BarChart3 className="h-5 w-5 text-sky-600" />,
    },
    {
      label: 'In-Stock %',
      value: percent(inventoryAggregates.totalSkus ? inventoryAggregates.inCount / inventoryAggregates.totalSkus : 0, 1),
      icon: <PieChartIcon className="h-5 w-5 text-purple-600" />,
    },
  ];

  const criticalStats = [
    {
      label: 'Critical Items',
      value: formatInt(inventoryAggregates.criticalItems.length),
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      onClick: () => applyInventoryFilter({ type: 'critical', value: 'critical' }),
    },
    {
      label: 'Critical Out of Stock',
      value: formatInt(inventoryAggregates.criticalItems.filter((item) => item.status === 'Out').length),
      icon: <PackageX className="h-5 w-5 text-red-600" />,
      onClick: () => applyInventoryFilter({ type: 'status', value: 'Out' }),
    },
    {
      label: 'Critical Low Stock',
      value: formatInt(inventoryAggregates.criticalItems.filter((item) => item.status === 'Low').length),
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      onClick: () => applyInventoryFilter({ type: 'status', value: 'Low' }),
    },
    {
      label: 'Linked Requests',
      value: formatInt(Math.max(2, Math.round(inventoryAggregates.criticalItems.length * 1.1))),
      icon: <ClipboardList className="h-5 w-5 text-indigo-600" />,
    },
  ];

  const slowStats = [
    {
      label: 'Slow-Moving Items',
      value: formatInt(inventoryAggregates.slowMoving.length),
      icon: <Layers className="h-5 w-5 text-amber-600" />,
      onClick: () => applyInventoryFilter({ type: 'slow', value: 'slow' }),
    },
    {
      label: 'Slow-Moving Value',
      value: formatCurrency(inventoryAggregates.slowMoving.reduce((sum, item) => sum + item.value, 0)),
      icon: <Coins className="h-5 w-5 text-amber-600" />,
    },
    {
      label: 'Excess Stock',
      value: formatInt(inventoryAggregates.excessItems.length),
      icon: <Warehouse className="h-5 w-5 text-emerald-600" />,
      onClick: () => applyInventoryFilter({ type: 'excess', value: 'excess' }),
    },
    {
      label: 'Excess Stock Value',
      value: formatCurrency(inventoryAggregates.excessItems.reduce((sum, item) => sum + item.value, 0)),
      icon: <Coins className="h-5 w-5 text-emerald-600" />,
    },
  ];

  const movementStatsCards = [
    {
      label: 'Inbound Today',
      value: formatInt(movementStats.inboundCount),
      icon: <Truck className="h-5 w-5 text-emerald-600" />,
      onClick: () => applyMovementFilter('Inbound'),
    },
    {
      label: 'Outbound Today',
      value: formatInt(movementStats.outboundCount),
      icon: <Truck className="h-5 w-5 text-sky-600" />,
      onClick: () => applyMovementFilter('Outbound'),
    },
    {
      label: 'Transfers Today',
      value: formatInt(movementStats.transferCount),
      icon: <Route className="h-5 w-5 text-violet-600" />,
      onClick: () => applyMovementFilter('Transfer'),
    },
    {
      label: 'Movement Value',
      value: formatCurrency(movementStats.totalValue),
      icon: <Coins className="h-5 w-5 text-indigo-600" />,
    },
  ];

  const warehouseCapacityData = useMemo(() => {
    const defaults: Record<string, number> = {
      Riyadh: 1800,
      Dammam: 1400,
      Jeddah: 1600,
    };
    return inventoryAggregates.warehouseSummary.map((entry) => {
      const capacity = defaults[entry.warehouse] ?? 1500;
      const used = Math.min(capacity, Math.round(entry.value / 4));
      return {
        warehouse: entry.warehouse,
        capacity,
        used,
      };
    });
  }, [inventoryAggregates.warehouseSummary]);

  const totalCapacity = warehouseCapacityData.reduce((sum, item) => sum + item.capacity, 0);
  const usedCapacity = warehouseCapacityData.reduce((sum, item) => sum + item.used, 0);
  const freeCapacity = Math.max(0, totalCapacity - usedCapacity);
  const utilizationPct = totalCapacity ? usedCapacity / totalCapacity : 0;

  const capacityStats = [
    {
      label: 'Total Capacity',
      value: formatInt(totalCapacity),
      icon: <Building2 className="h-5 w-5 text-indigo-600" />,
    },
    {
      label: 'Used Capacity',
      value: formatInt(usedCapacity),
      icon: <Factory className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: 'Free Capacity',
      value: formatInt(freeCapacity),
      icon: <Warehouse className="h-5 w-5 text-sky-600" />,
    },
    {
      label: 'Utilization %',
      value: percent(utilizationPct, 1),
      icon: <Gauge className="h-5 w-5 text-purple-600" />,
    },
  ];

  const capacityPieData = useMemo(
    () =>
      warehouseCapacityData.map((item) => ({
        name: item.warehouse,
        value: item.used,
      })),
    [warehouseCapacityData],
  );

  const handleInventorySearchSubmit = useCallback((value: string) => {
    setTableSearch(value);
    setTablePage(1);
  }, []);

  const handleMovementSearchSubmit = useCallback((value: string) => {
    setMovementSearch(value);
    setMovementPage(1);
  }, []);

  const exportMovementsCsv = useCallback(() => {
    if (!canExport) return;
    const lines = [
      ['Date', 'Item Code', 'Item Name', 'Warehouse', 'Type', 'Qty', 'Value (SAR)'].join(','),
      ...movementFilteredRows.map((row) => [
        row.date,
        row.itemCode,
        row.itemName,
        row.warehouse,
        row.type,
        formatInt(row.qty),
        formatNumber(row.value, { maximumFractionDigits: 0 }),
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-movements.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [canExport, movementFilteredRows]);

  const handleWarehouseDrill = useCallback((warehouse: string) => {
    applyInventoryFilter({ type: 'warehouse', value: warehouse });
  }, [applyInventoryFilter]);

  const handleCategoryDrill = useCallback((category: string) => {
    applyInventoryFilter({ type: 'category', value: category });
  }, [applyInventoryFilter]);

  return (
    <Tooltip.Provider delayDuration={120}>
      <div className="space-y-6">
      <PageHeader
        title="Inventory"
        menuItems={menuItems}
        onSearch={(value) => setQuery(value)}
        searchPlaceholder="Search inventory: code, name, warehouse, category"
      />

      {/* Block 1: Inventory Overview */}
      <section>
        <BaseCard title="Inventory Overview" subtitle="Real-time health of stock levels">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {overviewStatCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  className="xl:col-span-3 text-left"
                  style={{ cursor: card.onClick ? 'pointer' : 'default' }}
                >
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              <PieInsightCard
                className="xl:col-span-6"
                title="Low vs Out of Stock"
                subtitle="Stock health distribution"
                data={stockHealthPie.length ? stockHealthPie : [{ name: 'No Alerts', value: 1 }]}
                description="Shows the share of items that are low or out of stock. Click a slice to focus the table below."
                height={300}
                onSelect={(datum) => {
                  if (datum.name === 'Low Stock') applyInventoryFilter({ type: 'status', value: 'Low' });
                  if (datum.name === 'Out of Stock') applyInventoryFilter({ type: 'status', value: 'Out' });
                }}
              />
              <div className={`xl:col-span-6 ${CHART_CARD_CLASS}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Items per Warehouse</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Count by location</div>
                  </div>
                  {infoButton('Counts how many SKUs are stocked at each warehouse. Use it to balance distribution and storage load.')}
                </div>
                <div className="h-[300px] flex-1">
                  <BarChart
                    data={warehouseBarData}
                    categoryKey="warehouse"
                    series={[{ id: 'items', valueKey: 'items', name: 'Items' }]}
                    height={300}
                    appearance={{ legend: false }}
                    onSelect={({ category }) => handleWarehouseDrill(category)}
                  />
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      {/* Block 2: Inventory Table */}
      <section className="space-y-6" ref={tableSectionRef}>
        <BaseCard title="Inventory Items" subtitle="Sortable, filterable, and exportable">
          <DataTable
            columns={visibleInventoryColumns}
            rows={paginatedTableRows}
            keyExtractor={(row) => row.code}
            sort={{ sortBy: tableSort.sortBy, direction: tableSort.direction, onSortChange: handleInventorySort }}
            pagination={{
              page: tablePageSafe,
              pageSize: tablePageSize,
              total: tableSortedRows.length,
              onPageChange: (page) => setTablePage(page),
              onPageSizeChange: (size) => {
                setTablePageSize(size);
                setTablePage(1);
              },
              pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
            }}
            emptyState={<div>No inventory records found.</div>}
            toolbar={(
              <TableToolbar
                searchValue={tableSearch}
                onSearchSubmit={handleInventorySearchSubmit}
                onSearchChange={(value) => setTableSearch(value)}
                searchPlaceholder="Search items..."
                filters={statusToolbarFilters}
                onExport={canExport ? () => exportCsv() : undefined}
                canExport={canExport}
                columnToggles={columnVisibility}
                onColumnToggle={handleColumnToggle}
              >
                {tableFilter ? (
                  <Button variant="ghost" size="sm" onClick={clearInventoryFilter}>
                    Clear filter
                  </Button>
                ) : null}
              </TableToolbar>
            )}
            stickyHeader
            onRowClick={(row) => console.log('Open details for', row.code)}
          />
        </BaseCard>

        <BaseCard title="Inventory Details" subtitle="Explore all SKUs, values, and status">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {tableStats.map((card) => (
                <div key={card.label} className="xl:col-span-3">
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              <PieInsightCard
                className="xl:col-span-6"
                title="Status Distribution"
                subtitle="In / Low / Out"
                data={statusDistribution}
                description="Share of SKUs that are fully stocked, low, or out. Click a slice to filter the table."
                height={300}
                onSelect={(datum) => {
                  if (datum.name === 'In Stock') applyInventoryFilter({ type: 'status', value: 'In' });
                  if (datum.name === 'Low Stock') applyInventoryFilter({ type: 'status', value: 'Low' });
                  if (datum.name === 'Out of Stock') applyInventoryFilter({ type: 'status', value: 'Out' });
                }}
              />
              <div className={`xl:col-span-6 ${CHART_CARD_CLASS}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Category Breakdown</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Inventory value by category</div>
                  </div>
                  {infoButton('Displays the inventory value per category so you can focus on the most material groups.')}
                </div>
                <div className="h-[300px] flex-1">
                  <BarChart
                    data={categoryValueData}
                    categoryKey="category"
                    series={[{ id: 'value', valueKey: 'value', name: 'Value (SAR)' }]}
                    height={300}
                    appearance={{ legend: false }}
                    onSelect={({ category }) => handleCategoryDrill(category)}
                  />
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      {/* Block 3: Critical Alerts */}
      <section>
        <BaseCard title="Critical Alerts" subtitle="Priority inventory requiring attention">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {criticalStats.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  className="xl:col-span-3 text-left"
                  style={{ cursor: card.onClick ? 'pointer' : 'default' }}
                >
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              <PieInsightCard
                className="xl:col-span-6"
                title="Critical Items by Category"
                data={criticalCategoryData.length ? criticalCategoryData : [{ name: 'No critical items', value: 1 }]}
                description="Highlights categories carrying the highest concentration of critical items. Click to drill in."
                height={300}
                onSelect={(datum) => handleCategoryDrill(datum.name)}
              />
              <div className={`xl:col-span-6 ${CHART_CARD_CLASS}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Critical Items by Warehouse</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Count of critical SKUs</div>
                  </div>
                  {infoButton('Shows which warehouses hold the most critical items so you can direct remediation efforts.')}
                </div>
                <div className="h-[300px] flex-1">
                  <BarChart
                    data={criticalWarehouseData}
                    categoryKey="warehouse"
                    series={[{ id: 'critical', valueKey: 'count', name: 'Critical Items' }]}
                    height={300}
                    appearance={{ legend: false }}
                    onSelect={({ category }) => applyInventoryFilter({ type: 'warehouse', value: category })}
                  />
                </div>
              </div>
            </div>

            <BaseCard title="Top Critical Items" subtitle="Immediate replenishment required">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2">Warehouse</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Reorder</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Age (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryAggregates.criticalItems
                      .sort((a, b) => a.qty - b.qty)
                      .slice(0, 8)
                      .map((item) => (
                        <tr key={item.code} className="border-t border-gray-200">
                          <td className="px-4 py-2">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{item.code}</div>
                            <div className="text-xs text-gray-500">{item.name}</div>
                          </td>
                          <td className="px-4 py-2">{item.warehouse}</td>
                          <td className="px-4 py-2 text-right">{formatInt(item.qty)}</td>
                          <td className="px-4 py-2 text-right">{formatInt(item.reorderLevel)}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Out' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.status === 'Out' ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">{formatInt(item.ageDays)}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BaseCard>
          </div>
        </BaseCard>
      </section>

      {/* Block 4: Slow-Moving & Excess Stock */}
      <section>
        <BaseCard title="Slow-Moving & Excess Stock" subtitle="Identify optimization opportunities">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {slowStats.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  className="xl:col-span-3 text-left"
                  style={{ cursor: card.onClick ? 'pointer' : 'default' }}
                >
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              <PieInsightCard
                className="xl:col-span-6"
                title="Excess Stock by Category"
                data={excessCategoryData.length ? excessCategoryData : [{ name: 'No excess', value: 1 }]}
                description="Shows which categories contribute most to excess stock so you can rebalance inventory."
                height={300}
                onSelect={(datum) => handleCategoryDrill(datum.name)}
              />
              <div className={`xl:col-span-6 ${CHART_CARD_CLASS}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Slow-Moving Items</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Value at risk</div>
                  </div>
                  {infoButton('Ranks slow-moving items by value so you can intervene before write-offs occur.')}
                </div>
                <div className="h-[300px] flex-1">
                  <BarChart
                    data={slowMovingChartData}
                    categoryKey="item"
                    series={[{ id: 'value', valueKey: 'value', name: 'Value (SAR)' }]}
                    height={300}
                    appearance={{ legend: false }}
                    onSelect={({ category }) => console.log('Drill into slow-moving item', category)}
                  />
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      {/* Block 5: Recent Activity */}
      <section ref={movementSectionRef}>
        <BaseCard title="Recent Activity" subtitle="Inventory movements and transactions">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {movementStatsCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  className="xl:col-span-3 text-left"
                  style={{ cursor: card.onClick ? 'pointer' : 'default' }}
                >
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              <PieInsightCard
                className="xl:col-span-6"
                title="Movements by Type"
                data={movementPieData}
                description="Split of inbound, outbound, and transfer movements. Click to filter the movement log."
                height={300}
                onSelect={(datum) => applyMovementFilter(datum.name as MovementType)}
              />
              <div className={`xl:col-span-6 ${CHART_CARD_CLASS}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Daily Movements</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</div>
                  </div>
                  {infoButton('Shows the daily value of inventory movements over the last week to spotlight unusual spikes.')}
                </div>
                <div className="h-[300px] flex-1">
                  <BarChart
                    data={movementBarData}
                    categoryKey="label"
                    series={[{ id: 'value', valueKey: 'value', name: 'Value (SAR)' }]}
                    height={300}
                    appearance={{ legend: false }}
                    onSelect={({ row }) => {
                      setMovementDateFilter(row.iso);
                      setMovementPage(1);
                      handleScrollTo(movementSectionRef);
                    }}
                  />
                </div>
              </div>
            </div>

            <BaseCard title="Recent Movements" subtitle="Inbound, outbound, and transfer records">
              <TableToolbar
                searchValue={movementSearch}
                onSearchSubmit={handleMovementSearchSubmit}
                onSearchChange={(value) => setMovementSearch(value)}
                searchPlaceholder="Search movements..."
                filters={movementToolbarFilters}
                canExport={canExport}
                onExport={canExport ? exportMovementsCsv : undefined}
              >
                {movementDateFilter ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold dark:bg-gray-800">{movementDateLabel}</span>
                    <Button variant="ghost" size="xs" onClick={() => setMovementDateFilter(null)}>
                      Clear date
                    </Button>
                  </div>
                ) : null}
              </TableToolbar>

              <DataTable
                columns={movementColumns}
                rows={paginatedMovementRows}
                keyExtractor={(row) => row.id}
                emptyState={<div>No movements recorded.</div>}
                pagination={{
                  page: movementPageSafe,
                  pageSize: movementPageSize,
                  total: movementSortedRows.length,
                  onPageChange: (page) => setMovementPage(page),
                  onPageSizeChange: undefined,
                pageSizeOptions: [movementPageSize],
                }}
              />
            </BaseCard>
          </div>
        </BaseCard>
      </section>

      {/* Block 6: Warehouse Utilization */}
      <section>
        <BaseCard title="Warehouse Utilization" subtitle="Capacity and usage by warehouse">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {capacityStats.map((card) => (
                <div key={card.label} className="xl:col-span-3">
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              <PieInsightCard
                className="xl:col-span-6"
                title="Utilization Share"
                data={capacityPieData}
                description="Share of total capacity consumed by each warehouse. Click to focus the data tables."
                height={300}
                onSelect={(datum) => handleWarehouseDrill(datum.name)}
              />
              <div className={`xl:col-span-6 ${CHART_CARD_CLASS}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Capacity vs Used</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Capacity compared to utilized stock</div>
                  </div>
                  {infoButton('Compares declared capacity against utilized stock for each warehouse so you can spot saturation risks early.')}
                </div>
                <div className="h-[300px] flex-1">
                  <BarChart
                    data={warehouseCapacityData}
                    categoryKey="warehouse"
                    series={[
                      { id: 'capacity', valueKey: 'capacity', name: 'Capacity' },
                      { id: 'used', valueKey: 'used', name: 'Used' },
                    ]}
                    height={300}
                    appearance={{ legend: false }}
                    onSelect={({ category }) => applyInventoryFilter({ type: 'warehouse', value: category })}
                  />
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      <section>
        <BaseCard title="Activity Timeline" subtitle="Latest updates">
      <RecentActivityFeed items={recentActivityItems} />
        </BaseCard>
      </section>
      </div>
    </Tooltip.Provider>
  );
}

export default function Inventory() {
  return (
    <InventoryProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <InventoryContent />
      </div>
    </InventoryProvider>
  );
}
