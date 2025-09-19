import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import PageHeader from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import PieInsightCard from '../components/charts/PieInsightCard';
import BarChartCard from '../components/shared/BarChartCard';
import BarChart from '../components/charts/BarChart';
import RequestsTasksCard from '../components/requests/TasksCard';
import { StatCard, RecentActivityFeed, type RecentActivityEntry } from '../components/shared';
import cardTheme from '../styles/cardTheme';
import chartTheme from '../styles/chartTheme';
import {
  Plus,
  Upload,
  PackagePlus,
  Users,
  FileText as FileTextIcon,
  Info,
  FolderOpen,
  Timer,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Gauge,
  Building2,
  ListFilter,
  Check,
  X,
  Pause,
  AlertTriangle,
  UserRound,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  usePurchaseOrders,
  setPurchaseOrderStatus,
  setPurchaseOrderCompletion,
  type PurchaseOrderRecord,
  type PurchaseOrderStatus,
} from './orders/purchaseOrdersStore';

const menuItems = [
  { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" /> },
  { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" /> },
  { key: 'import-materials', label: 'Import Materials', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" /> },
  { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-payment-request', label: 'New Payment Request', icon: <FileTextIcon className="w-4.5 h-4.5" /> },
];

type PoSortColumn = 'requestNo' | 'orderNo' | 'vendor' | 'department' | 'poDate' | 'totalAmount' | 'status';

function fmtInt(n: number) {
  try { return new Intl.NumberFormat('en').format(n); } catch { return String(n); }
}

function fmtSAR(n: number) {
  try { return `${new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(n)} SAR`; } catch { return `${n} SAR`; }
}

function fmtPercent(n: number, fractionDigits = 0) {
  try {
    return `${new Intl.NumberFormat('en', { style: 'percent', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(n)}`;
  } catch {
    return `${(n * 100).toFixed(fractionDigits)}%`;
  }
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

const PO_STATUS_FILTERS: Array<'All' | PurchaseOrderStatus> = ['All', 'Pending', 'Approved', 'Rejected', 'OnHold'];

const PO_ACTION_CONTROLS: Array<{ status: PurchaseOrderStatus; label: string; icon: React.ReactNode; tone: 'emerald' | 'red' | 'sky' }> = [
  { status: 'Approved', label: 'Approve', icon: <Check className="h-3.5 w-3.5" />, tone: 'emerald' },
  { status: 'Rejected', label: 'Reject', icon: <X className="h-3.5 w-3.5" />, tone: 'red' },
  { status: 'OnHold', label: 'Hold', icon: <Pause className="h-3.5 w-3.5" />, tone: 'sky' },
];

const SLA_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const SLA_MS = SLA_DAYS * DAY_MS;

const STATUS_SEQUENCE: Array<PurchaseOrderStatus | 'Other'> = ['Pending', 'Approved', 'OnHold', 'Rejected', 'Other'];

function formatPoStatusLabel(status: PurchaseOrderStatus) {
  return status === 'OnHold' ? 'On Hold' : status;
}

function poStatusBadgeClass(status: PurchaseOrderStatus) {
  switch (status) {
    case 'Approved':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    case 'Rejected':
      return 'bg-red-50 text-red-600 border border-red-200';
    case 'OnHold':
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    default:
      return 'bg-amber-50 text-amber-600 border border-amber-200';
  }
}

function normalizeKey(value?: string | null) {
  const trimmed = (value ?? '').trim();
  return trimmed.length ? trimmed : '—';
}

function getTime(value?: string | null) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function isOverdue(order: PurchaseOrderRecord) {
  const ts = getTime(order.poDate);
  if (ts == null) return false;
  return Date.now() - ts > SLA_MS;
}

function relativeTime(value?: string | null) {
  const ts = getTime(value);
  if (ts == null) return '—';
  const diff = Date.now() - ts;
  if (diff < 0) return 'just now';
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const date = new Date(ts);
  return date.toLocaleDateString();
}

function infoButton(text: string) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          className="h-8 w-8 grid place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          aria-label="Info"
        >
          <Info className="h-4 w-4" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content
        side="top"
        align="end"
        className="max-w-[260px] rounded-lg border bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        {text}
        <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

type PoTableHeaderProps = {
  label: string;
  column: PoSortColumn;
  sortBy: PoSortColumn;
  sortDir: 'asc' | 'desc';
  onSort: (column: PoSortColumn) => void;
};

function PoTableHeader({ label, column, sortBy, sortDir, onSort }: PoTableHeaderProps) {
  const isActive = sortBy === column;
  const arrow = !isActive ? '↕' : sortDir === 'asc' ? '▲' : '▼';
  return (
    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-gray-600 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
      >
        {label}
        <span className="text-gray-400">{arrow}</span>
      </button>
    </th>
  );
}

type OrdersAnalytics = {
  totalOrders: number;
  totalAmount: number;
  statusCounts: Record<PurchaseOrderStatus | 'Other', number>;
  departmentChartData: Array<{ label: string; value: number }>;
  urgentOrders: PurchaseOrderRecord[];
  urgentOverdueCount: number;
  urgentCompletedCount: number;
  urgentDepartmentChartData: Array<{ label: string; value: number }>;
  urgentStatusChartData: Array<{ name: string; value: number }>;
  closedOrders: PurchaseOrderRecord[];
  closedByMaterial: Array<{ material: string; orders: number; spend: number; avg: number }>;
  closedByVendor: Array<{ vendor: string; orders: number; spend: number; avg: number }>;
  machineTotals: Array<{ label: string; value: number }>;
  machineMap: Map<string, PurchaseOrderRecord[]>;
  monthlyHistory: Array<{ key: number; label: string; orders: number; spend: number }>;
  monthKpis: { orders: number; spend: number; delta: number };
  vendorDeliveryRows: Array<{ vendor: string; deliveries: number; onTimePct: number; avgDelay: number }>;
  deliveryOutcome: { onTime: number; delayed: number };
  vendorOnTimeChartData: Array<{ label: string; value: number }>;
  recentActivity: RecentActivityEntry[];
};

function toStatusKey(status?: PurchaseOrderStatus | null): PurchaseOrderStatus | 'Other' {
  if (status === 'Pending' || status === 'Approved' || status === 'Rejected' || status === 'OnHold') {
    return status;
  }
  return 'Other';
}

function computeOrdersAnalytics(orders: PurchaseOrderRecord[]): OrdersAnalytics {
  const statusCounts: Record<PurchaseOrderStatus | 'Other', number> = {
    Pending: 0,
    Approved: 0,
    Rejected: 0,
    OnHold: 0,
    Other: 0,
  };

  const departmentMap = new Map<string, number>();
  const urgentOrders: PurchaseOrderRecord[] = [];
  const urgentDepartmentMap = new Map<string, number>();
  const machineMap = new Map<string, PurchaseOrderRecord[]>();
  const closedOrders: PurchaseOrderRecord[] = [];
  const materialMap = new Map<string, { orders: number; spend: number }>();
  const vendorClosedMap = new Map<string, { orders: number; spend: number }>();
  const monthlyMap = new Map<number, { label: string; orders: number; spend: number }>();
  const vendorDeliveryMap = new Map<string, { deliveries: number; onTime: number; totalDelay: number }>();
  let onTimeDeliveries = 0;
  let delayedDeliveries = 0;
  let totalAmount = 0;

  const now = Date.now();

  for (const order of orders) {
    const statusKey = toStatusKey(order.status);
    statusCounts[statusKey] += 1;

    const amount = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
    totalAmount += amount;

    const departmentKey = normalizeKey(order.department);
    departmentMap.set(departmentKey, (departmentMap.get(departmentKey) || 0) + 1);

    const machineKey = departmentKey; // fallback to department when machine data is unavailable
    const machineBucket = machineMap.get(machineKey);
    if (machineBucket) {
      machineBucket.push(order);
    } else {
      machineMap.set(machineKey, [order]);
    }

    const poTime = getTime(order.poDate);
    if (poTime != null) {
      const monthKey = new Date(poTime);
      const composite = monthKey.getFullYear() * 100 + (monthKey.getMonth() + 1);
      const label = monthKey.toLocaleString('en', { month: 'short', year: '2-digit' });
      const entry = monthlyMap.get(composite) || { label, orders: 0, spend: 0 };
      entry.orders += 1;
      entry.spend += amount;
      monthlyMap.set(composite, entry);
    }

    const hasMissingPrice = order.items.some((item) => !item.unitPrice || Number(item.unitPrice) === 0);
    const overdue = isOverdue(order);
    if (order.status !== 'Approved' && (hasMissingPrice || overdue)) {
      urgentOrders.push(order);
      urgentDepartmentMap.set(departmentKey, (urgentDepartmentMap.get(departmentKey) || 0) + 1);
    }

    const isClosed = order.completion || order.status === 'Approved';
    if (isClosed) {
      closedOrders.push(order);

      order.items.forEach((item) => {
        const materialKey = normalizeKey(item.description || item.materialCode);
        const spend = typeof item.lineTotal === 'number'
          ? item.lineTotal
          : (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        const entry = materialMap.get(materialKey) || { orders: 0, spend: 0 };
        entry.orders += 1;
        entry.spend += spend;
        materialMap.set(materialKey, entry);
      });

      const vendorKey = normalizeKey(order.vendor);
      const vendorEntry = vendorClosedMap.get(vendorKey) || { orders: 0, spend: 0 };
      vendorEntry.orders += 1;
      vendorEntry.spend += amount;
      vendorClosedMap.set(vendorKey, vendorEntry);

      const vendorDelivery = vendorDeliveryMap.get(vendorKey) || { deliveries: 0, onTime: 0, totalDelay: 0 };
      vendorDelivery.deliveries += 1;
      if (poTime != null) {
        const delayDays = Math.max(0, Math.round((now - poTime - SLA_MS) / DAY_MS));
        vendorDelivery.totalDelay += delayDays;
        if (delayDays > 0) {
          delayedDeliveries += 1;
        } else {
          vendorDelivery.onTime += 1;
          onTimeDeliveries += 1;
        }
      } else {
        vendorDelivery.onTime += 1;
        onTimeDeliveries += 1;
      }
      vendorDeliveryMap.set(vendorKey, vendorDelivery);
    }
  }

  const urgentOverdueCount = urgentOrders.filter(isOverdue).length;
  const urgentCompletedCount = urgentOrders.filter((order) => order.completion || order.status === 'Approved').length;

  const departmentChartData = Array.from(departmentMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));

  const urgentDepartmentChartData = Array.from(urgentDepartmentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const urgentStatusChartData = [
    { name: 'Total Urgent', value: urgentOrders.length },
    { name: 'Over SLA', value: urgentOverdueCount },
    { name: 'Within SLA', value: Math.max(0, urgentOrders.length - urgentOverdueCount) },
    { name: 'Completed', value: urgentCompletedCount },
    { name: 'Pending', value: urgentOrders.length - urgentCompletedCount },
  ];

  const closedByMaterial = Array.from(materialMap.entries())
    .map(([material, stats]) => ({
      material,
      orders: stats.orders,
      spend: Math.round(stats.spend),
      avg: stats.orders ? stats.spend / stats.orders : 0,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  const closedByVendor = Array.from(vendorClosedMap.entries())
    .map(([vendor, stats]) => ({
      vendor,
      orders: stats.orders,
      spend: Math.round(stats.spend),
      avg: stats.orders ? stats.spend / stats.orders : 0,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  const machineTotals = Array.from(machineMap.entries())
    .map(([label, list]) => ({
      label,
      value: Math.round(list.reduce((sum, order) => sum + (order.totalAmount || 0), 0)),
    }))
    .sort((a, b) => b.value - a.value);

  const monthlyHistory = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([key, value]) => ({ key, ...value }))
    .slice(-12);

  const lastMonth = monthlyHistory[monthlyHistory.length - 1] || { orders: 0, spend: 0 };
  const prevMonth = monthlyHistory.length > 1 ? monthlyHistory[monthlyHistory.length - 2] : null;
  const monthKpis = {
    orders: lastMonth.orders || 0,
    spend: lastMonth.spend || 0,
    delta: prevMonth && prevMonth.orders ? (lastMonth.orders - prevMonth.orders) / prevMonth.orders : 0,
  };

  const vendorDeliveryRows = Array.from(vendorDeliveryMap.entries())
    .map(([vendor, stats]) => ({
      vendor,
      deliveries: stats.deliveries,
      onTimePct: stats.deliveries ? stats.onTime / stats.deliveries : 0,
      avgDelay: stats.deliveries ? stats.totalDelay / stats.deliveries : 0,
    }))
    .sort((a, b) => b.onTimePct - a.onTimePct);

  const vendorOnTimeChartData = vendorDeliveryRows
    .slice(0, 5)
    .map((row) => ({ label: row.vendor, value: Math.round(row.onTimePct * 100) }));

  const deliveryOutcome = { onTime: onTimeDeliveries, delayed: delayedDeliveries };

  const recentActivity = orders
    .slice()
    .sort((a, b) => (getTime(b.updatedAt ?? b.poDate) || 0) - (getTime(a.updatedAt ?? a.poDate) || 0))
    .slice(0, 8)
    .map((order) => {
      const statusKey = toStatusKey(order.status);
      const baseClass = 'h-4 w-4';
      let icon: React.ReactNode;
      switch (statusKey) {
        case 'Approved':
          icon = <ShieldCheck className={`${baseClass} text-emerald-500`} />;
          break;
        case 'Rejected':
          icon = <AlertTriangle className={`${baseClass} text-red-500`} />;
          break;
        case 'OnHold':
          icon = <Pause className={`${baseClass} text-amber-500`} />;
          break;
        case 'Pending':
          icon = <Timer className={`${baseClass} text-sky-500`} />;
          break;
        default:
          icon = <UserRound className={`${baseClass} text-purple-500`} />;
      }

      return {
        id: order.id,
        icon,
        title: `Purchase Order ${order.orderNo} ${formatPoStatusLabel(statusKey as PurchaseOrderStatus)}`,
        meta: `${normalizeKey(order.vendor)} • ${relativeTime(order.updatedAt ?? order.poDate)}`,
        actionLabel: 'View',
      } satisfies RecentActivityEntry;
    });

  return {
    totalOrders: orders.length,
    totalAmount,
    statusCounts,
    departmentChartData,
    urgentOrders,
    urgentOverdueCount,
    urgentCompletedCount,
    urgentDepartmentChartData,
    urgentStatusChartData,
    closedOrders,
    closedByMaterial,
    closedByVendor,
    machineTotals,
    machineMap,
    monthlyHistory,
    monthKpis,
    vendorDeliveryRows,
    deliveryOutcome,
    vendorOnTimeChartData,
    recentActivity,
  };
}

export default function Orders() {
  const purchaseOrders = usePurchaseOrders();
  const analytics = React.useMemo(() => computeOrdersAnalytics(purchaseOrders), [purchaseOrders]);
  const {
    totalOrders,
    totalAmount,
    statusCounts,
    departmentChartData,
    urgentOrders,
    urgentOverdueCount,
    urgentCompletedCount,
    urgentDepartmentChartData,
    urgentStatusChartData,
    closedOrders,
    closedByMaterial,
    closedByVendor,
    machineTotals,
    machineMap,
    monthlyHistory,
    monthKpis,
    vendorDeliveryRows,
    deliveryOutcome,
    vendorOnTimeChartData,
    recentActivity,
  } = analytics;

  const [poStatusFilter, setPoStatusFilter] = React.useState<'All' | PurchaseOrderStatus>('All');
  const [poSortBy, setPoSortBy] = React.useState<PoSortColumn>('poDate');
  const [poSortDir, setPoSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [busyStatusId, setBusyStatusId] = React.useState<string | null>(null);
  const [busyCompletionId, setBusyCompletionId] = React.useState<string | null>(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = React.useState<PurchaseOrderRecord | null>(null);
  const [machineFilter, setMachineFilter] = React.useState<string>('');
  const statusChartData = React.useMemo(
    () => STATUS_SEQUENCE.map((status) => ({
      name: status === 'Other' ? 'Other' : formatPoStatusLabel(status as PurchaseOrderStatus),
      value: statusCounts[status],
    })),
    [statusCounts],
  );

  const machineOptions = React.useMemo(() => {
    const keys = Array.from(machineMap.keys());
    keys.sort((a, b) => a.localeCompare(b));
    return keys;
  }, [machineMap]);

  React.useEffect(() => {
    if (!machineFilter && machineOptions.length) {
      setMachineFilter(machineOptions[0]);
    }
  }, [machineFilter, machineOptions]);

  const machineOrders = React.useMemo(() => {
    const activeKey = machineFilter || machineOptions[0];
    if (!activeKey) return [];
    return machineMap.get(activeKey) ?? [];
  }, [machineFilter, machineOptions, machineMap]);

  const deliveryOutcomeChartData = React.useMemo(
    () => [
      { name: 'On-Time', value: deliveryOutcome.onTime },
      { name: 'Delayed', value: deliveryOutcome.delayed },
    ],
    [deliveryOutcome],
  );

  const urgentOpenCount = React.useMemo(
    () => urgentOrders.filter((order) => !(order.completion || order.status === 'Approved')).length,
    [urgentOrders],
  );

  const urgentOnTimeRate = urgentOrders.length
    ? (urgentOrders.length - urgentOverdueCount) / urgentOrders.length
    : 0;

  const urgentDepartmentCount = React.useMemo(() => {
    if (!urgentOrders.length) return 0;
    return new Set(urgentOrders.map((order) => normalizeKey(order.department))).size;
  }, [urgentOrders]);

  const filteredPurchaseOrders = React.useMemo(() => {
    if (poStatusFilter === 'All') {
      return purchaseOrders.slice();
    }
    return purchaseOrders.filter((order) => order.status === poStatusFilter);
  }, [purchaseOrders, poStatusFilter]);

  const sortedPurchaseOrders = React.useMemo(() => {
    const rows = filteredPurchaseOrders.slice();
    const direction = poSortDir === 'asc' ? 1 : -1;
    const safeTime = (value: string) => {
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    rows.sort((a, b) => {
      switch (poSortBy) {
        case 'poDate':
          return (safeTime(a.poDate) - safeTime(b.poDate)) * direction;
        case 'totalAmount':
          return (a.totalAmount - b.totalAmount) * direction;
        case 'status':
          return formatPoStatusLabel(a.status).localeCompare(formatPoStatusLabel(b.status)) * direction;
        case 'requestNo':
          return (a.requestNo ?? '').localeCompare(b.requestNo ?? '') * direction;
        case 'orderNo':
          return a.orderNo.localeCompare(b.orderNo) * direction;
        case 'vendor':
          return (a.vendor ?? '').localeCompare(b.vendor ?? '') * direction;
        case 'department':
          return (a.department ?? '').localeCompare(b.department ?? '') * direction;
        default:
          return 0;
      }
    });
    return rows;
  }, [filteredPurchaseOrders, poSortBy, poSortDir]);

  const handlePoSort = (column: PoSortColumn) => {
    setPoSortDir((currentDir) => {
      if (poSortBy !== column) {
        return column === 'poDate' ? 'desc' : 'asc';
      }
      return currentDir === 'asc' ? 'desc' : 'asc';
    });
    setPoSortBy(column);
  };

  const handleStatusAction = async (order: PurchaseOrderRecord, nextStatus: PurchaseOrderStatus) => {
    if (order.status === nextStatus) return;
    setBusyStatusId(order.id);
    try {
      await setPurchaseOrderStatus(order.id, nextStatus);
      toast.success(`Status updated to ${formatPoStatusLabel(nextStatus)}`);
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to update status');
    } finally {
      setBusyStatusId(null);
    }
  };

  const handleCompletionToggle = async (order: PurchaseOrderRecord, nextValue: boolean) => {
    if (order.completion === nextValue) return;
    setBusyCompletionId(order.id);
    try {
      await setPurchaseOrderCompletion(order.id, nextValue);
      toast.success(nextValue ? 'Marked purchase order as finished' : 'Marked purchase order as unfinished');
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to update completion');
    } finally {
      setBusyCompletionId(null);
    }
  };

  const handleCloseDetails = React.useCallback(() => {
    setSelectedPurchaseOrder(null);
  }, []);

  return (
    <Tooltip.Provider delayDuration={120}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <PageHeader title="Orders" menuItems={menuItems} />

        {/* Block 1 — KPI + Charts */}
        <BaseCard title="Orders Overview" subtitle="Status KPIs and department performance">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            <StatCard
              label="Pending Orders"
              value={statusCounts.Pending}
              valueFormat="number"
              icon={<FolderOpen className="h-5 w-5 text-sky-500" />}
              delta={{ label: '4.2%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Approved Orders"
              value={statusCounts.Approved}
              valueFormat="number"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              delta={{ label: '1.5%', trend: 'down' }}
              className="h-full"
            />
            <StatCard
              label="On Hold"
              value={statusCounts.OnHold}
              valueFormat="number"
              icon={<Pause className="h-5 w-5 text-amber-500" />}
              delta={{ label: '2.9%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Rejected Orders"
              value={statusCounts.Rejected}
              valueFormat="number"
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              delta={{ label: '0.8%', trend: 'up' }}
              className="h-full"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <PieInsightCard
              title="Orders by Status"
              subtitle="Pending / Approved / On Hold / Rejected / Other"
              data={statusChartData}
              description="Distribution of purchase orders by lifecycle stage. Monitor this split to catch backlogs early."
              height={260}
            />

            <BarChartCard
              title="Purchase Orders by Department"
              subtitle="Departmental totals"
              data={departmentChartData}
              headerRight={infoButton('Shows which departments are generating the most purchase orders. Useful for capacity planning and prioritization.')}
              tooltipValueSuffix=" orders"
            />
          </div>
        </BaseCard>

        <BaseCard title="Purchase Orders" subtitle="Sortable table of all purchase orders">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <ListFilter className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-600 dark:text-gray-300">Quick Filters</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {totalOrders} total
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PO_STATUS_FILTERS.map((status) => {
                const active = poStatusFilter === status;
                const pill = active ? cardTheme.pill('positive') : cardTheme.pill('neutral');
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPoStatusFilter(status)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${active ? 'shadow-sm' : ''}`}
                    style={{ background: pill.bg, color: pill.text }}
                  >
                    {status === 'OnHold' ? 'On Hold' : status}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <PoTableHeader label="Request No" column="requestNo" sortBy={poSortBy} sortDir={poSortDir} onSort={handlePoSort} />
                  <PoTableHeader label="Order NO" column="orderNo" sortBy={poSortBy} sortDir={poSortDir} onSort={handlePoSort} />
                  <PoTableHeader label="Vendor" column="vendor" sortBy={poSortBy} sortDir={poSortDir} onSort={handlePoSort} />
                  <PoTableHeader label="Department" column="department" sortBy={poSortBy} sortDir={poSortDir} onSort={handlePoSort} />
                  <PoTableHeader label="PO Date" column="poDate" sortBy={poSortBy} sortDir={poSortDir} onSort={handlePoSort} />
                  <PoTableHeader
                    label="Total Amount (SAR)"
                    column="totalAmount"
                    sortBy={poSortBy}
                    sortDir={poSortDir}
                    onSort={handlePoSort}
                  />
                  <PoTableHeader label="Status" column="status" sortBy={poSortBy} sortDir={poSortDir} onSort={handlePoSort} />
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPurchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No purchase orders yet. Use "Send to PO" from RFQs to create one.
                    </td>
                  </tr>
                ) : (
                  sortedPurchaseOrders.map((order) => {
                    const rowCompleted = order.completion;
                    const statusBusy = busyStatusId === order.id;
                    const completionBusy = busyCompletionId === order.id;
                    return (
                      <tr
                        key={order.id}
                        className={`border-t text-center text-sm transition ${
                          rowCompleted
                            ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <td className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300">{order.requestNo || '—'}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPurchaseOrder(order)}
                            className="font-semibold text-sky-600 underline-offset-2 hover:underline"
                          >
                            {order.orderNo}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{order.vendor || '—'}</td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{order.department || '—'}</td>
                        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{formatDate(order.poDate)}</td>
                        <td className="px-3 py-3 font-semibold text-gray-900 dark:text-gray-100">{fmtSAR(order.totalAmount)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${poStatusBadgeClass(order.status)}`}>
                            {formatPoStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="inline-flex rounded-full border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
                            {PO_ACTION_CONTROLS.map(({ status, label, icon, tone }) => {
                              const active = order.status === status;
                              const buttonClass = `inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
                                active
                                  ? tone === 'emerald'
                                    ? 'bg-emerald-500 text-white'
                                    : tone === 'red'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-sky-500 text-white'
                                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                              } ${statusBusy ? 'cursor-not-allowed opacity-60' : ''}`;
                              return (
                                <Tooltip.Root key={status} delayDuration={120}>
                                  <Tooltip.Trigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusAction(order, status)}
                                      disabled={statusBusy}
                                      className={buttonClass}
                                      title={label}
                                      aria-label={label}
                                    >
                                      {icon}
                                    </button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content
                                    side="top"
                                    sideOffset={6}
                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                  >
                                    {label}
                                  </Tooltip.Content>
                                </Tooltip.Root>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                            checked={order.completion}
                            disabled={completionBusy}
                            onChange={(event) => handleCompletionToggle(order, event.target.checked)}
                            aria-label={`Mark ${order.orderNo} as completed`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </BaseCard>

        {/* Block 3 — Urgent Orders Overview */}
        <BaseCard title="Urgent Orders Overview" subtitle="High-priority orders and SLA tracking">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            <StatCard
              label="Open Urgent Orders"
              value={urgentOpenCount}
              valueFormat="number"
              icon={<Zap className="h-5 w-5 text-orange-500" />}
              delta={{ label: '3.4%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Closed Urgent Orders"
              value={urgentCompletedCount}
              valueFormat="number"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              delta={{ label: '1.1%', trend: 'down' }}
              className="h-full"
            />
            <StatCard
              label="On-Time Completion Rate"
              value={fmtPercent(urgentOnTimeRate, 0)}
              icon={<Gauge className="h-5 w-5 text-sky-500" />}
              delta={{ label: '2.2%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Urgent Orders / Department"
              value={`${fmtInt(urgentOrders.length)} / ${fmtInt(Math.max(urgentDepartmentCount, urgentOrders.length ? 1 : 0))}`}
              icon={<Building2 className="h-5 w-5 text-purple-500" />}
              className="h-full"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <PieInsightCard
              title="Orders by Status (Urgent Focus)"
              subtitle="Total / Over SLA / Within SLA / Completed / Pending"
              data={urgentStatusChartData}
              description="Highlights urgent orders by status so you can quickly spot unresolved or delayed critical work."
              height={260}
            />

            <BarChartCard
              title="Urgent Orders by Department"
              subtitle="Share or count by department"
              data={urgentDepartmentChartData}
              headerRight={infoButton('Ranks departments by urgent order load. Useful for fast-response staffing and escalation.')}
              tooltipValueSuffix=" urgent orders"
            />
          </div>
        </BaseCard>

        {/* Block 4 — Spend Analysis (Closed Orders only) */}
        <BaseCard title="Spend Analysis — Closed Orders" subtitle="Insights derived from closed orders only">
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap, alignItems: 'stretch' }}>
            <div className="flex flex-col h-full" style={{ gap: cardTheme.gap }}>
              <div className="rounded-2xl border p-4 flex flex-col h-full" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top 10 Materials</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Orders (#), total spend (SAR), avg price</div>
                  </div>
                  {infoButton('Top materials by total spend from closed orders only. Helps identify savings and consolidation opportunities.')}
                </div>
                <div className="mt-3 flex-1 overflow-hidden rounded-xl border" style={{ borderColor: cardTheme.border() }}>
                  <table className="min-w-full divide-y" style={{ borderColor: cardTheme.border() }}>
                    <thead className="text-[12px] uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ background: cardTheme.surface() }}>
                      <tr>
                        <th className="px-3 py-2 text-left">Material</th>
                        <th className="px-3 py-2 text-right">Orders (#)</th>
                        <th className="px-3 py-2 text-right">Total Spend</th>
                        <th className="px-3 py-2 text-right">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
                      {closedByMaterial.map((row) => (
                        <tr key={row.material} className="text-sm">
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.material}</td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{fmtInt(row.orders)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{fmtSAR(row.spend)}</td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{fmtSAR(Math.round(row.avg))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <BaseCard
                title="Top Materials by Spend (SAR)"
                subtitle="Closed order spend distribution"
                headerRight={infoButton('Top materials by total spend from closed orders only. Helps identify savings and consolidation opportunities.')}
                className="flex flex-col"
              >
                <div className="mt-3 h-[300px]">
                  <BarChart
                    data={closedByMaterial}
                    categoryKey="material"
                    series={[{ id: 'spend', valueKey: 'spend', name: 'Spend (SAR)' }]}
                    height={300}
                    appearance={{ grid: { left: 60, right: 24, bottom: 48 }, barWidth: '55%' }}
                  />
                </div>
              </BaseCard>
            </div>

            <div className="flex flex-col h-full" style={{ gap: cardTheme.gap }}>
              <div className="rounded-2xl border p-4 flex flex-col h-full" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top 10 Vendors</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Orders (#), total spend (SAR), avg order value</div>
                  </div>
                  {infoButton('Top vendors by total spend from closed orders. Useful for sourcing strategy and negotiations.')}
                </div>
                <div className="mt-3 flex-1 overflow-hidden rounded-xl border" style={{ borderColor: cardTheme.border() }}>
                  <table className="min-w-full divide-y" style={{ borderColor: cardTheme.border() }}>
                    <thead className="text-[12px] uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ background: cardTheme.surface() }}>
                      <tr>
                        <th className="px-3 py-2 text-left">Vendor</th>
                        <th className="px-3 py-2 text-right">Orders (#)</th>
                        <th className="px-3 py-2 text-right">Total Spend</th>
                        <th className="px-3 py-2 text-right">Avg Order Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
                      {closedByVendor.map((row) => (
                        <tr key={row.vendor} className="text-sm">
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.vendor}</td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{fmtInt(row.orders)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{fmtSAR(row.spend)}</td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{fmtSAR(Math.round(row.avg))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <BaseCard
                title="Top Vendors by Spend (SAR)"
                subtitle="Closed order spend distribution"
                headerRight={infoButton('Top vendors by total spend from closed orders. Useful for sourcing strategy and negotiations.')}
                className="flex flex-col"
              >
                <div className="mt-3 h-[300px]">
                  <BarChart
                    data={closedByVendor}
                    categoryKey="vendor"
                    series={[{ id: 'spend', valueKey: 'spend', name: 'Spend (SAR)' }]}
                    height={300}
                    appearance={{ grid: { left: 60, right: 24, bottom: 48 }, barWidth: '55%' }}
                  />
                </div>
              </BaseCard>
            </div>
          </div>
        </BaseCard>

        {/* Block 5 — Spend by Machine Category */}
        <BaseCard title="Spend by Machine Category" subtitle="Machine procurement cost and breach analysis">
          <div className="flex flex-wrap items-center gap-2">
            {machineOptions.map((machine) => {
              const active = machineFilter === machine;
              const pill = active ? cardTheme.pill('positive') : cardTheme.pill('neutral');
              return (
                <button
                  key={machine}
                  onClick={() => setMachineFilter(machine)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${active ? 'shadow-sm' : ''}`}
                  style={{ background: pill.bg, color: pill.text }}
                >
                  {machine}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col" style={{ gap: cardTheme.gap }}>
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: cardTheme.border() }}>
              <table className="min-w-full table-auto divide-y" style={{ borderColor: cardTheme.border() }}>
                <thead className="text-[12px] uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ background: cardTheme.surface() }}>
                  <tr>
                    <th className="px-4 py-3 text-left">Order No</th>
                    <th className="px-4 py-3 text-left">Material</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
                  {machineOrders.map((order) => {
                    const firstItem = order.items[0];
                    const materialLabel = firstItem?.description || firstItem?.materialCode || '—';
                    return (
                      <tr key={`${order.id}-machine`} className="text-sm transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{order.orderNo}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{materialLabel}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.vendor || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(order.poDate)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{fmtSAR(Math.round(order.totalAmount || 0))}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${poStatusBadgeClass(order.status)}`}>
                            {formatPoStatusLabel(order.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <BarChartCard
              title="Total Spend per Machine"
              subtitle="One bar per machine"
              data={machineTotals}
              height={300}
              valueFormat="sar"
              headerRight={infoButton('Compares total spend across machine categories. Use it to direct maintenance budgets.')}
            />
          </div>
        </BaseCard>

        {/* Block 6 — Monthly Trends & Delivery Performance */}
        <BaseCard title="Monthly Trends & Delivery Performance" subtitle="Monthly spend trends and vendor delivery metrics">
          <div className="flex flex-col" style={{ gap: cardTheme.gap }}>
            <div className="rounded-2xl border p-6" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly Trend Analysis</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Latest month stats vs prior period</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3" style={{ gap: cardTheme.gap }}>
                <div className="rounded-2xl border px-4 py-5" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Orders This Month</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{fmtInt(monthKpis.orders)}</div>
                </div>
                <div className="rounded-2xl border px-4 py-5" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Spend This Month</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{fmtSAR(monthKpis.spend)}</div>
                </div>
                <div className="rounded-2xl border px-4 py-5" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">% change vs last month</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{fmtPercent(monthKpis.delta, 1)}</div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Orders & Spend per Month</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">12-month trend</div>
                  </div>
                  {infoButton('Tracks order volume and spend over time. Useful for forecasting and seasonality analysis.')}
                </div>
                <div className="mt-4 h-[300px] flex flex-col overflow-hidden">
                  <ReactECharts
                    style={{ flex: 1, width: '100%' }}
                    option={{
                      tooltip: { trigger: 'axis' },
                      legend: { data: ['Orders', 'Spend'], bottom: 0 },
                      grid: { left: 42, right: 42, top: 24, bottom: 60, containLabel: true },
                      xAxis: { type: 'category', data: monthlyHistory.map((m) => m.label), axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                      yAxis: [
                        { type: 'value', name: 'Orders', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                        { type: 'value', name: 'Spend', position: 'right', splitLine: { show: false } },
                      ],
                      series: [
                        {
                          name: 'Orders',
                          type: 'bar',
                          data: monthlyHistory.map((m) => m.orders),
                          barWidth: 20,
                          itemStyle: { color: chartTheme.mkGradient(chartTheme.brandPrimary) },
                        },
                        {
                          name: 'Spend',
                          type: 'line',
                          yAxisIndex: 1,
                          data: monthlyHistory.map((m) => m.spend),
                          smooth: true,
                          lineStyle: { color: chartTheme.brandSecondary, width: 3 },
                          areaStyle: { color: chartTheme.mkGradient(chartTheme.brandSecondary) },
                        },
                      ],
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-6" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Delivery Performance</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Delivery outcomes for closed orders</div>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                <table className="min-w-full table-auto divide-y" style={{ borderColor: cardTheme.border() }}>
                  <thead className="text-[12px] uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ background: cardTheme.surface() }}>
                    <tr>
                      <th className="px-3 py-2 text-left">Vendor</th>
                      <th className="px-3 py-2 text-right">Deliveries</th>
                      <th className="px-3 py-2 text-right">On-Time %</th>
                      <th className="px-3 py-2 text-right">Avg Delay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
                    {vendorDeliveryRows.map((row) => (
                      <tr key={`vendor-delivery-${row.vendor}`} className="text-sm">
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.vendor}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{fmtInt(row.deliveries)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{fmtPercent(row.onTimePct, 0)}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{row.avgDelay.toFixed(1)} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2" style={{ gap: cardTheme.gap }}>
                <PieInsightCard
                  title="On-Time vs Delayed Deliveries"
                  subtitle="Delivery outcomes"
                  data={deliveryOutcomeChartData}
                  description="Split of on-time versus delayed deliveries for closed orders with known delivery dates."
                  headerRight={infoButton('Split of on-time vs delayed deliveries for closed orders with known delivery dates.')}
                  height={260}
                />
                <BarChartCard
                  title="Vendors by On-Time %"
                  subtitle="Mini comparison"
                  data={vendorOnTimeChartData}
                  headerRight={infoButton('Compares top vendors by punctuality. Useful for performance reviews and SLAs.')}
                  axisValueSuffix="%"
                  tooltipValueSuffix="%"
                  height={300}
                />
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Block 7 — Recent Activity & Tasks */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BaseCard title="Recent Activity" subtitle="Latest order updates and approvals">
            <RecentActivityFeed items={recentActivity} />
          </BaseCard>
          <RequestsTasksCard className="h-full" />
        </div>

        <PurchaseOrderDetailsModal order={selectedPurchaseOrder} onClose={handleCloseDetails} />
      </div>
    </Tooltip.Provider>
  );
}

type PurchaseOrderDetailsModalProps = {
  order: PurchaseOrderRecord | null;
  onClose: () => void;
};

function PurchaseOrderDetailsModal({ order, onClose }: PurchaseOrderDetailsModalProps) {
  React.useEffect(() => {
    if (!order) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const totalFromItems = Math.round(order.items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;

  const formatQuantity = (value: number) => {
    try {
      return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
    } catch {
      return String(value);
    }
  };

  const formatCurrency = (value: number) => {
    try {
      return `${new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} SAR`;
    } catch {
      return `${value} SAR`;
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 px-4"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className="max-h-[90vh] w-[min(860px,100%)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Purchase Order {order.orderNo}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Request {order.requestNo}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 p-1.5 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close purchase order details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Vendor" value={order.vendor || '—'} />
            <DetailField label="Department" value={order.department || '—'} />
            <DetailField label="PO Date" value={formatDate(order.poDate)} />
            <DetailField
              label="Status"
              value={(
                <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${poStatusBadgeClass(order.status)}`}>
                  {formatPoStatusLabel(order.status)}
                </span>
              )}
            />
            <DetailField label="Total Amount" value={formatCurrency(totalFromItems)} />
            <DetailField label="Completion" value={order.completion ? 'Finished' : 'In Progress'} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Material Code</th>
                  <th className="px-3 py-2 text-left">Material Description</th>
                  <th className="px-3 py-2 text-center">Quantity</th>
                  <th className="px-3 py-2 text-center">Unit</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No items attached to this purchase order yet.
                    </td>
                  </tr>
                ) : (
                  order.items.map((item) => (
                    <tr key={item.id} className="border-t text-sm text-gray-700 dark:text-gray-300">
                      <td className="px-3 py-2">{item.materialCode || '—'}</td>
                      <td className="px-3 py-2">{item.description || '—'}</td>
                      <td className="px-3 py-2 text-center">{formatQuantity(item.quantity)}</td>
                      <td className="px-3 py-2 text-center">{item.unit || '—'}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-right font-semibold">Total</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalFromItems)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

type DetailFieldProps = {
  label: string;
  value: React.ReactNode;
};

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}
