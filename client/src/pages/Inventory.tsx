import React, { Suspense } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import RequestsTasksCard from '../components/requests/TasksCard';
import ChartCard from '../components/charts/ChartCard';
import PieInsightCard from '../components/charts/PieInsightCard';
import BarChart from '../components/charts/BarChart';
import DataTable, { type DataTableColumn } from '../components/table/DataTable';
import TableToolbar from '../components/table/TableToolbar';
import Button from '../components/ui/Button';
import { StatCard, RecentActivityFeed, type RecentActivityEntry, type StatCardProps } from '../components/shared';
import {
  useCapacityVsUsedBar,
  useRecentMovements,
  useUtilizationKpis,
  useUtilizationSharePie,
  useAllInventoryItems,
  useAllInventoryTableItems,
} from '../features/inventory/hooks';
import type {
  BarChartResponse,
  InventoryItemsFromOrdersRow,
  PieDatum,
  RecentMovementRow,
  RecentMovementsParams,
} from '../features/inventory/types';
import { getRecentMovementsTable } from '../features/inventory/facade';
import { useInventoryItemsTable } from '../features/inventory/items/hooks';
import { INVENTORY_ITEM_UNITS, type InventoryItemStatus, type InventoryItemUnit, type InventoryTableItem } from '../features/inventory/items/adapters';
import {
  bulkUpdateInventoryItems,
  fetchInventoryWarehouses,
  moveInventoryItems,
  deleteInventoryItems,
  type BulkUpdateInventoryItemsPayload,
  type MoveInventoryItemsPayload,
} from '../features/inventory/items/api';
import {
  createMovement,
  listPurchaseOrders,
  listTasks,
  type InventoryWarehouse,
  type PurchaseOrderDTO,
  type CreateInventoryMovementPayload,
} from '../lib/api';
import {
  listStores,
  createStore,
  updateStore,
  deleteStore,
  type StoreDTO,
} from '../lib/api/stores';
import { toast } from 'react-hot-toast';
import axios from 'axios';
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
  PackageMinus,
  PackageX,
  Wallet,
  Boxes,
  Building2,
  MoreHorizontal,
  Search,
  Pencil,
  Trash2,
  Timer,
  PackageSearch,
  Gauge,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  usePurchaseOrdersStore,
  setPurchaseOrderCompletion,
  setPurchaseOrderStatus,
  refreshPurchaseOrders,
  type PurchaseOrderRecord,
} from './orders/purchaseOrdersStore';
import HologramInventoryBlock from '../components/inventory/HologramInventoryBlock';
import AddItemModal from './Inventory/AddItemModal';

const ENABLE_WAREHOUSE_2D_LAYOUT = false;
const LazyWarehouse2DLayoutBlock:
  | React.LazyExoticComponent<React.ComponentType<Record<string, never>>>
  | null = ENABLE_WAREHOUSE_2D_LAYOUT
  ? React.lazy(() => import('../components/inventory/Warehouse2DLayoutBlock'))
  : null;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'SAR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-stock', label: 'In Stock' },
  { id: 'low-stock', label: 'Low Stock' },
  { id: 'out-of-stock', label: 'Out of Stock' },
] as const;

type CategoryFilterOption = {
  label: string;
  value: string;
};

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase();
}

const CATEGORY_FILTER_FALLBACK = [
  { label: 'Raw Material', value: 'Raw Material' },
  { label: 'Spare Parts Machine', value: 'SPM' },
  { label: 'Minerals', value: 'Minerals' },
  { label: 'Chemicals', value: 'Chemicals' },
  { label: 'Liquids', value: 'Liquids' },
] as const satisfies readonly CategoryFilterOption[];

type StatusFilterId = typeof STATUS_FILTERS[number]['id'];
type StatusValue = InventoryItemStatus;
type CategoryFilterId = 'all' | string;

function getFilterChipClass(isActive: boolean): string {
  return `rounded-full px-3 py-1 text-xs font-semibold transition ${
    isActive
      ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
  }`;
}

const MOVEMENT_TYPES = ['All', 'Inbound', 'Outbound', 'Transfer'] as const;
type MovementType = typeof MOVEMENT_TYPES[number];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const MOVEMENT_PAGE_SIZES = [5, 10, 20];

const MOVEMENT_SORT_OPTIONS = [
  { id: 'date-desc', label: 'Newest → Oldest', sortBy: 'date' as const, sortDir: 'desc' as const },
  { id: 'date-asc', label: 'Oldest → Newest', sortBy: 'date' as const, sortDir: 'asc' as const },
  { id: 'value-desc', label: 'Highest Value → Lowest', sortBy: 'value' as const, sortDir: 'desc' as const },
  { id: 'value-asc', label: 'Lowest Value → Highest', sortBy: 'value' as const, sortDir: 'asc' as const },
] as const;

const STATUS_LABELS: Record<StatusValue, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

const STATUS_BADGE_STYLES: Record<StatusValue, string> = {
  'in-stock': 'bg-emerald-50 text-emerald-600',
  'low-stock': 'bg-amber-50 text-amber-600',
  'out-of-stock': 'bg-red-50 text-red-600',
};

const QUANTITY_STATUS_STYLES: Record<StatusValue, string> = {
  'in-stock': 'bg-emerald-50 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.25)] dark:bg-emerald-500/10 dark:text-emerald-300 dark:shadow-[0_0_10px_rgba(16,185,129,0.45)]',
  'low-stock': 'bg-amber-50 text-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.3)] dark:bg-amber-500/10 dark:text-amber-300 dark:shadow-[0_0_10px_rgba(251,191,36,0.45)]',
  'out-of-stock': 'bg-red-50 text-red-600 shadow-[0_0_12px_rgba(248,113,113,0.35)] dark:bg-red-500/10 dark:text-red-300 dark:shadow-[0_0_10px_rgba(248,113,113,0.55)]',
};

const severityOrder: Record<StatusValue, number> = {
  'out-of-stock': 0,
  'low-stock': 1,
  'in-stock': 2,
};

const pictureSize = 40;

const CATEGORY_OPTIONS: string[] = [
  'Raw Material - Preform',
  'Raw Material - Cap',
  'Raw Material - Label',
  'Raw Material - Carton',
];

const COMPLETED_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/);
  if (!parts.length) return 'NA';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || first.toUpperCase() || 'NA';
}

type CompletedOrderOutcome = 'received' | 'transferred';
type CompletedOrderAction = 'receive' | 'transfer' | 'hold' | 'reject';

type CompletedOrderLine = {
  id: string;
  orderId: string;
  orderNo: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  warehouse: string;
  amount: number;
  order: PurchaseOrderRecord;
};

type IndeterminateCheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  indeterminate?: boolean;
};

const IndeterminateCheckbox = React.forwardRef<HTMLInputElement, IndeterminateCheckboxProps>(
  ({ indeterminate = false, ...props }, forwardedRef) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <input
        {...props}
        ref={(node) => {
          internalRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        type="checkbox"
      />
    );
  },
);

IndeterminateCheckbox.displayName = 'IndeterminateCheckbox';

function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(Number.isFinite(value) ? value : 0));
}

function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(Number.isFinite(value) ? value : 0));
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return '—';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return '—';
  const diff = Date.now() - ts;
  if (diff < 0) return 'just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(ts).toLocaleDateString();
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

type DashboardStatCard = {
  key: string;
  label: string;
  value: number;
  format?: StatCardProps['valueFormat'];
  fractionDigits?: number;
  icon: React.ReactNode;
};

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

const MOVEMENT_ANALYTICS_PAGE_SIZE = 200;
const MOVEMENT_ANALYTICS_MAX_PAGES = 5;
const SLOW_MOVEMENT_DAYS_THRESHOLD = 30;
const SLOW_MOVEMENT_BASE_COUNT_THRESHOLD = 2;
const EXCESS_MIN_QTY_FLOOR = 10;
const EXCESS_MIN_VALUE_FLOOR = 2000;
const RETAINED_RATIO_THRESHOLD = 0.5;

type NormalizedMovementType = 'inbound' | 'outbound' | 'transfer' | 'adjust' | 'other';

type MovementAggregate = {
  key: string;
  item: string;
  location: string;
  category: string;
  itemCode?: string;
  lastMovement: Date | null;
  firstMovement: Date | null;
  movementCount: number;
  totalQty: number;
  totalValue: number;
  inboundQty: number;
  outboundQty: number;
  transferQty: number;
  adjustQty: number;
  inboundValue: number;
  outboundValue: number;
  netQty: number;
  netValue: number;
};

type MovementAnalyticsResult = {
  items: RecentMovementRow[];
  total: number;
  truncated: boolean;
};

type SlowExcessInsights = {
  slowCount: number;
  slowValue: number;
  excessCount: number;
  excessValue: number;
  topSlowMoving: SingleSeriesDatum[];
  excessByCategory: PieDatum[];
};

function normalizeMovementType(value?: string | null): NormalizedMovementType {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!normalized) return 'other';
  if (normalized.startsWith('in')) return 'inbound';
  if (normalized.startsWith('out')) return 'outbound';
  if (normalized.startsWith('trans')) return 'transfer';
  if (normalized.startsWith('adj')) return 'adjust';
  return 'other';
}

async function fetchRecentMovementsForAnalytics(
  params: Pick<RecentMovementsParams, 'type' | 'warehouse'>,
): Promise<MovementAnalyticsResult> {
  const baseParams: RecentMovementsParams = {
    page: 1,
    pageSize: MOVEMENT_ANALYTICS_PAGE_SIZE,
    type: params.type,
    warehouse: params.warehouse,
  };

  const first = await getRecentMovementsTable(baseParams);
  const items = [...first.items];
  const total = first.total ?? items.length;

  if (!total || total <= items.length) {
    return { items, total, truncated: false };
  }

  const totalPages = Math.ceil(total / MOVEMENT_ANALYTICS_PAGE_SIZE);
  const pagesToFetch = Math.min(Math.max(totalPages, 1), MOVEMENT_ANALYTICS_MAX_PAGES);

  if (pagesToFetch > 1) {
    for (let page = 2; page <= pagesToFetch; page += 1) {
      const next = await getRecentMovementsTable({ ...baseParams, page });
      items.push(...next.items);
    }
  }

  return {
    items,
    total,
    truncated: totalPages > MOVEMENT_ANALYTICS_MAX_PAGES,
  };
}

function computeMovementAggregates(rows: RecentMovementRow[]): MovementAggregate[] {
  if (!rows.length) return [];

  const map = new Map<string, MovementAggregate>();

  rows.forEach((row) => {
    const itemName = row.item?.trim() || 'Unknown Item';
    const location = row.destination?.trim() || row.warehouse?.trim() || 'Unassigned';
    const category = row.category?.trim() || 'Uncategorized';
    const key = `${itemName}::${location}`.toLowerCase();

    const aggregate = map.get(key) ?? {
      key,
      item: itemName,
      location,
      category,
      itemCode: row.itemCode ?? undefined,
      lastMovement: null,
      firstMovement: null,
      movementCount: 0,
      totalQty: 0,
      totalValue: 0,
      inboundQty: 0,
      outboundQty: 0,
      transferQty: 0,
      adjustQty: 0,
      inboundValue: 0,
      outboundValue: 0,
      netQty: 0,
      netValue: 0,
    } as MovementAggregate;

    const qty = Math.abs(Number(row.qty) || 0);
    const value = Math.abs(Number(row.value) || 0);
    const type = normalizeMovementType(row.type);

    aggregate.movementCount += 1;
    aggregate.totalQty += qty;
    aggregate.totalValue += value;

    switch (type) {
      case 'inbound':
        aggregate.inboundQty += qty;
        aggregate.inboundValue += value;
        break;
      case 'outbound':
        aggregate.outboundQty += qty;
        aggregate.outboundValue += value;
        break;
      case 'transfer':
        aggregate.transferQty += qty;
        break;
      case 'adjust':
        aggregate.adjustQty += qty;
        break;
      default:
        break;
    }

    aggregate.netQty = aggregate.inboundQty - aggregate.outboundQty;
    aggregate.netValue = aggregate.inboundValue - aggregate.outboundValue;

    const parsedDate = row.date ? new Date(row.date) : null;
    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      if (!aggregate.lastMovement || parsedDate > aggregate.lastMovement) {
        aggregate.lastMovement = parsedDate;
      }
      if (!aggregate.firstMovement || parsedDate < aggregate.firstMovement) {
        aggregate.firstMovement = parsedDate;
      }
    }

    map.set(key, aggregate);
  });

  return Array.from(map.values());
}

function computeSlowExcessInsights(aggregates: MovementAggregate[]): SlowExcessInsights {
  if (!aggregates.length) {
    return {
      slowCount: 0,
      slowValue: 0,
      excessCount: 0,
      excessValue: 0,
      topSlowMoving: [],
      excessByCategory: [],
    };
  }

  const inboundAggregates = aggregates.filter((agg) => agg.inboundQty > 0 || agg.inboundValue > 0);
  const inboundQtySum = inboundAggregates.reduce((sum, agg) => sum + agg.inboundQty, 0);
  const inboundValueSum = inboundAggregates.reduce((sum, agg) => sum + agg.inboundValue, 0);
  const inboundCount = inboundAggregates.length || 1;

  const avgInboundQty = inboundQtySum / inboundCount;
  const avgInboundValue = inboundValueSum / inboundCount;

  const qtyThreshold = Math.max(Math.round(avgInboundQty * 0.6) || 0, EXCESS_MIN_QTY_FLOOR);
  const valueThreshold = Math.max(Math.round(avgInboundValue * 0.6) || 0, EXCESS_MIN_VALUE_FLOOR);

  const movementCounts = aggregates.map((agg) => agg.movementCount).sort((a, b) => a - b);
  const medianCount = movementCounts.length ? movementCounts[Math.floor(movementCounts.length / 2)] : 0;
  const derivedCountThreshold = Math.max(
    SLOW_MOVEMENT_BASE_COUNT_THRESHOLD,
    Math.floor(medianCount * 0.6) || 0,
  );

  const now = Date.now();
  const slowItems: MovementAggregate[] = [];
  const excessItems: MovementAggregate[] = [];

  aggregates.forEach((agg) => {
    const lastMovementMs = agg.lastMovement?.getTime();
    const daysInactive = lastMovementMs ? Math.floor((now - lastMovementMs) / 86400000) : Number.POSITIVE_INFINITY;
    const outboundToInboundRatio = agg.inboundQty > 0 ? agg.outboundQty / agg.inboundQty : 0;

    const slow = agg.movementCount <= derivedCountThreshold
      || daysInactive >= SLOW_MOVEMENT_DAYS_THRESHOLD
      || (agg.inboundQty > 0 && agg.outboundQty === 0)
      || outboundToInboundRatio <= 0.3;

    if (slow) {
      slowItems.push(agg);
    }

    const netQty = agg.netQty;
    const netValue = Math.max(agg.netValue, 0);
    const hasInbound = agg.inboundQty > 0 || agg.inboundValue > 0;
    const retainedQtyRatio = agg.inboundQty > 0 ? netQty / agg.inboundQty : 0;
    const retainedValueRatio = agg.inboundValue > 0 ? netValue / agg.inboundValue : 0;

    const excess = hasInbound
      && netQty > 0
      && (
        netQty >= qtyThreshold
        || netValue >= valueThreshold
        || retainedQtyRatio >= RETAINED_RATIO_THRESHOLD
        || retainedValueRatio >= RETAINED_RATIO_THRESHOLD
      );

    if (excess) {
      excessItems.push(agg);
    }
  });

  const slowValue = Math.round(slowItems.reduce((sum, agg) => {
    const candidate = Math.max(agg.netValue, agg.inboundValue * 0.6, agg.totalValue * 0.4, 0);
    return sum + candidate;
  }, 0));

  const excessValue = Math.round(excessItems.reduce((sum, agg) => {
    const candidate = Math.max(agg.netValue, agg.inboundValue - agg.outboundValue * 0.5, 0);
    return sum + candidate;
  }, 0));

  const excessByCategoryMap = new Map<string, number>();
  excessItems.forEach((agg) => {
    const category = agg.category || 'Uncategorized';
    const contribution = Math.max(agg.netValue, agg.inboundValue - agg.outboundValue * 0.5, 0);
    if (contribution <= 0) return;
    excessByCategoryMap.set(category, (excessByCategoryMap.get(category) ?? 0) + contribution);
  });

  const excessByCategory = Array.from(excessByCategoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const topSlowMoving = slowItems
    .map((agg) => {
      const value = Math.max(agg.netValue, agg.inboundValue, agg.totalValue * 0.5, 0);
      return { category: agg.item, value: Math.round(value) };
    })
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    slowCount: slowItems.length,
    slowValue,
    excessCount: excessItems.length,
    excessValue,
    topSlowMoving,
    excessByCategory,
  };
}

const MOVEMENT_STATUS_FILTERS = MOVEMENT_TYPES.map((type) => ({ id: type, label: type }));

type MovementActionState = {
  key: 'receive' | 'issue';
  title: string;
  moveType: 'IN' | 'OUT';
};

export default function Inventory() {
  const queryClient = useQueryClient();
  const utilizationKpisQuery = useUtilizationKpis();
  const utilizationShareQuery = useUtilizationSharePie();
  const capacityVsUsedQuery = useCapacityVsUsedBar();

  const [inventoryStatusFilter, setInventoryStatusFilter] = React.useState<StatusFilterId>('all');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = React.useState<CategoryFilterId>('all');
  const [inventoryPage, setInventoryPage] = React.useState(0);
  const [inventoryPageSize, setInventoryPageSize] = React.useState(10);
  const [inventorySortState, setInventorySortState] = React.useState<{ sortBy: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [movementType, setMovementType] = React.useState<MovementType>('All');
  const [movementPage, setMovementPage] = React.useState(0);
  const [movementPageSize, setMovementPageSize] = React.useState(10);
  const [movementStore, setMovementStore] = React.useState<string>('All');
  const [movementSortBy, setMovementSortBy] = React.useState<'date' | 'value'>('date');
  const [movementSortDir, setMovementSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [movementAction, setMovementAction] = React.useState<MovementActionState | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const shiftPressedRef = React.useRef(false);
  const inventoryRowsRef = React.useRef<InventoryTableItem[]>([]);

  const activityFeedQuery = useRecentMovements({
    page: 1,
    pageSize: 6,
    type: movementType === 'All' ? undefined : movementType,
  });

  React.useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === searchTerm) return;
      setSearchTerm(trimmed);
      setInventoryPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, searchTerm, setInventoryPage]);

const inventoryItemsQuery = useInventoryItemsTable({
  pageIndex: inventoryPage,
  pageSize: inventoryPageSize,
  status: inventoryStatusFilter,
  search: searchTerm,
  category: inventoryCategoryFilter === 'all' ? undefined : inventoryCategoryFilter,
});
const allInventoryItemsQuery = useAllInventoryItems();
const allInventoryItems = allInventoryItemsQuery.data ?? [];

  const allInventoryTableItemsQuery = useAllInventoryTableItems();
  const allInventoryTableItems = allInventoryTableItemsQuery.data ?? [];
  const inventoryItemsByCode = React.useMemo(() => {
    const map = new Map<string, InventoryTableItem>();
    allInventoryTableItems.forEach((item) => {
      if (!item.code) return;
      map.set(item.code.toLowerCase(), item);
    });
    return map;
  }, [allInventoryTableItems]);

  const taskReferences = React.useMemo(
    () =>
      allInventoryTableItems.slice(0, 40).map((item) => ({
        id: String(item.serverId ?? item.id),
        label: item.code || item.name,
        description: item.name || item.warehouse || undefined,
        type: "INVENTORY" as const,
      })),
    [allInventoryTableItems],
  );

  const urgentInventoryTasksQuery = useQuery({
    queryKey: ['tasks', 'inventory', 'urgent-count'],
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      try {
        const response = await listTasks({ label: 'inventory', status: 'all', sort: 'createdAt', order: 'desc' });
        const records = response?.data ?? [];
        return records.filter((task) => (task.priority ?? '').toLowerCase() === 'high' && task.status !== 'COMPLETED').length;
      } catch (error) {
        console.warn('[inventory] failed to load urgent tasks count', error);
        return 0;
      }
    },
  });

  const urgentInventoryTasksCount = urgentInventoryTasksQuery.data ?? 0;
  const urgentInventoryTasksDisplay = urgentInventoryTasksQuery.isLoading ? '—' : urgentInventoryTasksCount;

  const { orders: purchaseOrders, loading: purchaseOrdersLoading } = usePurchaseOrdersStore();
  const hasRequestedPurchaseOrders = React.useRef(false);
  const [lineOutcomes, setLineOutcomes] = React.useState<Record<string, CompletedOrderOutcome>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem('inventory.completedOrderOutcomes');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, CompletedOrderOutcome>;
      }
      return {};
    } catch {
      return {};
    }
  });
  const [lineProgress, setLineProgress] = React.useState<{ id: string; action: CompletedOrderAction } | null>(null);
  const [transferLine, setTransferLine] = React.useState<CompletedOrderLine | null>(null);
  const [completedPage, setCompletedPage] = React.useState(0);
  const [completedPageSize, setCompletedPageSize] = React.useState<number>(COMPLETED_PAGE_SIZE_OPTIONS[0]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('inventory.completedOrderOutcomes', JSON.stringify(lineOutcomes));
    } catch {
      /* ignore persistence errors */
    }
  }, [lineOutcomes]);

  React.useEffect(() => {
    if (hasRequestedPurchaseOrders.current) return;
    if (purchaseOrdersLoading) return;
    if (purchaseOrders.length > 0) return;
    hasRequestedPurchaseOrders.current = true;
    refreshPurchaseOrders().catch(() => {
      hasRequestedPurchaseOrders.current = false;
    });
  }, [purchaseOrdersLoading, purchaseOrders.length]);

  const completedOrderLines = React.useMemo(() => {
    if (!purchaseOrders.length) return [] as CompletedOrderLine[];
    const lines: CompletedOrderLine[] = [];
    purchaseOrders.forEach((order) => {
      if (!order.completion) return;
      const orderNo = order.orderNo || `PO-${order.id}`;
      const warehouseLabel = order.department?.trim() || 'Unassigned';
      order.items.forEach((item) => {
        const itemCode = item.materialCode?.trim() || 'N/A';
        const itemName = item.description?.trim() || 'Unnamed Item';
        lines.push({
          id: `${order.id}:${item.id}`,
          orderId: order.id,
          orderNo,
          itemId: item.id,
          itemCode,
          itemName,
          quantity: item.quantity,
          unit: item.unit?.trim() || 'pcs',
          warehouse: warehouseLabel,
          amount: item.lineTotal,
          order,
        });
      });
    });

    lines.sort((a, b) => {
      const timeA = a.order.poDate ? new Date(a.order.poDate).getTime() : 0;
      const timeB = b.order.poDate ? new Date(b.order.poDate).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.orderNo.localeCompare(a.orderNo);
    });
    return lines;
  }, [purchaseOrders]);

  const actionableCompletedLines = React.useMemo(
    () => completedOrderLines.filter((line) => !lineOutcomes[line.id]),
    [completedOrderLines, lineOutcomes],
  );

  const totalActionableAmount = React.useMemo(
    () => actionableCompletedLines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0),
    [actionableCompletedLines],
  );

  const completedPagination = React.useMemo(() => {
    const total = actionableCompletedLines.length;
    const totalPages = total > 0 ? Math.ceil(total / completedPageSize) : 0;
    const safePage = totalPages === 0 ? 0 : Math.min(completedPage, totalPages - 1);
    const start = total === 0 ? 0 : safePage * completedPageSize;
    const rows = actionableCompletedLines.slice(start, start + completedPageSize);
    return {
      total,
      totalPages,
      safePage,
      start,
      rows,
    } as const;
  }, [actionableCompletedLines, completedPage, completedPageSize]);

  React.useEffect(() => {
    if (completedPagination.safePage !== completedPage) {
      setCompletedPage(completedPagination.safePage);
    }
  }, [completedPage, completedPagination.safePage]);

  const invalidateInventoryQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'inventory',
    });
  }, [queryClient]);

  const markLineOutcome = React.useCallback((lineId: string, outcome: CompletedOrderOutcome) => {
    setLineOutcomes((prev) => {
      if (prev[lineId] === outcome) return prev;
      return { ...prev, [lineId]: outcome };
    });
  }, []);

  const releaseLineOutcomesForOrder = React.useCallback((orderId: string) => {
    setLineOutcomes((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${orderId}:`)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const handleReceiveLine = React.useCallback(async (line: CompletedOrderLine) => {
    if (lineProgress?.id === line.id) return;
    const codeKey = line.itemCode.trim().toLowerCase();
    const inventoryItem = inventoryItemsByCode.get(codeKey);
    if (!inventoryItem || inventoryItem.serverId == null) {
      toast.error('Matching inventory item not found for this order line.');
      return;
    }
    if (line.quantity <= 0) {
      toast.error('Cannot receive a zero quantity line.');
      return;
    }

    setLineProgress({ id: line.id, action: 'receive' });
    try {
      await createMovement(inventoryItem.serverId, {
        moveType: 'IN',
        qty: Math.max(0, line.quantity),
        note: `Received from ${line.orderNo}`,
        destinationWarehouse: inventoryItem.warehouse ?? line.warehouse ?? undefined,
        destinationStoreId: typeof inventoryItem.storeId === 'number' ? inventoryItem.storeId : undefined,
      });
      markLineOutcome(line.id, 'received');
      await invalidateInventoryQueries();
      toast.success(`Added ${line.itemCode} to inventory value.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLineProgress((current) => (current?.id === line.id ? null : current));
    }
  }, [inventoryItemsByCode, invalidateInventoryQueries, lineProgress, markLineOutcome]);

  const handleHoldLine = React.useCallback(async (line: CompletedOrderLine) => {
    if (lineProgress?.id === line.id) return;
    setLineProgress({ id: line.id, action: 'hold' });
    try {
      await setPurchaseOrderStatus(line.orderId, 'OnHold');
      await setPurchaseOrderCompletion(line.orderId, false);
      releaseLineOutcomesForOrder(line.orderId);
      toast.success(`PO ${line.orderNo} moved to on hold.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLineProgress((current) => (current?.id === line.id ? null : current));
    }
  }, [lineProgress, releaseLineOutcomesForOrder]);

  const handleRejectLine = React.useCallback(async (line: CompletedOrderLine) => {
    if (lineProgress?.id === line.id) return;
    setLineProgress({ id: line.id, action: 'reject' });
    try {
      await setPurchaseOrderStatus(line.orderId, 'Rejected');
      await setPurchaseOrderCompletion(line.orderId, false);
      releaseLineOutcomesForOrder(line.orderId);
      toast.success(`PO ${line.orderNo} rejected.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLineProgress((current) => (current?.id === line.id ? null : current));
    }
  }, [lineProgress, releaseLineOutcomesForOrder]);

  const handleTransferClick = React.useCallback((line: CompletedOrderLine) => {
    setTransferLine(line);
  }, []);

  const handleTransferCancel = React.useCallback(() => {
    setTransferLine(null);
  }, []);

  const handleTransferConfirm = React.useCallback(async () => {
    if (!transferLine) return;
    if (lineProgress?.id === transferLine.id) return;

    const codeKey = transferLine.itemCode.trim().toLowerCase();
    const inventoryItem = inventoryItemsByCode.get(codeKey);
    if (!inventoryItem || inventoryItem.serverId == null) {
      toast.error('Matching inventory item not found for this order line.');
      return;
    }
    if (transferLine.quantity <= 0) {
      toast.error('Cannot transfer a zero quantity line.');
      return;
    }

    setLineProgress({ id: transferLine.id, action: 'transfer' });
    try {
      await createMovement(inventoryItem.serverId, {
        moveType: 'IN',
        qty: Math.max(0, transferLine.quantity),
        note: `Transfer initiated from ${transferLine.orderNo}`,
        destinationWarehouse: inventoryItem.warehouse ?? transferLine.warehouse ?? undefined,
        destinationStoreId: typeof inventoryItem.storeId === 'number' ? inventoryItem.storeId : undefined,
      });
      markLineOutcome(transferLine.id, 'transferred');
      setTransferLine(null);
      await invalidateInventoryQueries();
      toast.success(`Transfer scheduled for ${transferLine.itemCode}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLineProgress((current) => (current?.id === transferLine.id ? null : current));
    }
  }, [transferLine, inventoryItemsByCode, invalidateInventoryQueries, lineProgress, markLineOutcome]);

  const normalizedSearchTerm = React.useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);
  const normalizedCategoryFilter = React.useMemo(
    () => (inventoryCategoryFilter === 'all' ? null : normalizeCategory(inventoryCategoryFilter)),
    [inventoryCategoryFilter],
  );

  const filteredInventoryTableItems = React.useMemo(() => {
    if (allInventoryTableItems.length === 0) return [] as InventoryTableItem[];
    return allInventoryTableItems.filter((item) => {
      if (inventoryStatusFilter !== 'all' && item.status !== inventoryStatusFilter) return false;

      if (normalizedCategoryFilter) {
        const itemCategory = normalizeCategory(item.category ?? '');
        if (itemCategory !== normalizedCategoryFilter) return false;
      }

      if (normalizedSearchTerm) {
        const haystack = `${item.code} ${item.name}`.toLowerCase();
        if (!haystack.includes(normalizedSearchTerm)) return false;
      }

      return true;
    });
  }, [
    allInventoryTableItems,
    inventoryStatusFilter,
    normalizedCategoryFilter,
    normalizedSearchTerm,
  ]);

  const inventorySummary = React.useMemo(() => {
    const statusTotals: Record<InventoryItemStatus, number> = {
      'in-stock': 0,
      'low-stock': 0,
      'out-of-stock': 0,
    };

    let totalUnits = 0;
    let totalValue = 0;
    const categoryTotals = new Map<string, number>();

    filteredInventoryTableItems.forEach((item) => {
      statusTotals[item.status] += 1;

      const qty = Number.isFinite(item.qty) ? item.qty : 0;
      const unitCost = typeof item.unitCost === 'number' && Number.isFinite(item.unitCost) ? item.unitCost : 0;
      const itemValue = unitCost * qty;

      totalUnits += qty;
      totalValue += itemValue;

      const categoryKey = item.category?.trim() || 'Uncategorized';
      categoryTotals.set(categoryKey, (categoryTotals.get(categoryKey) ?? 0) + itemValue);
    });

    const categorySeries: SingleSeriesDatum[] = Array.from(categoryTotals.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalSkus: filteredInventoryTableItems.length,
      totalUnits,
      totalValue,
      averageUnitCost: totalUnits > 0 ? totalValue / totalUnits : 0,
      statusTotals,
      categorySeries,
    } as const;
  }, [filteredInventoryTableItems]);

  const inventorySummaryError = React.useMemo(() => {
    const error = allInventoryTableItemsQuery.error;
    if (!error) return null;
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);
    return new Error('Failed to load inventory data');
  }, [allInventoryTableItemsQuery.error]);

  const inventorySummaryLoading = allInventoryTableItemsQuery.isLoading;

  const criticalInventoryItems = React.useMemo(() => {
    if (filteredInventoryTableItems.length === 0) return [] as InventoryTableItem[];
    return filteredInventoryTableItems.filter((item) => {
      if (item.lowQty <= 0) return false;
      return item.status === 'low-stock' || item.status === 'out-of-stock';
    });
  }, [filteredInventoryTableItems]);

  const criticalAnalysis = React.useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    const linkedReferences = new Set<string>();
    const categoryTotals = new Map<string, number>();
    const warehouseTotals = new Map<string, number>();

    criticalInventoryItems.forEach((item) => {
      if (item.status === 'out-of-stock') {
        outOfStock += 1;
      } else if (item.status === 'low-stock') {
        lowStock += 1;
      }

      const categoryKey = item.category?.trim() || 'Uncategorized';
      categoryTotals.set(categoryKey, (categoryTotals.get(categoryKey) ?? 0) + 1);

      const warehouseKey = item.warehouse?.trim() || 'Unassigned';
      warehouseTotals.set(warehouseKey, (warehouseTotals.get(warehouseKey) ?? 0) + 1);

      if (item.storeId != null) {
        linkedReferences.add(`store-id:${item.storeId}`);
      }
      const storeToken = item.store ?? item.storeCode;
      if (storeToken) {
        linkedReferences.add(`store:${storeToken.toLowerCase()}`);
      }
    });

    const categoryPie: PieDatum[] = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const warehouseSeries: SingleSeriesDatum[] = Array.from(warehouseTotals.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    return {
      criticalItems: criticalInventoryItems.length,
      criticalOOS: outOfStock,
      criticalLow: lowStock,
      linkedRequests: linkedReferences.size,
      categoryPie,
      warehouseSeries,
    } as const;
  }, [criticalInventoryItems]);

  const criticalDataLoading = allInventoryTableItemsQuery.isLoading;
  const criticalDataError = inventorySummaryError;

  const criticalKpis = criticalAnalysis;
  const criticalCategoryPie = criticalAnalysis.categoryPie;
  const criticalWarehouseData = criticalAnalysis.warehouseSeries;

  const urgentInventoryCount = criticalKpis.criticalItems;
  const urgentInventoryDisplay = criticalDataLoading ? '—' : urgentInventoryCount;
  const urgentInventoryTone = urgentInventoryCount > 0 ? 'danger' : 'neutral';
  const urgentInventoryTasksTone = urgentInventoryTasksCount > 0 ? 'warning' : 'neutral';

  const inventoryRowsRaw = inventoryItemsQuery.data?.items ?? [];
  const inventoryRows = React.useMemo(() => {
    if (!inventorySortState) return inventoryRowsRaw;
    const sorted = [...inventoryRowsRaw];
    const { sortBy, direction } = inventorySortState;
    const multiplier = direction === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'code':
          return a.code.localeCompare(b.code) * multiplier;
        case 'qty':
          return (a.qty - b.qty) * multiplier;
        case 'warehouse':
          return (a.warehouse ?? '').localeCompare(b.warehouse ?? '') * multiplier;
        default:
          return 0;
      }
    });
    return sorted;
  }, [inventoryRowsRaw, inventorySortState]);
  const existingItemCodes = React.useMemo(() => {
    const set = new Set<string>();
    allInventoryItems.forEach((item) => {
      if (item.code) set.add(item.code.toLowerCase());
    });
    inventoryRowsRaw.forEach((row) => {
      if (row.code) set.add(row.code.toLowerCase());
    });
    return set;
  }, [allInventoryItems, inventoryRowsRaw]);
  const tableLowStockCount = React.useMemo(
    () => inventoryRows.filter((row) => row.status === 'low-stock').length,
    [inventoryRows],
  );
  const tableOutOfStockCount = React.useMemo(
    () => inventoryRows.filter((row) => row.status === 'out-of-stock').length,
    [inventoryRows],
  );
  const tableTotalItems = inventoryRows.length;
  const tableInventoryValue = React.useMemo(
    () => inventoryRows.reduce((sum, row) => sum + Number(row.qty ?? 0), 0),
    [inventoryRows],
  );

  const movementStoreFilter = movementStore === 'All' ? undefined : movementStore;
  const recentMovementsQuery = useRecentMovements({
    page: movementPage + 1,
    pageSize: movementPageSize,
    type: movementType === 'All' ? undefined : movementType,
    store: movementStoreFilter,
    sortBy: movementSortBy,
    sortDir: movementSortDir,
  });

  const movementTypeFilter = movementType === 'All' ? undefined : movementType;
  const slowExcessAnalyticsQuery = useQuery<MovementAnalyticsResult>({
    queryKey: ['inventory', 'activity', 'recent', 'analytics', movementTypeFilter ?? 'all'],
    queryFn: () => fetchRecentMovementsForAnalytics({ type: movementTypeFilter }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const stockHealthChartData = React.useMemo(() => {
    if (inventoryRows.length === 0) return [] as PieDatum[];
    return [
      { name: 'Low Stock', value: tableLowStockCount },
      { name: 'Out of Stock', value: tableOutOfStockCount },
    ];
  }, [inventoryRows, tableLowStockCount, tableOutOfStockCount]);
  const warehouseChartData = React.useMemo(() => {
    if (inventoryRows.length === 0) return [] as PieDatum[];
    const counts = new Map<string, number>();
    inventoryRows.forEach((row) => {
      const name = row.warehouse ?? 'Unassigned';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [inventoryRows]);
  const slowExcessAggregates = React.useMemo(
    () => computeMovementAggregates(slowExcessAnalyticsQuery.data?.items ?? []),
    [slowExcessAnalyticsQuery.data?.items],
  );
  const slowExcessInsights = React.useMemo(
    () => computeSlowExcessInsights(slowExcessAggregates),
    [slowExcessAggregates],
  );
  const excessCategoryPie = slowExcessInsights.excessByCategory;
  const utilizationKpis = utilizationKpisQuery.data;
  const utilizationShare = utilizationShareQuery.data ?? [];
  const capacityVsUsedRaw = capacityVsUsedQuery.data;

  const totalSkus = inventorySummary.totalSkus;
  const lowStockCount = inventorySummary.statusTotals['low-stock'];
  const outOfStockCount = inventorySummary.statusTotals['out-of-stock'];
  const inStockCount = inventorySummary.statusTotals['in-stock'];
  const statusDistribution: PieDatum[] = React.useMemo(() => [
    { name: 'In Stock', value: inStockCount },
    { name: 'Low Stock', value: lowStockCount },
    { name: 'Out of Stock', value: outOfStockCount },
  ], [inStockCount, lowStockCount, outOfStockCount]);

  const valueByCategoryData = inventorySummary.categorySeries;
  const topSlowMovingData = slowExcessInsights.topSlowMoving;
  const capacityVsUsedData = React.useMemo(() => prepareDualSeriesData(capacityVsUsedRaw), [capacityVsUsedRaw]);

  const inventoryTotalValue = inventorySummary.totalValue;
  const averageUnitCost = inventorySummary.averageUnitCost;
  const inStockRatio = totalSkus > 0 ? inStockCount / totalSkus : 0;

  const inventoryDetailsCards: DashboardStatCard[] = [
    {
      key: 'total-skus',
      label: 'Total SKUs',
      value: totalSkus,
      format: 'number',
      icon: <ClipboardList className="h-5 w-5 text-sky-500" />,
    },
    {
      key: 'inventory-value',
      label: 'Inventory Value',
      value: inventoryTotalValue,
      format: 'sar',
      icon: <Wallet className="h-5 w-5 text-emerald-500" />,
    },
    {
      key: 'avg-unit-cost',
      label: 'Average Unit Cost',
      value: averageUnitCost,
      format: 'sar',
      icon: <PackagePlus className="h-5 w-5 text-indigo-500" />,
    },
    {
      key: 'in-stock-ratio',
      label: 'In-Stock %',
      value: inStockRatio,
      format: 'percent',
      fractionDigits: 1,
      icon: <RefreshCw className="h-5 w-5 text-amber-500" />,
    },
  ];

  const criticalCards: DashboardStatCard[] = [
    {
      key: 'critical-items',
      label: 'Critical Items',
      value: criticalKpis.criticalItems,
      format: 'number',
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    },
    {
      key: 'critical-oos',
      label: 'Critical Out of Stock',
      value: criticalKpis.criticalOOS,
      format: 'number',
      icon: <PackageX className="h-5 w-5 text-red-500" />,
    },
    {
      key: 'critical-low',
      label: 'Critical Low Stock',
      value: criticalKpis.criticalLow,
      format: 'number',
      icon: <PackageMinus className="h-5 w-5 text-orange-500" />,
    },
    {
      key: 'linked-requests',
      label: 'Linked Requests',
      value: criticalKpis.linkedRequests,
      format: 'number',
      icon: <ArrowLeftRight className="h-5 w-5 text-sky-500" />,
    },
  ];

  const utilizationCards: DashboardStatCard[] = [
    {
      key: 'total-capacity',
      label: 'Total Capacity',
      value: utilizationKpis?.totalCapacity ?? 0,
      format: 'number',
      icon: <Building2 className="h-5 w-5 text-indigo-500" />,
    },
    {
      key: 'used-capacity',
      label: 'Used Capacity',
      value: utilizationKpis?.usedCapacity ?? 0,
      format: 'number',
      icon: <Boxes className="h-5 w-5 text-emerald-500" />,
    },
    {
      key: 'free-capacity',
      label: 'Free Capacity',
      value: utilizationKpis?.freeCapacity ?? 0,
      format: 'number',
      icon: <PackageMinus className="h-5 w-5 text-amber-500" />,
    },
    {
      key: 'utilization-ratio',
      label: 'Utilization %',
      value: (utilizationKpis?.utilizationPct ?? 0) / 100,
      format: 'percent',
      fractionDigits: 1,
      icon: <Gauge className="h-5 w-5 text-sky-500" />,
    },
  ];

  const categoryFilters = React.useMemo<CategoryFilterOption[]>(() => {
    const options = new Map<string, CategoryFilterOption>();

    CATEGORY_FILTER_FALLBACK.forEach((option) => {
      options.set(normalizeCategory(option.value), { ...option });
    });

    valueByCategoryData.forEach((entry) => {
      const rawCategory = entry.category?.trim();
      if (!rawCategory) return;
      const normalizedRaw = normalizeCategory(rawCategory);

      const fallbackMatch = CATEGORY_FILTER_FALLBACK.find((fallback) =>
        normalizedRaw.includes(normalizeCategory(fallback.label))
        || normalizedRaw.includes(normalizeCategory(fallback.value)),
      );
      if (fallbackMatch) {
        options.set(normalizeCategory(fallbackMatch.value), { ...fallbackMatch });
        return;
      }

      options.set(normalizedRaw, { label: rawCategory, value: rawCategory });
    });

    return Array.from(options.values());
  }, [valueByCategoryData]);

  React.useEffect(() => {
    if (inventoryCategoryFilter === 'all') return;
    const normalizedCurrent = normalizeCategory(inventoryCategoryFilter);
    const hasMatch = categoryFilters.some((category) => normalizeCategory(category.value) === normalizedCurrent);
    if (!hasMatch) {
      setInventoryCategoryFilter('all');
    }
  }, [inventoryCategoryFilter, categoryFilters, setInventoryCategoryFilter]);

  const topCriticalRows = React.useMemo(() => {
    if (criticalInventoryItems.length === 0) return [] as InventoryItemsFromOrdersRow[];

    return criticalInventoryItems
      .map((item) => {
        const reorder = Number.isFinite(item.lowQty) ? item.lowQty : 0;
        const qty = Number.isFinite(item.qty) ? item.qty : 0;
        const unitCost = typeof item.unitCost === 'number' && Number.isFinite(item.unitCost) ? item.unitCost : 0;
        return {
          code: item.code,
          name: item.name,
          category: item.category,
          warehouse: item.warehouse ?? 'Unassigned',
          qty,
          reorder,
          value: unitCost * qty,
          status: item.status,
          ageDays: null,
        } satisfies InventoryItemsFromOrdersRow;
      })
      .sort((a, b) => {
        const severityA = severityOrder[a.status as StatusValue] ?? 2;
        const severityB = severityOrder[b.status as StatusValue] ?? 2;
        if (severityA !== severityB) return severityA - severityB;
        const deficitA = (a.qty ?? 0) - (a.reorder ?? 0);
        const deficitB = (b.qty ?? 0) - (b.reorder ?? 0);
        if (deficitA !== deficitB) return deficitA - deficitB;
        return a.qty - b.qty;
      })
      .slice(0, 5);
  }, [criticalInventoryItems]);

  const topCriticalLoading = criticalDataLoading;
  const topCriticalError = criticalDataError;

  const selectedIdSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const allOnPageSelected = inventoryRows.length > 0 && inventoryRows.every((row) => selectedIdSet.has(row.id));
  const someOnPageSelected = inventoryRows.some((row) => selectedIdSet.has(row.id));
  const selectedCount = selectedIds.length;
  const selectedRows = React.useMemo(
    () => inventoryRows.filter((row) => selectedIdSet.has(row.id)),
    [inventoryRows, selectedIdSet],
  );
  const selectedServerIds = React.useMemo(() => selectedRows
    .map((row) => (row.serverId && Number.isFinite(row.serverId) ? row.serverId : Number(row.id)))
    .filter((value) => Number.isInteger(value) && value > 0), [selectedRows]);
  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>();
    inventoryRows.forEach((row) => {
      if (row.category) set.add(row.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [inventoryRows]);
  const warehouseOptions = React.useMemo(() => {
    const set = new Set<string>();
    inventoryRows.forEach((row) => {
      if (row.warehouse) set.add(row.warehouse);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [inventoryRows]);

  React.useEffect(() => {
    inventoryRowsRef.current = inventoryRows;
  }, [inventoryRows]);

  React.useEffect(() => {
    setSelectedIds([]);
    lastSelectedIndexRef.current = null;
  }, [inventoryStatusFilter, searchTerm]);

  const handleCheckboxPointerDown = React.useCallback((event: React.PointerEvent<HTMLInputElement>) => {
    shiftPressedRef.current = event.shiftKey;
  }, []);

  const updateRowSelection = React.useCallback((rowIndex: number, checked: boolean) => {
    const rows = inventoryRowsRef.current;
    if (!rows[rowIndex]) return;

    const lastIndex = lastSelectedIndexRef.current;
    let start = rowIndex;
    let end = rowIndex;
    if (shiftPressedRef.current && lastIndex !== null && rows[lastIndex]) {
      start = Math.min(lastIndex, rowIndex);
      end = Math.max(lastIndex, rowIndex);
    }

    const rangeIds = rows.slice(start, end + 1).map((row) => row.id);

    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) {
        rangeIds.forEach((id) => set.add(id));
      } else {
        rangeIds.forEach((id) => set.delete(id));
      }
      return Array.from(set);
    });

    lastSelectedIndexRef.current = rowIndex;
    shiftPressedRef.current = false;
  }, []);

  const handleSelectAll = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.currentTarget;
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) {
        inventoryRows.forEach((row) => set.add(row.id));
      } else {
        inventoryRows.forEach((row) => set.delete(row.id));
      }
      return Array.from(set);
    });
    lastSelectedIndexRef.current = null;
    shiftPressedRef.current = false;
  }, [inventoryRows]);

  const inventoryTotal = inventoryItemsQuery.data?.total ?? 0;
  const movementRows = recentMovementsQuery.data?.items ?? [];

  const movementStoreOptions = React.useMemo(() => {
    const options = new Set<string>();
    movementRows.forEach((row) => {
      if (row.store) options.add(row.store);
    });
    return ['All', ...Array.from(options).sort((a, b) => a.localeCompare(b))];
  }, [movementRows]);

  const movementSortSelection = React.useMemo(() => {
    return MOVEMENT_SORT_OPTIONS.find(
      (option) => option.sortBy === movementSortBy && option.sortDir === movementSortDir,
    ) ?? MOVEMENT_SORT_OPTIONS[0];
  }, [movementSortBy, movementSortDir]);

  const handleMovementSortChange = React.useCallback((id: typeof MOVEMENT_SORT_OPTIONS[number]['id']) => {
    const option = MOVEMENT_SORT_OPTIONS.find((entry) => entry.id === id);
    if (!option) return;
    setMovementSortBy(option.sortBy);
    setMovementSortDir(option.sortDir);
  }, []);

  const movementTotal = recentMovementsQuery.data?.total ?? 0;
  const activityFeedRows = activityFeedQuery.data?.items ?? [];
  const activityFeedItems = React.useMemo<RecentActivityEntry[]>(() => {
    return activityFeedRows.map((row, index) => {
      const normalizedType = (row.type ?? '').toLowerCase();
      const iconClass = 'h-4 w-4';
      let icon: React.ReactNode;
      let verb: string;

      switch (normalizedType) {
        case 'inbound':
        case 'receipt':
        case 'receive':
          icon = <PackagePlus className={`${iconClass} text-emerald-500`} />;
          verb = 'Received';
          break;
        case 'outbound':
        case 'issue':
        case 'shipment':
          icon = <PackageMinus className={`${iconClass} text-amber-500`} />;
          verb = 'Issued';
          break;
        case 'transfer':
          icon = <ArrowLeftRight className={`${iconClass} text-sky-500`} />;
          verb = 'Transferred';
          break;
        default: {
          const label = row.type ? `${row.type.charAt(0).toUpperCase()}${row.type.slice(1)}` : 'Movement';
          icon = <RefreshCw className={`${iconClass} text-gray-500`} />;
          verb = label;
        }
      }

      const qtyValue = Number.isFinite(row.qty) ? Number(row.qty) : 0;
      const quantityLabel = `${formatNumber(qtyValue)} unit${Math.abs(qtyValue) === 1 ? '' : 's'}`;
      const itemLabel = row.item || 'Unnamed item';
      const title = `${verb} ${quantityLabel} of ${itemLabel}`;

      const metaParts: string[] = [];
      if (row.source && row.destination) {
        metaParts.push(`${row.source} → ${row.destination}`);
      } else if (row.destination) {
        metaParts.push(row.destination);
      } else if (row.source) {
        metaParts.push(row.source);
      } else if (row.warehouse) {
        metaParts.push(row.warehouse);
      }

      if (row.store) {
        metaParts.push(row.store);
      }

      if (row.orderNo) {
        metaParts.push(`Order ${row.orderNo}`);
      }

      if (Number.isFinite(row.value) && row.value > 0) {
        metaParts.push(formatCurrency(row.value));
      }

      const relative = formatRelativeTime(row.date);
      if (relative !== '—') {
        metaParts.push(relative);
      }

      return {
        id: `${row.date}-${row.item ?? 'item'}-${index}`,
        icon,
        title,
        meta: metaParts.length ? metaParts.join(' • ') : '—',
      } satisfies RecentActivityEntry;
    });
  }, [activityFeedRows]);
  const activityFeedLoading = activityFeedQuery.isLoading && activityFeedRows.length === 0;
  const activityFeedErrorMessage = activityFeedRows.length === 0 && activityFeedQuery.error
    ? getErrorMessage(activityFeedQuery.error)
    : null;

  const handleStatusFilter = (id: string) => {
    setInventoryStatusFilter(id as StatusFilterId);
    setInventoryPage(0);
  };

  const handleCategoryFilter = React.useCallback((value: string) => {
    setInventoryCategoryFilter((current) => (
      current !== 'all' && normalizeCategory(current) === normalizeCategory(value)
        ? 'all'
        : value
    ));
    setInventoryPage(0);
  }, [setInventoryPage]);

  const handleSearchInputChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.currentTarget.value);
  }, []);

  const handleHeaderSearch = React.useCallback((value: string) => {
    const trimmed = value.trim();
    setSearchInput(trimmed);
    setSearchTerm(trimmed);
    setInventoryPage(0);
  }, []);

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
      ['inventory', 'items', 'table'],
      ['inventory', 'items', 'all'],
    ];
    keys.forEach((key) => {
      void queryClient.invalidateQueries({ queryKey: key });
    });
  }, [queryClient]);

  const handleItemCreated = React.useCallback(() => {
    setInventoryPage(0);
    invalidateCoreInventoryQueries();
    toast.success('Inventory item added');
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
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false);
  const [moveModalOpen, setMoveModalOpen] = React.useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [storeManagerOpen, setStoreManagerOpen] = React.useState(false);

  type InventoryQuickAction = 'add' | 'bulk-edit' | 'move' | 'delete' | 'export' | 'import';

  const handleExportSelected = React.useCallback(() => {
    if (!selectedRows.length) {
      toast.error('Select at least one item to export');
      return;
    }

    const header = ['Picture(URL)', 'Category', 'Item Code', 'Item Description', 'Quantity', 'Unit', 'Store', 'Warehouse', 'Status'];
    const escape = (value: string | number | null | undefined) => {
      const str = value === undefined || value === null ? '' : String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = selectedRows.map((row) => [
      row.pictureUrl ?? '',
      row.category,
      row.code,
      row.name,
      row.qty,
      row.unit,
      row.store ?? 'Unassigned',
      row.warehouse ?? 'Unassigned',
      row.status,
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map(escape).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'inventory-selected.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedRows.length} item${selectedRows.length === 1 ? '' : 's'} to CSV`);
  }, [selectedRows]);

  const handleInventoryQuickAction = React.useCallback((action: InventoryQuickAction) => {
    switch (action) {
      case 'add':
        setCreateItemOpen(true);
        break;
      case 'bulk-edit':
        if (!selectedServerIds.length) {
          toast.error('Select at least one item to bulk edit');
          return;
        }
        setBulkEditOpen(true);
        break;
      case 'move':
        if (!selectedServerIds.length) {
          toast.error('Select at least one item to move');
          return;
        }
        setMoveModalOpen(true);
        break;
      case 'delete':
        if (!selectedServerIds.length) {
          toast.error('Select at least one item to delete');
          return;
        }
        setConfirmDeleteOpen(true);
        break;
      case 'export':
        if (selectedCount === 0) {
          toast.error('Select at least one item to export');
          return;
        }
        handleExportSelected();
        break;
      case 'import':
        toast('Import CSV coming soon');
        break;
      default:
        break;
    }
  }, [selectedCount, selectedServerIds, handleExportSelected]);

  const quickActions = React.useMemo<PageHeaderItem[]>(() => [
    {
      key: 'add-item',
      label: 'Add Item',
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
      key: 'define-store',
      label: 'Define a Store',
      icon: <Building2 className="w-4.5 h-4.5" />,
      onClick: () => setStoreManagerOpen(true),
      separatorBefore: true,
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

  const inventoryColumns: DataTableColumn<InventoryTableItem>[] = React.useMemo(() => {
    const selectionColumn: DataTableColumn<InventoryTableItem> = {
      id: 'select',
      header: (
        <div className="flex items-center justify-center">
          <IndeterminateCheckbox
            aria-label="Select all items"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            checked={allOnPageSelected}
            indeterminate={!allOnPageSelected && someOnPageSelected}
            onChange={handleSelectAll}
          />
        </div>
      ),
      renderCell: (row, rowIndex) => {
        const checked = selectedIdSet.has(row.id);
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              aria-label={`Select ${row.name}`}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
              checked={checked}
              onChange={(event) => updateRowSelection(rowIndex, event.currentTarget.checked)}
              onPointerDown={handleCheckboxPointerDown}
            />
          </div>
        );
      },
      width: 56,
      minWidth: 56,
      align: 'center',
      headerClassName: 'sticky left-0 z-30 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800',
      cellClassName: 'sticky left-0 z-20 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800',
      sortable: false,
    };

    const columns: DataTableColumn<InventoryTableItem>[] = [
      {
        id: 'picture',
        header: 'Pic',
        align: 'center',
        renderCell: (row) => (
          <div className="flex items-center justify-center">
            {row.pictureUrl ? (
              <img
                src={row.pictureUrl}
                alt={row.name}
                width={pictureSize}
                height={pictureSize}
                className="h-10 w-10 rounded-full object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold uppercase text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                {getInitials(row.name)}
              </div>
            )}
          </div>
        ),
        width: 84,
        minWidth: 84,
      },
      {
        id: 'category',
        header: 'Category',
        align: 'center',
        renderCell: (row) => (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {row.category}
            </span>
          </div>
        ),
        minWidth: 180,
      },
      {
        id: 'code',
        header: 'Item Code',
        align: 'center',
        renderCell: (row) => (
          <div className="flex justify-center">
            <span className="font-mono text-sm uppercase text-gray-900 dark:text-gray-100">{row.code}</span>
          </div>
        ),
        minWidth: 140,
      },
      {
        id: 'name',
        header: 'Item Description',
        align: 'center',
        renderCell: (row) => (
          <div className="text-center font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
        ),
        minWidth: 220,
      },
      {
        id: 'qty',
        header: 'Quantity',
        align: 'center',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        renderCell: (row) => {
          const tone = QUANTITY_STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-700 shadow-none dark:bg-gray-800 dark:text-gray-200';
          return (
            <div className="inline-flex w-full justify-end">
              <span
                className={`inline-flex min-w-[4ch] items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${tone}`}
              >
                {formatNumber(row.qty)}
              </span>
            </div>
          );
        },
        width: 120,
      },
      {
        id: 'unit',
        header: 'Unit',
        align: 'center',
        renderCell: (row) => (
          <span className="text-xs font-semibold uppercase text-gray-900 dark:text-gray-100">
            {row.unit ? row.unit.toUpperCase() : '—'}
          </span>
        ),
        width: 90,
      },
      {
        id: 'store',
        header: 'Store',
        align: 'center',
        renderCell: (row) => (
          <div className="flex flex-col items-center justify-center">
            <span className="inline-flex min-h-[24px] items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-200">
              {row.store ?? 'Unassigned'}
            </span>
            {row.warehouse ? (
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {row.warehouse}
              </span>
            ) : null}
          </div>
        ),
        minWidth: 180,
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'center',
        renderCell: () => (
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" title="View details">View</Button>
            <Button variant="outline" size="sm" title="Export row">Export</Button>
          </div>
        ),
        minWidth: 150,
      },
    ];

    return [selectionColumn, ...columns];
  }, [allOnPageSelected, someOnPageSelected, handleSelectAll, selectedIdSet, updateRowSelection, handleCheckboxPointerDown]);

  const movementColumns: DataTableColumn<RecentMovementRow>[] = React.useMemo(() => [
    { id: 'date', header: 'Date', renderCell: (row) => formatDate(row.date), minWidth: 120 },
    { id: 'item', header: 'Item', renderCell: (row) => row.item, minWidth: 180 },
    { id: 'source', header: 'Source', renderCell: (row) => row.source ?? '—', minWidth: 150 },
    { id: 'destination', header: 'Destination', renderCell: (row) => row.destination ?? row.warehouse ?? '—', minWidth: 160 },
    { id: 'store', header: 'Store', renderCell: (row) => row.store ?? '—', minWidth: 140 },
    { id: 'type', header: 'Type', renderCell: (row) => row.type, minWidth: 120 },
    { id: 'qty', header: 'Qty', align: 'right', renderCell: (row) => formatNumber(row.qty), width: 80 },
    { id: 'value', header: 'Value', align: 'right', renderCell: (row) => formatCurrency(row.value), minWidth: 120 },
    { id: 'order', header: 'Order', renderCell: (row) => row.orderNo ?? '—', minWidth: 120 },
  ], []);

  const tableLoading = inventoryItemsQuery.isLoading;
  const chartError = inventoryItemsQuery.error ? new Error(getErrorMessage(inventoryItemsQuery.error)) : undefined;
  const topLowStockValue = tableLoading ? '—' : tableLowStockCount;
  const topLowStockFormat = tableLoading ? undefined : 'number';
  const topOutOfStockValue = tableLoading ? '—' : tableOutOfStockCount;
  const topOutOfStockFormat = tableLoading ? undefined : 'number';
  const topInventoryValue = tableLoading ? '—' : tableInventoryValue;
  const topInventoryValueFormat = tableLoading ? undefined : 'number';
  const topTotalItemsValue = tableLoading ? '—' : tableTotalItems;
  const topTotalItemsFormat = tableLoading ? undefined : 'number';

  const inventoryKpiContent = inventorySummaryLoading ? '—' : inventorySummaryError ? '—' : undefined;
  const criticalKpiContent = criticalDataLoading ? '—' : criticalDataError ? '—' : undefined;
  const slowExcessError = slowExcessAnalyticsQuery.error
    ? slowExcessAnalyticsQuery.error instanceof Error
      ? slowExcessAnalyticsQuery.error
      : new Error(getErrorMessage(slowExcessAnalyticsQuery.error))
    : null;
  const slowExcessContent = slowExcessAnalyticsQuery.isLoading ? '—' : slowExcessError ? '—' : undefined;
  const utilizationKpiContent = utilizationKpisQuery.isLoading ? '—' : utilizationKpisQuery.error ? '—' : undefined;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Inventory"
        menuItems={quickActions}
        onSearch={handleHeaderSearch}
        variant="widgets"
        metrics={[
          {
            key: 'urgent-inventory',
            label: 'Urgent Items',
            value: urgentInventoryDisplay,
            icon: <AlertTriangle className="h-4 w-4" />,
            tone: urgentInventoryTone,
          },
          {
            key: 'urgent-tasks',
            label: 'Urgent Tasks',
            value: urgentInventoryTasksDisplay,
            icon: <ClipboardList className="h-4 w-4" />,
            tone: urgentInventoryTasksTone,
          },
        ]}
      />

      <BaseCard title="Inventory Overview" subtitle="Real-time health of stock levels">
        <div className="space-y-6">
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<PackageMinus className="h-5 w-5 text-amber-500" />}
              label="Low Stock"
              value={topLowStockValue}
              valueFormat={topLowStockFormat}
              className="h-full"
            />
            <StatCard
              icon={<PackageX className="h-5 w-5 text-red-500" />}
              label="Out of Stock"
              value={topOutOfStockValue}
              valueFormat={topOutOfStockFormat}
              className="h-full"
            />
            <StatCard
              icon={<Wallet className="h-5 w-5 text-emerald-500" />}
              label="Inventory Value"
              value={topInventoryValue}
              valueFormat={topInventoryValueFormat}
              className="h-full"
            />
            <StatCard
              icon={<Boxes className="h-5 w-5 text-sky-500" />}
              label="Total Items"
              value={topTotalItemsValue}
              valueFormat={topTotalItemsFormat}
              className="h-full"
            />
          </div>

          <div className="grid auto-rows-fr gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Low vs Out of Stock"
              subtitle="Stock health distribution"
              data={stockHealthChartData}
              loading={tableLoading}
              error={chartError}
            />
            <PieInsightCard
              title="Items per Warehouse"
              subtitle="SKU distribution"
              data={warehouseChartData}
              loading={tableLoading}
              error={chartError}
              emptyMessage="No warehouse data"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard
        title="Completed Orders Transfer"
        subtitle="Review completed purchase order lines before they hit inventory"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pending lines</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {actionableCompletedLines.length} awaiting action
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Total value</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalActionableAmount)}
              </div>
            </div>
          </div>

          {purchaseOrdersLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading completed orders…
            </div>
          ) : actionableCompletedLines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              All caught up — completed orders will appear here once they’re ready to be received or transferred.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Order Num
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Item Code
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Warehouse
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Transfer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white/70 dark:divide-gray-800 dark:bg-gray-950/40">
                  {completedPagination.rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No lines on this page.
                      </td>
                    </tr>
                  ) : completedPagination.rows.map((line) => {
                    const isProcessing = lineProgress?.id === line.id;
                    return (
                      <tr key={line.id} className="transition hover:bg-gray-50/80 dark:hover:bg-gray-900/60">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {line.orderNo}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm uppercase text-gray-600 dark:text-gray-400">
                          {line.itemCode}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {line.itemName}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatNumber(line.quantity)}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                          {line.unit.toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          {line.warehouse}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(line.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReceiveLine(line)}
                              disabled={isProcessing}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                              title="Receive into inventory"
                              aria-label="Receive into inventory"
                            >
                              {isProcessing && lineProgress?.action === 'receive' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHoldLine(line)}
                              disabled={isProcessing}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 text-sky-600 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/30"
                              title="Put on hold"
                              aria-label="Put on hold"
                            >
                              {isProcessing && lineProgress?.action === 'hold' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PauseCircle className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectLine(line)}
                              disabled={isProcessing}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                              title="Reject"
                              aria-label="Reject"
                            >
                              {isProcessing && lineProgress?.action === 'reject' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleTransferClick(line)}
                              disabled={isProcessing}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                              title="Transfer to recent movements"
                              aria-label="Transfer to recent movements"
                            >
                              {isProcessing && lineProgress?.action === 'transfer' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowLeftRight className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {completedPagination.total === 0
                    ? 'Showing 0 items'
                    : `Showing ${completedPagination.start + 1}–${completedPagination.start + completedPagination.rows.length} of ${completedPagination.total}`}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    Rows per page
                    <select
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      value={String(completedPageSize)}
                      onChange={(event) => {
                        const next = Number(event.currentTarget.value);
                        setCompletedPageSize(next);
                        setCompletedPage(0);
                      }}
                    >
                      {COMPLETED_PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompletedPage((prev) => Math.max(prev - 1, 0))}
                      disabled={completedPagination.safePage === 0}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletedPage((prev) => {
                        if (completedPagination.totalPages === 0) return 0;
                        return Math.min(prev + 1, completedPagination.totalPages - 1);
                      })}
                      disabled={completedPagination.totalPages === 0 || completedPagination.safePage >= completedPagination.totalPages - 1}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </BaseCard>

      <BaseCard title="Inventory" subtitle="Sortable, filterable, and exportable">
        <DataTable<InventoryTableItem>
          columns={inventoryColumns}
          rows={inventoryRows}
          keyExtractor={(row) => row.id}
          rowHeight={72}
          loading={inventoryItemsQuery.isLoading}
          errorState={inventoryItemsQuery.error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(inventoryItemsQuery.error)}</div>
          ) : undefined}
          emptyState={(
            <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-gray-500">
              <div className="text-base font-semibold text-gray-700 dark:text-gray-200">No items yet</div>
              <div>Start by adding your first material.</div>
              <Button type="button" size="sm" onClick={() => setCreateItemOpen(true)}>
                Add Material
              </Button>
            </div>
          )}
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
            <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/70">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="relative w-full sm:w-auto">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                      <input
                        type="search"
                        value={searchInput}
                        onChange={handleSearchInputChange}
                        placeholder="Search items…"
                        className="h-10 w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-400 sm:w-64"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {STATUS_FILTERS.map((filter) => {
                        const active = inventoryStatusFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => handleStatusFilter(filter.id)}
                            className={getFilterChipClass(active)}
                            aria-pressed={active}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                      {categoryFilters.map((category) => {
                        const active = inventoryCategoryFilter !== 'all'
                          && normalizeCategory(inventoryCategoryFilter) === normalizeCategory(category.value);
                        return (
                          <button
                            key={category.value}
                            type="button"
                            onClick={() => handleCategoryFilter(category.value)}
                            className={getFilterChipClass(active)}
                            aria-pressed={active}
                          >
                            {category.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${selectedCount > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}
                    aria-live="polite"
                  >
                    {selectedCount} selected
                  </span>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                      >
                        Quick Actions
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        sideOffset={8}
                        align="end"
                        className="z-50 min-w-[240px] rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900"
                      >
                        <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          Quick actions
                        </DropdownMenu.Label>
                        <DropdownMenu.Item
                          title="Add a new material"
                          onSelect={() => {
                            handleInventoryQuickAction('add');
                          }}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-gray-200 dark:focus:bg-gray-800"
                        >
                          <PackagePlus className="h-4 w-4 text-primary-600" />
                          Add Material…
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          disabled={selectedCount === 0}
                          title={selectedCount === 0 ? 'Select rows to bulk edit' : 'Bulk edit selected materials'}
                          onSelect={() => {
                            if (selectedCount === 0) return;
                            handleInventoryQuickAction('bulk-edit');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none transition focus:bg-gray-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[highlighted]:bg-gray-100 dark:text-gray-200 dark:focus:bg-gray-800"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                          Bulk Edit…
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          disabled={selectedCount === 0}
                          title={selectedCount === 0 ? 'Select rows to move' : 'Move selected to another warehouse'}
                          onSelect={() => {
                            if (selectedCount === 0) return;
                            handleInventoryQuickAction('move');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none transition focus:bg-gray-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[highlighted]:bg-gray-100 dark:text-gray-200 dark:focus:bg-gray-800"
                        >
                          <ArrowLeftRight className="h-4 w-4 text-gray-500" />
                          Move to Warehouse…
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          disabled={selectedCount === 0}
                          title={selectedCount === 0 ? 'Select rows to delete' : 'Delete selected materials'}
                          onSelect={() => {
                            if (selectedCount === 0) return;
                            handleInventoryQuickAction('delete');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition focus:bg-red-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[highlighted]:bg-red-50 dark:text-red-400 dark:focus:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Selected
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-2 h-px bg-gray-200 dark:bg-gray-800" />
                        <DropdownMenu.Item
                          disabled={selectedCount === 0}
                          title={selectedCount === 0 ? 'Select rows to export' : 'Export selected rows to CSV'}
                          onSelect={() => {
                            if (selectedCount === 0) return;
                            handleInventoryQuickAction('export');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none transition focus:bg-gray-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[highlighted]:bg-gray-100 dark:text-gray-200 dark:focus:bg-gray-800"
                        >
                          <DownloadCloud className="h-4 w-4 text-gray-500" />
                          Export Selected CSV
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          title="Import materials from CSV"
                          onSelect={() => {
                            handleInventoryQuickAction('import');
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none transition focus:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-gray-200 dark:focus:bg-gray-800"
                        >
                          <UploadCloud className="h-4 w-4 text-gray-500" />
                          Import CSV
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
            </div>
          )}
        />
      </BaseCard>
      {/* Warehouse 2D Layout is temporarily disabled; flip ENABLE_WAREHOUSE_2D_LAYOUT to re-enable. */}
      {ENABLE_WAREHOUSE_2D_LAYOUT && LazyWarehouse2DLayoutBlock ? (
        <Suspense fallback={null}>
          <LazyWarehouse2DLayoutBlock />
        </Suspense>
      ) : null}

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
            <div className="space-y-3">
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
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                <label className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wide">Store</span>
                  <select
                    value={movementStore}
                    onChange={(event) => {
                      setMovementStore(event.target.value);
                      setMovementPage(0);
                    }}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900"
                  >
                    {movementStoreOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wide">Sort</span>
                  <select
                    value={movementSortSelection.id}
                    onChange={(event) => handleMovementSortChange(event.target.value as typeof MOVEMENT_SORT_OPTIONS[number]['id'])}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900"
                  >
                    {MOVEMENT_SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        />
      </BaseCard>

      <BaseCard title="Inventory Details" subtitle="Explore all SKUs, values, and status">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {inventoryDetailsCards.map((card) => {
              const cardValue = inventoryKpiContent ?? card.value;
              const isNumeric = typeof cardValue !== 'string';
              return (
                <StatCard
                  key={card.key}
                  icon={card.icon}
                  label={card.label}
                  value={cardValue}
                  valueFormat={isNumeric ? card.format : undefined}
                  valueFractionDigits={isNumeric ? card.fractionDigits : undefined}
                  className="h-full"
                />
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Status Distribution"
              subtitle="In / Low / Out"
              data={statusDistribution}
              loading={inventorySummaryLoading}
              error={inventorySummaryError}
            />
            <ChartCard title="Value by Category" height={280}>
              <ChartState
                loading={inventorySummaryLoading}
                error={inventorySummaryError}
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
            {criticalCards.map((card) => {
              const cardValue = criticalKpiContent ?? card.value;
              const isNumeric = typeof cardValue !== 'string';
              return (
                <StatCard
                  key={card.key}
                  icon={card.icon}
                  label={card.label}
                  value={cardValue}
                  valueFormat={isNumeric ? card.format : undefined}
                  className="h-full"
                />
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Critical Items by Category"
              data={criticalCategoryPie}
              loading={criticalDataLoading}
              error={criticalDataError}
            />
            <ChartCard title="Critical Items by Warehouse" height={280}>
              <ChartState
                loading={criticalDataLoading}
                error={criticalDataError}
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
                      {(() => {
                        const statusKey = row.status as StatusValue;
                        const tone = STATUS_BADGE_STYLES[statusKey] ?? 'bg-gray-100 text-gray-600';
                        const label = STATUS_LABELS[statusKey] ?? row.status;
                        return (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
                            {label}
                          </span>
                        );
                      })()}
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
            <StatCard
              icon={<Timer className="h-5 w-5 text-amber-500" />}
              label="Slow-Moving Items"
              value={slowExcessContent ?? slowExcessInsights.slowCount}
              valueFormat={slowExcessContent ? undefined : 'number'}
              className="h-full"
            />
            <StatCard
              icon={<Wallet className="h-5 w-5 text-emerald-500" />}
              label="Slow-Moving Value"
              value={slowExcessContent ?? slowExcessInsights.slowValue}
              valueFormat={slowExcessContent ? undefined : 'sar'}
              className="h-full"
            />
            <StatCard
              icon={<Boxes className="h-5 w-5 text-sky-500" />}
              label="Excess Stock"
              value={slowExcessContent ?? slowExcessInsights.excessCount}
              valueFormat={slowExcessContent ? undefined : 'number'}
              className="h-full"
            />
            <StatCard
              icon={<PackageSearch className="h-5 w-5 text-indigo-500" />}
              label="Excess Stock Value"
              value={slowExcessContent ?? slowExcessInsights.excessValue}
              valueFormat={slowExcessContent ? undefined : 'sar'}
              className="h-full"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PieInsightCard
              title="Excess by Category"
              data={excessCategoryPie}
              loading={slowExcessAnalyticsQuery.isLoading}
              error={slowExcessError}
            />
            <ChartCard title="Top Slow-Moving Items" height={280}>
              <ChartState
                loading={slowExcessAnalyticsQuery.isLoading}
                error={slowExcessError}
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

      <BaseCard title="Warehouse Utilization" subtitle="Capacity and usage by warehouse">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {utilizationCards.map((card) => {
              const cardValue = utilizationKpiContent ?? card.value;
              const isNumeric = typeof cardValue !== 'string';
              return (
                <StatCard
                  key={card.key}
                  icon={card.icon}
                  label={card.label}
                  value={cardValue}
                  valueFormat={isNumeric ? card.format : undefined}
                  valueFractionDigits={isNumeric ? card.fractionDigits : undefined}
                  className="h-full"
                />
              );
            })}
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

      <HologramInventoryBlock />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BaseCard title="Recent Activity" subtitle="Inventory movements and transactions">
          <RecentActivityFeed
            items={activityFeedItems}
            visibleCount={6}
            isLoading={activityFeedLoading}
            errorMessage={activityFeedErrorMessage}
            emptyMessage="No recent activity yet."
            onRetry={() => { void activityFeedQuery.refetch(); }}
          />
        </BaseCard>
        <RequestsTasksCard scope="inventory" references={taskReferences} className="h-full" />
      </div>

      <MoveToWarehouseModal
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        selectedIds={selectedIds}
        selectedServerIds={selectedServerIds}
        selectedCount={selectedCount}
        initialOptions={warehouseOptions}
        onSuccess={(moved, destination) => {
          setMoveModalOpen(false);
          invalidateCoreInventoryQueries();
          toast.success(`Moved ${moved} item${moved === 1 ? '' : 's'} to ${destination}`);
        }}
      />

      <DeleteConfirmModal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        selectedIds={selectedIds}
        selectedServerIds={selectedServerIds}
        selectedCount={selectedCount}
        selectedRows={selectedRows}
        onSuccess={(deleted, failed) => {
          setConfirmDeleteOpen(false);
          invalidateCoreInventoryQueries();
          if (failed && failed.length) {
            toast.error(`Deleted ${deleted} item${deleted === 1 ? '' : 's'}, ${failed.length} failed.`);
          } else {
            toast.success(`Deleted ${deleted} item${deleted === 1 ? '' : 's'}`);
          }
        }}
      />

      <BulkEditModal
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedIds={selectedIds}
        selectedServerIds={selectedServerIds}
        selectedCount={selectedCount}
        categories={categoryOptions}
        onSuccess={(updated) => {
          setBulkEditOpen(false);
          invalidateCoreInventoryQueries();
          toast.success(`Updated ${updated} item${updated === 1 ? '' : 's'}`);
        }}
      />

      <TransferModal
        line={transferLine}
        busy={Boolean(transferLine && lineProgress?.id === transferLine.id && lineProgress?.action === 'transfer')}
        onCancel={handleTransferCancel}
        onConfirm={() => { void handleTransferConfirm(); }}
      />

      <AddItemModal
        open={createItemOpen}
        onClose={() => setCreateItemOpen(false)}
        onSuccess={handleItemCreated}
        categoryOptions={CATEGORY_OPTIONS}
        unitOptions={INVENTORY_ITEM_UNITS}
        existingCodes={existingItemCodes}
      />

      <MovementModal
        action={movementAction}
        onClose={() => setMovementAction(null)}
        onSuccess={handleMovementSuccess}
      />

      <StoreManagerModal
        open={storeManagerOpen}
        onClose={() => setStoreManagerOpen(false)}
        onMutated={() => {
          invalidateCoreInventoryQueries();
        }}
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
  const isReceive = action?.moveType === 'IN';
  const isIssue = action?.moveType === 'OUT';

  const { data: inventoryItems = [], isLoading: loadingInventoryItems } = useAllInventoryTableItems();

  const [orders, setOrders] = React.useState<PurchaseOrderDTO[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [orderSearch, setOrderSearch] = React.useState('');
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>('');
  const [selectedOrderItemId, setSelectedOrderItemId] = React.useState<string>('');

  const [warehouses, setWarehouses] = React.useState<InventoryWarehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = React.useState(false);
  const [warehouseError, setWarehouseError] = React.useState<string | null>(null);

  const [inventorySearch, setInventorySearch] = React.useState('');
  const [selectedInventoryId, setSelectedInventoryId] = React.useState<number | ''>('');
  const [qty, setQty] = React.useState<number>(1);
  const [note, setNote] = React.useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = React.useState<number | ''>('');
  const [destinationWarehouseId, setDestinationWarehouseId] = React.useState<number | ''>('');
  const [sourceWarehouseLabel, setSourceWarehouseLabel] = React.useState('');
  const [destinationWarehouseLabel, setDestinationWarehouseLabel] = React.useState('');
  const [stores, setStores] = React.useState<StoreDTO[]>([]);
  const [storesLoading, setStoresLoading] = React.useState(false);
  const [storesError, setStoresError] = React.useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = React.useState<number | ''>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setOrdersError(null);
      setOrderSearch('');
      setSelectedOrderId('');
      setSelectedOrderItemId('');
      setSelectedInventoryId('');
      setInventorySearch('');
      setQty(1);
      setNote('');
      setSourceWarehouseId('');
      setDestinationWarehouseId('');
      setSourceWarehouseLabel('');
      setDestinationWarehouseLabel('');
      setModalError(null);
      setStoresError(null);
      setSelectedStoreId('');
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || !isReceive) return;
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);
    listPurchaseOrders()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        if (!list.length) {
          setOrdersError('No purchase orders available.');
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setOrdersError(getErrorMessage(error));
      })
      .finally(() => {
        if (cancelled) return;
        setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isReceive]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setWarehousesLoading(true);
    setWarehouseError(null);
    fetchInventoryWarehouses()
      .then((data) => {
        if (cancelled) return;
        setWarehouses(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (cancelled) return;
        setWarehouseError(getErrorMessage(error));
      })
      .finally(() => {
        if (cancelled) return;
        setWarehousesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStoresLoading(true);
    setStoresError(null);
    listStores({ activeOnly: true })
      .then((data) => {
        if (cancelled) return;
        setStores(data);
        if (data.length) {
          setSelectedStoreId((prev) => (prev ? prev : data[0]?.id ?? ''));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setStoresError(getErrorMessage(error));
      })
      .finally(() => {
        if (cancelled) return;
        setStoresLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredOrders = React.useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const term = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const orderNo = String(order.orderNo ?? order.id ?? '').toLowerCase();
      const vendor = String(order.vendorName ?? '').toLowerCase();
      return orderNo.includes(term) || vendor.includes(term);
    });
  }, [orders, orderSearch]);

  const selectedOrder = React.useMemo(() => (
    selectedOrderId ? orders.find((order) => String(order.id) === selectedOrderId || String(order.orderNo) === selectedOrderId) ?? null : null
  ), [orders, selectedOrderId]);

  const orderItems = selectedOrder?.items ?? [];

  const selectedOrderItem = React.useMemo(() => (
    selectedOrderItemId
      ? orderItems.find((item) => String(item.id) === selectedOrderItemId)
      : null
  ), [orderItems, selectedOrderItemId]);

  React.useEffect(() => {
    if (!isReceive) return;
    if (!selectedOrder) {
      setSelectedOrderItemId('');
      return;
    }
    if (!selectedOrderItemId && selectedOrder.items?.length) {
      const first = selectedOrder.items[0];
      if (first?.id != null) {
        setSelectedOrderItemId(String(first.id));
      }
    }
  }, [isReceive, selectedOrder, selectedOrderItemId]);

  React.useEffect(() => {
    if (!isReceive) return;
    if (!selectedOrderItem) return;
    const rawQty = Number(selectedOrderItem.qty ?? (selectedOrderItem as any)?.quantity ?? 1);
    const normalizedQty = Number.isFinite(rawQty) && rawQty > 0 ? Math.round(rawQty) : 1;
    setQty(normalizedQty);
    if (!inventoryItems.length || selectedInventoryId) return;
    const code = String(selectedOrderItem.materialNo ?? '').trim().toLowerCase();
    if (!code) return;
    const match = inventoryItems.find((item) => {
      const itemCode = String(item.code ?? '').trim().toLowerCase();
      return itemCode === code;
    });
    if (match?.serverId) {
      setSelectedInventoryId(match.serverId);
      if (match.warehouse) {
        setDestinationWarehouseLabel(match.warehouse);
      }
    }
  }, [isReceive, selectedOrderItem, inventoryItems, selectedInventoryId]);

  const filteredInventoryItems = React.useMemo(() => {
    const term = inventorySearch.trim().toLowerCase();
    const withServerId = inventoryItems.filter((item) => typeof item.serverId === 'number' && Number.isFinite(item.serverId));
    if (!term) return withServerId;
    return withServerId.filter((item) => {
      const code = String(item.code ?? '').toLowerCase();
      const name = String(item.name ?? '').toLowerCase();
      const warehouse = String(item.warehouse ?? '').toLowerCase();
      return code.includes(term) || name.includes(term) || warehouse.includes(term);
    });
  }, [inventoryItems, inventorySearch]);

  const selectedInventoryItem = React.useMemo(() => {
    if (typeof selectedInventoryId !== 'number') return undefined;
    return inventoryItems.find((item) => item.serverId === selectedInventoryId)
      ?? inventoryItems.find((item) => Number(item.id) === selectedInventoryId);
  }, [inventoryItems, selectedInventoryId]);

  React.useEffect(() => {
    if (!selectedInventoryItem) return;
    const label = selectedInventoryItem.warehouse ?? '';
    if (!sourceWarehouseId && !sourceWarehouseLabel && label) {
      setSourceWarehouseLabel(label);
    }
    if (isReceive && !destinationWarehouseId && !destinationWarehouseLabel && label) {
      setDestinationWarehouseLabel(label);
    }
  }, [selectedInventoryItem, sourceWarehouseId, sourceWarehouseLabel, destinationWarehouseId, destinationWarehouseLabel, isReceive]);

  if (!open || !action) return null;

  const description = action.moveType === 'IN'
    ? 'Receive items into inventory, optionally from a purchase order.'
    : 'Record an outbound movement for the selected inventory item.';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof selectedInventoryId !== 'number') {
      setModalError('Choose an inventory item.');
      return;
    }
    const normalizedQty = Math.round(Number(qty));
    if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
      setModalError('Quantity must be greater than zero.');
      return;
    }
    if (isReceive && !destinationWarehouseId && !destinationWarehouseLabel.trim()) {
      setModalError('Select a destination warehouse or provide a label.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateInventoryMovementPayload = {
        moveType: action.moveType,
        qty: normalizedQty,
        note: note.trim() || undefined,
      };

      if (isReceive && selectedOrder) {
        const numericOrderId = Number(selectedOrder.id ?? selectedOrder.orderNo);
        if (Number.isFinite(numericOrderId) && numericOrderId > 0) {
          payload.orderId = numericOrderId;
        }
      }

      if (typeof sourceWarehouseId === 'number' && Number.isFinite(sourceWarehouseId)) {
        payload.sourceWarehouseId = sourceWarehouseId;
      } else if (sourceWarehouseLabel.trim()) {
        payload.sourceWarehouse = sourceWarehouseLabel.trim();
      }

      if (typeof destinationWarehouseId === 'number' && Number.isFinite(destinationWarehouseId)) {
        payload.destinationWarehouseId = destinationWarehouseId;
      } else if (destinationWarehouseLabel.trim()) {
        payload.destinationWarehouse = destinationWarehouseLabel.trim();
      }

      await createMovement(selectedInventoryId, payload);
      toast.success(isReceive ? 'Stock received' : 'Stock issued');
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
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {isReceive ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="flex-1 text-sm font-medium text-gray-700">
                  Purchase Order
                  <select
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                    value={selectedOrderId}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setSelectedOrderId(value);
                      setSelectedOrderItemId('');
                    }}
                    disabled={ordersLoading || submitting || !!ordersError}
                  >
                    <option value="">Select purchase order</option>
                    {(filteredOrders.length ? filteredOrders : orders).slice(0, 80).map((order) => {
                      const id = String(order.id ?? order.orderNo ?? '');
                      const label = `${order.orderNo ?? id} — ${order.vendorName ?? 'Unnamed vendor'}`;
                      return (
                        <option key={id} value={id}>{label}</option>
                      );
                    })}
                  </select>
                </label>
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.currentTarget.value)}
                  placeholder="Search orders by number or vendor"
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:w-64"
                  disabled={ordersLoading || submitting}
                />
              </div>
              {ordersLoading ? (
                <div className="text-sm text-gray-500">Loading purchase orders…</div>
              ) : ordersError ? (
                <div className="text-sm text-red-600">{ordersError}</div>
              ) : selectedOrder ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-white px-3 py-2 text-xs text-gray-500">
                      <div className="font-semibold text-gray-700">Vendor</div>
                      <div>{selectedOrder.vendorName ?? '—'}</div>
                    </div>
                    <div className="rounded-lg border bg-white px-3 py-2 text-xs text-gray-500">
                      <div className="font-semibold text-gray-700">Department</div>
                      <div>{selectedOrder.department ?? '—'}</div>
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-gray-700">
                    Order Line
                    <select
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      value={selectedOrderItemId}
                      onChange={(event) => setSelectedOrderItemId(event.currentTarget.value)}
                      disabled={submitting || !orderItems.length}
                    >
                      {orderItems.map((item) => (
                        <option key={String(item.id)} value={String(item.id)}>
                          {(item.materialNo ?? 'Uncoded')} — {item.description ?? 'No description'} (Qty: {formatNumber(item.qty ?? 0)} {item.unit ?? ''})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="flex-1 text-sm font-medium text-gray-700">
                Inventory Item
                <select
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  value={selectedInventoryId}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setSelectedInventoryId(value ? Number(value) : '');
                  }}
                  disabled={submitting || loadingInventoryItems || !filteredInventoryItems.length}
                >
                  <option value="">Select inventory item</option>
                  {filteredInventoryItems.slice(0, 200).map((item) => (
                    <option key={item.serverId ?? item.id} value={item.serverId ?? Number(item.id)}>
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="search"
                value={inventorySearch}
                onChange={(event) => setInventorySearch(event.currentTarget.value)}
                placeholder="Search inventory items"
                className="w-full rounded-lg border px-3 py-2 text-sm sm:w-64"
                disabled={loadingInventoryItems || submitting}
              />
            </div>
            {loadingInventoryItems ? (
              <div className="mt-3 text-sm text-gray-500">Loading inventory items…</div>
            ) : null}
            {selectedInventoryItem ? (
              <div className="mt-3 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500 sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-gray-700">Code:</span> {selectedInventoryItem.code}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">On hand:</span> {formatNumber(selectedInventoryItem.qty)} {selectedInventoryItem.unit?.toUpperCase() ?? ''}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Warehouse:</span> {selectedInventoryItem.warehouse ?? 'Unassigned'}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Store:</span> {selectedInventoryItem.store ?? 'Unassigned'}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Source Warehouse
                <select
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  value={sourceWarehouseId}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setSourceWarehouseId(value ? Number(value) : '');
                    if (value) {
                      const match = warehouses.find((warehouse) => warehouse.id === Number(value));
                      if (match?.name) setSourceWarehouseLabel(match.name);
                    }
                  }}
                  disabled={warehousesLoading || submitting}
                >
                  <option value="">External / Other</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="text"
                value={sourceWarehouseLabel}
                onChange={(event) => setSourceWarehouseLabel(event.currentTarget.value)}
                placeholder="Custom source label"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                disabled={typeof sourceWarehouseId === 'number' && sourceWarehouseId > 0}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Destination Warehouse{isReceive ? '' : ' (optional)'}
                <select
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  value={destinationWarehouseId}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDestinationWarehouseId(value ? Number(value) : '');
                    if (value) {
                      const match = warehouses.find((warehouse) => warehouse.id === Number(value));
                      if (match?.name) setDestinationWarehouseLabel(match.name);
                    }
                  }}
                  disabled={warehousesLoading || submitting}
                >
                  <option value="">{isReceive ? 'Select warehouse' : 'External / Other'}</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="text"
                value={destinationWarehouseLabel}
                onChange={(event) => setDestinationWarehouseLabel(event.currentTarget.value)}
                placeholder="Custom destination label"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                disabled={typeof destinationWarehouseId === 'number' && destinationWarehouseId > 0}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          {warehouseError ? <div className="text-sm text-red-600">{warehouseError}</div> : null}
          {modalError ? <div className="text-sm text-red-600">{modalError}</div> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || loadingInventoryItems}>
              {submitting ? 'Saving…' : action.moveType === 'IN' ? 'Receive Stock' : 'Issue Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type StoreManagerModalProps = {
  open: boolean;
  onClose: () => void;
  onMutated: () => void;
};

function StoreManagerModal({ open, onClose, onMutated }: StoreManagerModalProps) {
  const [stores, setStores] = React.useState<StoreDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [capacity, setCapacity] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [rowError, setRowError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [rowBusyId, setRowBusyId] = React.useState<number | null>(null);

  const fetchStores = React.useCallback(async () => {
    setLoading(true);
    setRowError(null);
    try {
      const data = await listStores({ activeOnly: false, includeCounts: true });
      setStores(data);
    } catch (err) {
      setRowError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    void fetchStores();
    setCode('');
    setName('');
    setLocation('');
    setDescription('');
    setCapacity('');
    setFormError(null);
    setEditingId(null);
    setEditingName('');
  }, [open, fetchStores]);

  if (!open) return null;

  const resolveStoreError = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 0;
      const apiError = (err.response?.data as any)?.error;
      if (status === 409) {
        if (apiError === 'store_name_duplicate' || apiError === 'store_code_duplicate') {
          return 'Store with this name or code already exists.';
        }
        return 'Store already exists.';
      }
      if (status === 422) return 'Invalid store data provided.';
      if (typeof apiError === 'string') return apiError;
      if (typeof err.message === 'string') return err.message;
    }
    return getErrorMessage(err);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName) {
      setFormError('Store code and name are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createStore({
        code: trimmedCode,
        name: trimmedName,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
      });
      toast.success('Store created');
      await fetchStores();
      onMutated();
      setCode('');
      setName('');
      setLocation('');
      setDescription('');
      setCapacity('');
    } catch (err) {
      setFormError(resolveStoreError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const commitRename = async (storeId: number) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setRowError('Store name cannot be empty.');
      return;
    }
    setRowBusyId(storeId);
    setRowError(null);
    try {
      await updateStore(storeId, { name: trimmed });
      toast.success('Store renamed');
      setEditingId(null);
      setEditingName('');
      await fetchStores();
      onMutated();
    } catch (err) {
      setRowError(resolveStoreError(err));
    } finally {
      setRowBusyId(null);
    }
  };

  const handleDeactivate = async (store: StoreDTO) => {
    setRowBusyId(store.id);
    setRowError(null);
    try {
      await deleteStore(store.id);
      toast.success('Store deactivated');
      await fetchStores();
      onMutated();
    } catch (err) {
      setRowError(resolveStoreError(err));
    } finally {
      setRowBusyId(null);
    }
  };

  const handleActivate = async (store: StoreDTO) => {
    setRowBusyId(store.id);
    setRowError(null);
    try {
      await updateStore(store.id, { isActive: true });
      toast.success('Store reactivated');
      await fetchStores();
      onMutated();
    } catch (err) {
      setRowError(resolveStoreError(err));
    } finally {
      setRowBusyId(null);
    }
  };

  const isBusy = (storeId: number) => rowBusyId === storeId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Define Stores</h2>
            <p className="mt-1 text-sm text-gray-500">Manage store names, availability, and visibility across the app.</p>
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

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Store Code</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={code}
                onChange={(event) => setCode(event.currentTarget.value)}
                placeholder="e.g. STR-MAIN"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Main Fulfillment Center"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location <span className="text-gray-400">(optional)</span></label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={location}
                onChange={(event) => setLocation(event.currentTarget.value)}
                placeholder="Riyadh, KSA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={capacity}
                onChange={(event) => setCapacity(event.currentTarget.value)}
                placeholder="Total pallet capacity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description <span className="text-gray-400">(optional)</span></label>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
              />
            </div>
            {formError ? <div className="text-sm text-red-600">{formError}</div> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Close
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Add Store'}
              </Button>
            </div>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Existing Stores</h3>
                <p className="text-xs text-gray-500">Rename or deactivate stores. Inactive stores disappear from selectors.</p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-primary-600 hover:underline"
                onClick={() => void fetchStores()}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            {rowError ? <div className="px-4 py-2 text-xs text-red-600">{rowError}</div> : null}
            <div className="max-h-[360px] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Code</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Stats</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Loading stores…</td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No stores defined yet.</td>
                    </tr>
                  ) : (
                    stores.map((store) => {
                      const editing = editingId === store.id;
                      const statusLabel = store.isActive ? 'Active' : 'Inactive';
                      return (
                        <tr key={store.id} className="bg-white">
                          <td className="px-4 py-3 align-top">
                            {editing ? (
                              <input
                                className="w-full rounded border px-2 py-1 text-sm"
                                value={editingName}
                                onChange={(event) => setEditingName(event.currentTarget.value)}
                                disabled={isBusy(store.id)}
                              />
                            ) : (
                              <div>
                                <div className="font-semibold text-gray-900">{store.name}</div>
                                {store.location ? (
                                  <div className="text-xs text-gray-500">{store.location}</div>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="font-mono text-xs text-gray-700">{store.code}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className={store.isActive ? 'text-green-600' : 'text-gray-500'}>{statusLabel}</span>
                            {store.deletedAt ? (
                              <div className="text-[11px] text-gray-400">Removed {new Date(store.deletedAt).toLocaleDateString()}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 align-top text-xs text-gray-500">
                            Warehouses: {store.warehouseCount ?? 0}
                            <br />
                            Items: {store.inventoryCount ?? 0}
                          </td>
                          <td className="px-4 py-3 align-top text-right text-xs">
                            {editing ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  className="rounded border border-primary-200 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                                  onClick={() => commitRename(store.id)}
                                  disabled={isBusy(store.id)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingName('');
                                  }}
                                  disabled={isBusy(store.id)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                                  onClick={() => {
                                    setEditingId(store.id);
                                    setEditingName(store.name);
                                  }}
                                  disabled={isBusy(store.id)}
                                >
                                  Edit
                                </button>
                                {store.isActive ? (
                                  <button
                                    type="button"
                                    className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeactivate(store)}
                                    disabled={isBusy(store.id)}
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="rounded border border-green-200 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                                    onClick={() => handleActivate(store)}
                                    disabled={isBusy(store.id)}
                                  >
                                    Activate
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type BulkEditModalProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  selectedServerIds: number[];
  selectedCount: number;
  categories: string[];
  onSuccess: (updated: number) => void;
};

function BulkEditModal({ open, onClose, selectedIds: _selectedIds, selectedServerIds, selectedCount, categories, onSuccess }: BulkEditModalProps) {
  const [unit, setUnit] = React.useState('');
  const [lowQty, setLowQty] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setUnit('');
      setLowQty('');
      setCategory('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const patch: BulkUpdateInventoryItemsPayload['patch'] = {};

    if (!selectedServerIds.length) {
      setError('Select at least one item to bulk edit.');
      return;
    }

    if (unit) {
      patch.unit = unit as InventoryItemUnit;
    }

    const trimmedCategory = category.trim();
    if (trimmedCategory) {
      patch.category = trimmedCategory;
    }

    if (lowQty.trim()) {
      const parsedLow = Number(lowQty);
      if (!Number.isFinite(parsedLow) || parsedLow < 0) {
        setError('Danger low quantity must be zero or greater.');
        return;
      }
      patch.lowQty = parsedLow;
    }

    if (!Object.keys(patch).length) {
      setError('Choose at least one field to apply in bulk.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await bulkUpdateInventoryItems({ ids: selectedServerIds, patch });
      const updated = response.updated ?? selectedServerIds.length;
      onSuccess(updated);
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
            <h2 className="text-lg font-semibold text-gray-900">Bulk Edit Materials</h2>
            <p className="mt-1 text-sm text-gray-500">Apply updates to {selectedCount} selected item{selectedCount === 1 ? '' : 's'}.</p>
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
            Unit <span className="text-gray-400">(optional)</span>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={unit}
              onChange={(event) => setUnit(event.currentTarget.value)}
              disabled={submitting}
            >
              <option value="">Keep current</option>
              {INVENTORY_ITEM_UNITS.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Danger low quantity <span className="text-gray-400">(optional)</span>
            <input
              type="number"
              min={0}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={lowQty}
              onChange={(event) => setLowQty(event.currentTarget.value)}
              placeholder="Keep current"
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Category <span className="text-gray-400">(optional)</span>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={category}
              onChange={(event) => setCategory(event.currentTarget.value)}
              disabled={submitting}
            >
              <option value="">Keep current</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {categories
                .filter((option) => !CATEGORY_OPTIONS.includes(option as typeof CATEGORY_OPTIONS[number]))
                .map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </select>
          </label>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Apply Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type MoveToWarehouseModalProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  selectedServerIds: number[];
  selectedCount: number;
  initialOptions: string[];
  onSuccess: (moved: number, destination: string) => void;
};

function MoveToWarehouseModal({ open, onClose, selectedIds: _selectedIds, selectedServerIds, selectedCount, initialOptions, onSuccess }: MoveToWarehouseModalProps) {
  const [destination, setDestination] = React.useState('');
  const [warehouses, setWarehouses] = React.useState<InventoryWarehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = React.useState(false);
  const [warehouseError, setWarehouseError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fetchedRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    setDestination('');
    setError(null);
  }, [open]);

  React.useEffect(() => {
    if (!open || fetchedRef.current) return;
    let cancelled = false;
    setLoadingWarehouses(true);
    setWarehouseError(null);
    fetchInventoryWarehouses()
      .then((list) => {
        if (cancelled) return;
        setWarehouses(Array.isArray(list) ? list : []);
        fetchedRef.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        setWarehouseError(getErrorMessage(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingWarehouses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = destination.trim();
    if (!trimmed) {
      setError('Choose a destination warehouse.');
      return;
    }
    if (!selectedServerIds.length) {
      setError('Select at least one item to move.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await moveInventoryItems({ ids: selectedServerIds, toWarehouse: trimmed } satisfies MoveInventoryItemsPayload);
      const moved = response.moved ?? selectedServerIds.length;
      onSuccess(moved, trimmed);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const suggestions = React.useMemo(() => {
    const set = new Set<string>();
    initialOptions.forEach((name) => set.add(name));
    warehouses.forEach((warehouse) => {
      if (warehouse?.name) set.add(warehouse.name);
      if (warehouse?.code) set.add(warehouse.code);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [initialOptions, warehouses]);

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
            <h2 className="text-lg font-semibold text-gray-900">Move to Warehouse</h2>
            <p className="mt-1 text-sm text-gray-500">Move {selectedCount} selected item{selectedCount === 1 ? '' : 's'} to a new location.</p>
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
            Destination warehouse
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              list="inventory-move-warehouse-options"
              value={destination}
              onChange={(event) => setDestination(event.currentTarget.value)}
              placeholder="Start typing a warehouse name…"
              disabled={submitting}
              required
            />
            {suggestions.length ? (
              <datalist id="inventory-move-warehouse-options">
                {suggestions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            ) : null}
          </label>
          {loadingWarehouses ? (
            <div className="text-xs text-gray-400">Loading warehouse directory…</div>
          ) : warehouseError ? (
            <div className="text-xs text-red-500">{warehouseError}</div>
          ) : null}
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Moving…' : 'Move Items'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  selectedServerIds: number[];
  selectedCount: number;
  selectedRows: InventoryTableItem[];
  onSuccess: (deleted: number, failed?: Array<{ id: string; reason: string }>) => void;
};

function DeleteConfirmModal({ open, onClose, selectedIds: _selectedIds, selectedServerIds, selectedCount, selectedRows, onSuccess }: DeleteConfirmModalProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const sampleCodes = selectedRows.slice(0, 3).map((row) => row.code).join(', ');

  const handleDelete = async () => {
    if (!selectedServerIds.length) {
      setError('Select at least one item to delete.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await deleteInventoryItems({ ids: selectedServerIds });
      onSuccess(response.deleted?.length ?? selectedServerIds.length, response.failed);
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
            <h2 className="text-lg font-semibold text-gray-900">Delete Selected Materials</h2>
            <p className="mt-1 text-sm text-gray-500">This action will remove {selectedCount} item{selectedCount === 1 ? '' : 's'} from inventory.</p>
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
        <div className="space-y-3 text-sm text-gray-600">
          <p>Are you sure you want to delete these materials?</p>
          <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600">{sampleCodes}{selectedCount > 3 ? ', …' : ''}</p>
          <p>This cannot be undone. Locked items will remain and report the reason.</p>
        </div>
        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
type TransferModalProps = {
  line: CompletedOrderLine | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function TransferModal({ line, busy, onCancel, onConfirm }: TransferModalProps) {
  if (!line) return null;
  const keyframes = `@keyframes transfer-glide { 0% { transform: translateX(0); opacity: 0.35; } 50% { transform: translateX(calc(100% - 16px)); opacity: 1; } 100% { transform: translateX(0); opacity: 0.35; } }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
        <style>{keyframes}</style>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transfer Purchase Order</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Move <span className="font-semibold text-gray-900 dark:text-gray-100">{line.itemCode}</span> from PO
              {' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{line.orderNo}</span> into Recent Movements.
            </p>
          </div>
          <button
            type="button"
            className="text-gray-500 transition hover:text-gray-700 disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close transfer modal"
          >
            ×
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Item</dt>
            <dd className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{line.itemName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Quantity</dt>
            <dd className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{formatNumber(line.quantity)} {line.unit.toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Warehouse</dt>
            <dd className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{line.warehouse}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Amount</dt>
            <dd className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(line.amount)}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gradient-to-r from-slate-50 via-slate-100 to-white p-4 shadow-inner dark:border-gray-800 dark:from-gray-900 dark:via-gray-900/70 dark:to-gray-900">
          <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Transfer Path</div>
          <div className="relative mt-4 flex items-center gap-4">
            <div className="relative h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.6)]">
              <div className="absolute inset-0 rounded-full bg-blue-500/40 blur-sm" />
            </div>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-blue-200 via-slate-200 to-blue-200 dark:from-blue-900/40 dark:via-gray-800 dark:to-blue-900/40">
              <div
                className="absolute top-0 h-full w-4 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                style={{ animation: 'transfer-glide 1.8s ease-in-out infinite' }}
              />
            </div>
            <div className="relative h-4 w-4 rounded-full bg-slate-400 shadow-inner shadow-slate-500/40">
              <div className="absolute inset-0 rounded-full bg-slate-300/40 blur" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Transferring…
              </span>
            ) : (
              'Start Transfer'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
