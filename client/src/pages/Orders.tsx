import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import PageHeader from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import KPICard from '../components/ui/KPICard';
import cardTheme from '../styles/cardTheme';
import chartTheme from '../styles/chartTheme';
import RecentActivityBlock, { RecentActivityItem } from '../components/dashboard/RecentActivityBlock';
import {
  Plus,
  Upload,
  PackagePlus,
  Users,
  FileText as FileTextIcon,
  Info,
  FolderOpen,
  Lock,
  Timer,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Gauge,
  Building2,
  BarChart3,
  ListFilter,
  MoreHorizontal,
  Truck,
  AlertTriangle,
  UserRound,
} from 'lucide-react';

const menuItems = [
  { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" /> },
  { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" /> },
  { key: 'import-materials', label: 'Import Materials', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" /> },
  { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-payment-request', label: 'New Payment Request', icon: <FileTextIcon className="w-4.5 h-4.5" /> },
];

type OrderStatus = 'Open' | 'Closed' | 'In Progress' | 'Pending Approval';
type Order = {
  orderNo: string;
  requestNo: string;
  vendor: string;
  department: string;
  machine: string;
  material: string;
  date: string;
  amount: number;
  status: OrderStatus;
  urgent: boolean;
  delivery?: { onTime: boolean; delayDays: number };
};

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

const statusOrder: OrderStatus[] = ['Open', 'In Progress', 'Pending Approval', 'Closed'];

function statusPill(status: OrderStatus) {
  if (status === 'Open') return cardTheme.pill('positive');
  if (status === 'Closed') return cardTheme.pill('neutral');
  if (status === 'In Progress') return { bg: '#EFF6FF', text: '#1D4ED8' };
  return { bg: '#FEF3C7', text: '#B45309' };
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

function useOrdersDataset() {
  return React.useMemo<Order[]>(() => [
    { orderNo: 'PO-2024-001', requestNo: 'REQ-540', vendor: 'Gulf Packaging', department: 'Production', machine: 'Krones', material: 'PET Bottles', date: '2024-03-04', amount: 185000, status: 'Open', urgent: true },
    { orderNo: 'PO-2024-002', requestNo: 'REQ-541', vendor: 'Arabian Industrial', department: 'Maintenance', machine: 'SMI', material: 'Conveyor Belts', date: '2024-02-18', amount: 98000, status: 'In Progress', urgent: false },
    { orderNo: 'PO-2024-003', requestNo: 'REQ-544', vendor: 'Future Plastics', department: 'Logistics', machine: 'Tetra Pak', material: 'Shrink Wrap Film', date: '2024-01-28', amount: 42000, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
    { orderNo: 'PO-2024-004', requestNo: 'REQ-548', vendor: 'Eastern Bearings', department: 'Maintenance', machine: 'Husky', material: 'Bearing Kits', date: '2024-03-11', amount: 26500, status: 'Pending Approval', urgent: true },
    { orderNo: 'PO-2024-005', requestNo: 'REQ-553', vendor: 'Delta Automation', department: 'Engineering', machine: 'Krones', material: 'PLC Controllers', date: '2024-02-02', amount: 137500, status: 'Closed', urgent: false, delivery: { onTime: false, delayDays: 5 } },
    { orderNo: 'PO-2024-006', requestNo: 'REQ-559', vendor: 'Unified Steel', department: 'Production', machine: 'SMI', material: 'Support Frames', date: '2024-03-15', amount: 225000, status: 'In Progress', urgent: true },
    { orderNo: 'PO-2024-007', requestNo: 'REQ-563', vendor: 'Prime Fluids', department: 'Utilities', machine: 'Tetra Pak', material: 'Food Grade Lubricants', date: '2024-01-19', amount: 35500, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
    { orderNo: 'PO-2024-008', requestNo: 'REQ-567', vendor: 'Vertex Robotics', department: 'Engineering', machine: 'Krones', material: 'Robotics Spares', date: '2023-12-28', amount: 168000, status: 'Closed', urgent: true, delivery: { onTime: false, delayDays: 3 } },
    { orderNo: 'PO-2024-009', requestNo: 'REQ-572', vendor: 'Corepack', department: 'Logistics', machine: 'SMI', material: 'Stretch Film', date: '2024-02-24', amount: 68500, status: 'Open', urgent: false },
    { orderNo: 'PO-2024-010', requestNo: 'REQ-576', vendor: 'Atlas Cooling', department: 'Utilities', machine: 'Husky', material: 'Cooling Units', date: '2024-01-07', amount: 112000, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
    { orderNo: 'PO-2024-011', requestNo: 'REQ-580', vendor: 'Nova Chemicals', department: 'Production', machine: 'Tetra Pak', material: 'Cleaning Agents', date: '2024-03-09', amount: 26800, status: 'Pending Approval', urgent: false },
    { orderNo: 'PO-2024-012', requestNo: 'REQ-585', vendor: 'Lean Supplies', department: 'Quality', machine: 'SMI', material: 'Inspection Cameras', date: '2024-02-12', amount: 74500, status: 'Closed', urgent: true, delivery: { onTime: false, delayDays: 2 } },
    { orderNo: 'PO-2024-013', requestNo: 'REQ-589', vendor: 'Signal Safety', department: 'HSE', machine: 'Krones', material: 'Safety Sensors', date: '2024-03-01', amount: 18900, status: 'In Progress', urgent: true },
    { orderNo: 'PO-2024-014', requestNo: 'REQ-593', vendor: 'Vertex Robotics', department: 'Engineering', machine: 'Sidel', material: 'Pick-and-Place Arms', date: '2023-11-22', amount: 154000, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
    { orderNo: 'PO-2024-015', requestNo: 'REQ-595', vendor: 'Gulf Packaging', department: 'Production', machine: 'Krones', material: 'Bottle Caps', date: '2024-02-26', amount: 92000, status: 'Open', urgent: false },
    { orderNo: 'PO-2024-016', requestNo: 'REQ-599', vendor: 'Eastern Bearings', department: 'Maintenance', machine: 'Husky', material: 'Hydraulic Pumps', date: '2024-01-17', amount: 76000, status: 'Closed', urgent: true, delivery: { onTime: false, delayDays: 4 } },
    { orderNo: 'PO-2024-017', requestNo: 'REQ-602', vendor: 'Prime Fluids', department: 'Utilities', machine: 'Tetra Pak', material: 'Seals & Gaskets', date: '2024-03-12', amount: 31800, status: 'Pending Approval', urgent: false },
    { orderNo: 'PO-2024-018', requestNo: 'REQ-605', vendor: 'Delta Automation', department: 'Engineering', machine: 'Sidel', material: 'Servo Drives', date: '2023-12-15', amount: 142500, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
    { orderNo: 'PO-2024-019', requestNo: 'REQ-607', vendor: 'Nova Chemicals', department: 'Production', machine: 'SMI', material: 'Adhesives', date: '2024-03-14', amount: 41500, status: 'Open', urgent: false },
    { orderNo: 'PO-2024-020', requestNo: 'REQ-610', vendor: 'Unified Steel', department: 'Production', machine: 'Krones', material: 'Frame Fabrication', date: '2024-01-30', amount: 132000, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
    { orderNo: 'PO-2024-021', requestNo: 'REQ-614', vendor: 'Gulf Packaging', department: 'Logistics', machine: 'Sidel', material: 'Pallet Wrap', date: '2024-02-09', amount: 58500, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
    { orderNo: 'PO-2024-022', requestNo: 'REQ-617', vendor: 'Signal Safety', department: 'HSE', machine: 'SMI', material: 'Alarm Systems', date: '2024-03-05', amount: 48800, status: 'In Progress', urgent: true },
    { orderNo: 'PO-2024-023', requestNo: 'REQ-621', vendor: 'Atlas Cooling', department: 'Utilities', machine: 'Husky', material: 'Chiller Retrofit', date: '2023-12-04', amount: 196000, status: 'Closed', urgent: true, delivery: { onTime: false, delayDays: 6 } },
    { orderNo: 'PO-2024-024', requestNo: 'REQ-625', vendor: 'Lean Supplies', department: 'Quality', machine: 'Sidel', material: 'Vision Sensors', date: '2024-02-21', amount: 86400, status: 'Pending Approval', urgent: false },
    { orderNo: 'PO-2024-025', requestNo: 'REQ-629', vendor: 'Bright Components', department: 'Engineering', machine: 'Bosch', material: 'Sensor Modules', date: '2024-01-25', amount: 99000, status: 'Closed', urgent: false, delivery: { onTime: true, delayDays: 0 } },
  ], []);
}

const activityItems: RecentActivityItem[] = [
  { id: 'act-1', category: 'Approvals', icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, title: 'Purchase Order PO-2024-011 approved', meta: 'Sara Khalid • 2h ago', actionLabel: 'View' },
  { id: 'act-2', category: 'Closures', icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />, title: 'Order PO-2024-010 closed successfully', meta: 'Faisal Mutairi • 5h ago', actionLabel: 'Details' },
  { id: 'act-3', category: 'Urgent', icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, title: 'Urgent flag added to PO-2024-006', meta: 'Maintenance Desk • 7h ago', actionLabel: 'Respond' },
  { id: 'act-4', category: 'Vendors', icon: <Truck className="h-4 w-4 text-sky-500" />, title: 'Vertex Robotics sent updated invoice', meta: 'Uploaded by Imran • 1d ago', actionLabel: 'Open' },
  { id: 'act-5', category: 'Approvals', icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, title: 'Approval reminder: PO-2024-024', meta: 'Auto reminder • 1d ago', actionLabel: 'Review' },
  { id: 'act-6', category: 'Closures', icon: <FileTextIcon className="h-4 w-4 text-indigo-500" />, title: 'Closure report added for PO-2024-023', meta: 'Logistics Ops • 2d ago', actionLabel: 'Download' },
  { id: 'act-7', category: 'Urgent', icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, title: 'Expedite request from Production', meta: 'Khaled • 2d ago', actionLabel: 'Follow up' },
  { id: 'act-8', category: 'Vendors', icon: <UserRound className="h-4 w-4 text-purple-500" />, title: 'New vendor contact uploaded: Nova Chemicals', meta: 'Maha Abbas • 3d ago', actionLabel: 'View' },
];

export default function Orders() {
  const orders = useOrdersDataset();
  const [statusFilter, setStatusFilter] = React.useState<'All' | OrderStatus>('All');
  const [sortBy, setSortBy] = React.useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(0);
  const pageSize = 6;
  const [machineFilter, setMachineFilter] = React.useState<string>('');
  const statusCounts = React.useMemo(() => {
    const base: Record<OrderStatus, number> = { Open: 0, Closed: 0, 'In Progress': 0, 'Pending Approval': 0 };
    for (const order of orders) base[order.status] += 1;
    return base;
  }, [orders]);

  const urgentOrders = React.useMemo(() => orders.filter((o) => o.urgent), [orders]);
  const closedOrders = React.useMemo(() => orders.filter((o) => o.status === 'Closed'), [orders]);

  const departmentTotals = React.useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      map.set(o.department, (map.get(o.department) || 0) + 1);
    });
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return { labels: entries.map(([dept]) => dept), values: entries.map(([, count]) => count) };
  }, [orders]);

  const statusChart = React.useMemo(() => {
    return statusOrder.map((status) => ({ name: status, value: statusCounts[status] }));
  }, [statusCounts]);

  const urgentStatusCounts = React.useMemo(() => {
    const base: Record<'Urgent' | OrderStatus, number> = { Urgent: urgentOrders.length, Open: 0, Closed: 0, 'In Progress': 0, 'Pending Approval': 0 };
    urgentOrders.forEach((o) => { base[o.status] += 1; });
    return base;
  }, [urgentOrders]);

  const urgentDepartmentTotals = React.useMemo(() => {
    const map = new Map<string, number>();
    urgentOrders.forEach((o) => {
      map.set(o.department, (map.get(o.department) || 0) + 1);
    });
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return { labels: entries.map(([dept]) => dept), values: entries.map(([, count]) => count) };
  }, [urgentOrders]);

  const closedByMaterial = React.useMemo(() => {
    const map = new Map<string, { orders: number; spend: number }>();
    closedOrders.forEach((o) => {
      const entry = map.get(o.material) || { orders: 0, spend: 0 };
      entry.orders += 1;
      entry.spend += o.amount;
      map.set(o.material, entry);
    });
    const rows = Array.from(map.entries()).map(([material, stats]) => ({
      material,
      orders: stats.orders,
      spend: stats.spend,
      avg: stats.spend / stats.orders,
    }));
    rows.sort((a, b) => b.spend - a.spend);
    return rows.slice(0, 10);
  }, [closedOrders]);

  const closedByVendor = React.useMemo(() => {
    const map = new Map<string, { orders: number; spend: number }>();
    closedOrders.forEach((o) => {
      const entry = map.get(o.vendor) || { orders: 0, spend: 0 };
      entry.orders += 1;
      entry.spend += o.amount;
      map.set(o.vendor, entry);
    });
    const rows = Array.from(map.entries()).map(([vendor, stats]) => ({
      vendor,
      orders: stats.orders,
      spend: stats.spend,
      avg: stats.spend / stats.orders,
    }));
    rows.sort((a, b) => b.spend - a.spend);
    return rows.slice(0, 10);
  }, [closedOrders]);

  const machineOptions = React.useMemo(() => {
    const unique = Array.from(new Set(orders.map((o) => o.machine)));
    unique.sort();
    return unique;
  }, [orders]);

  React.useEffect(() => {
    if (!machineFilter && machineOptions.length) {
      setMachineFilter(machineOptions[0]);
    }
  }, [machineFilter, machineOptions]);

  const machineTotals = React.useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      map.set(o.machine, (map.get(o.machine) || 0) + o.amount);
    });
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return { labels: entries.map(([machine]) => machine), values: entries.map(([, spend]) => spend) };
  }, [orders]);

  const machineOrders = React.useMemo(() => {
    return orders.filter((o) => (machineFilter ? o.machine === machineFilter : true));
  }, [orders, machineFilter]);

  const deliveries = React.useMemo(() => closedOrders.filter((o) => o.delivery), [closedOrders]);
  const onTimeCount = deliveries.filter((d) => d.delivery!.onTime).length;
  const delayedCount = deliveries.length - onTimeCount;

  const vendorDelivery = React.useMemo(() => {
    const map = new Map<string, { deliveries: number; onTime: number; totalDelay: number }>();
    deliveries.forEach((d) => {
      const entry = map.get(d.vendor) || { deliveries: 0, onTime: 0, totalDelay: 0 };
      entry.deliveries += 1;
      if (d.delivery?.onTime) entry.onTime += 1;
      entry.totalDelay += d.delivery?.delayDays || 0;
      map.set(d.vendor, entry);
    });
    const rows = Array.from(map.entries()).map(([vendor, stats]) => ({
      vendor,
      deliveries: stats.deliveries,
      onTimePct: stats.deliveries ? stats.onTime / stats.deliveries : 0,
      avgDelay: stats.deliveries ? stats.totalDelay / stats.deliveries : 0,
    }));
    rows.sort((a, b) => b.onTimePct - a.onTimePct);
    return rows.slice(0, 5);
  }, [deliveries]);

  const monthlyHistory = React.useMemo(() => (
    [
      { label: 'May 23', orders: 118, spend: 380000 },
      { label: 'Jun 23', orders: 124, spend: 402000 },
      { label: 'Jul 23', orders: 132, spend: 428000 },
      { label: 'Aug 23', orders: 141, spend: 439500 },
      { label: 'Sep 23', orders: 138, spend: 447200 },
      { label: 'Oct 23', orders: 149, spend: 461000 },
      { label: 'Nov 23', orders: 153, spend: 472400 },
      { label: 'Dec 23', orders: 162, spend: 498000 },
      { label: 'Jan 24', orders: 158, spend: 486500 },
      { label: 'Feb 24', orders: 171, spend: 522000 },
      { label: 'Mar 24', orders: 176, spend: 534500 },
      { label: 'Apr 24', orders: 182, spend: 548200 },
    ]
  ), []);

  const monthKpis = React.useMemo(() => {
    const current = monthlyHistory[monthlyHistory.length - 1];
    const previous = monthlyHistory[monthlyHistory.length - 2];
    return {
      orders: current.orders,
      spend: current.spend,
      delta: previous ? (current.orders - previous.orders) / previous.orders : 0,
    };
  }, [monthlyHistory]);

  const filteredOrders = React.useMemo(() => {
    let rows = orders.slice();
    if (statusFilter !== 'All') {
      rows = rows.filter((o) => o.status === statusFilter);
    }
    rows.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      }
      return (a.amount - b.amount) * dir;
    });
    return rows;
  }, [orders, statusFilter, sortBy, sortDir]);

  const paginatedOrders = React.useMemo(() => {
    const start = page * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  React.useEffect(() => {
    setPage(0);
  }, [statusFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const chartCardClass = 'h-[300px] flex flex-col';

  return (
    <Tooltip.Provider delayDuration={120}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <PageHeader title="Orders" menuItems={menuItems} />

        {/* Block 1 — KPI + Charts */}
        <BaseCard title="Orders Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            <KPICard label="Open Orders" value={fmtInt(statusCounts.Open)} delta={{ pct: '4.2%', trend: 'up' }} icon={<FolderOpen className="h-5 w-5 text-sky-500" />} />
            <KPICard label="Closed Orders" value={fmtInt(statusCounts.Closed)} delta={{ pct: '1.5%', trend: 'down' }} icon={<Lock className="h-5 w-5 text-slate-500" />} />
            <KPICard label="In Progress" value={fmtInt(statusCounts['In Progress'])} delta={{ pct: '2.9%', trend: 'up' }} icon={<Timer className="h-5 w-5 text-amber-500" />} />
            <KPICard label="Pending Approval" value={fmtInt(statusCounts['Pending Approval'])} delta={{ pct: '0.8%', trend: 'up' }} icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />} />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <BaseCard
              title="Purchase Orders by Department"
              subtitle="Departmental totals"
              headerRight={infoButton('Shows which departments are generating the most purchase orders. Useful for capacity planning and prioritization.')}
              className={chartCardClass}
            >
              <ReactECharts
                style={{ height: '100%' }}
                option={{
                  grid: { left: 36, right: 16, top: 36, bottom: 32, containLabel: true },
                  tooltip: { trigger: 'axis' },
                  xAxis: {
                    type: 'category',
                    data: departmentTotals.labels,
                    axisLine: { lineStyle: { color: chartTheme.neutralGrid() } },
                    axisTick: { alignWithLabel: true },
                    axisLabel: { interval: 0, formatter: (value: string) => value },
                  },
                  yAxis: {
                    type: 'value',
                    splitLine: { lineStyle: { color: chartTheme.neutralGrid() } },
                  },
                  series: [
                    {
                      name: 'Orders',
                      type: 'bar',
                      data: departmentTotals.values,
                      barWidth: 26,
                      itemStyle: {
                        color: chartTheme.mkGradient(chartTheme.brandPrimary),
                        borderRadius: [10, 10, 0, 0],
                      },
                    },
                  ],
                }}
              />
            </BaseCard>

            <BaseCard
              title="Orders by Status"
              subtitle="Open / Closed / In Progress / Pending Approval"
              headerRight={infoButton('Overall status distribution of all orders. Use it to monitor flow and backlog at a glance.')}
              className={chartCardClass}
            >
              <ReactECharts
                style={{ height: '100%' }}
                option={{
                  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                  legend: { show: false },
                  color: [chartTheme.brandPrimary, chartTheme.brandSecondary, '#F59E0B', '#22C55E'],
                  series: [
                    {
                      type: 'pie',
                      radius: ['45%', '70%'],
                      labelLine: { length: 16, length2: 12 },
                      label: { formatter: '{b}\n{c}', color: cardTheme.muted() },
                      data: statusChart,
                    },
                  ],
                }}
              />
            </BaseCard>
          </div>
        </BaseCard>

        {/* Block 2 — Purchase Orders Table */}
        <BaseCard title="Purchase Orders">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Quick Filters</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['All', ...statusOrder] as const).map((status) => {
                const active = statusFilter === status;
                const pill = active ? cardTheme.pill('positive') : cardTheme.pill('neutral');
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${active ? 'shadow-sm' : ''}`}
                    style={{ background: pill.bg, color: pill.text }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: cardTheme.border() }}>
            <div className="max-h-[420px] overflow-auto">
              <table className="min-w-full divide-y" style={{ borderColor: cardTheme.border() }}>
                <thead className="sticky top-0 z-10" style={{ background: cardTheme.surface() }}>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Order No</th>
                    <th className="px-4 py-3">Request No</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => {
                      setSortBy('date');
                      setSortDir((dir) => (sortBy === 'date' ? (dir === 'asc' ? 'desc' : 'asc') : 'desc'));
                    }}>
                      <div className="flex items-center gap-2">Date <BarChart3 className="h-3.5 w-3.5" /></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => {
                      setSortBy('amount');
                      setSortDir((dir) => (sortBy === 'amount' ? (dir === 'asc' ? 'desc' : 'asc') : 'desc'));
                    }}>
                      <div className="flex items-center gap-2">Amount <BarChart3 className="h-3.5 w-3.5" /></div>
                    </th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
                  {paginatedOrders.map((order) => {
                    const pill = statusPill(order.status);
                    return (
                      <tr
                        key={order.orderNo}
                        className="cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        onClick={() => console.log('Open order details', order.orderNo)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{order.requestNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{order.vendor}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(order.date)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{fmtSAR(order.amount)}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ background: pill.bg, color: pill.text }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={(event) => {
                              event.stopPropagation();
                              console.log('Action menu for', order.orderNo);
                            }}
                          >
                            Quick Actions
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span>
              Showing {paginatedOrders.length} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-3">
              <button
                className="rounded-full border px-3 py-1 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                className="rounded-full border px-3 py-1 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        </BaseCard>

        {/* Block 3 — Urgent Orders Overview */}
        <BaseCard title="Urgent Orders Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            <KPICard label="Open Urgent Orders" value={fmtInt(urgentOrders.filter((o) => o.status === 'Open').length)} delta={{ pct: '3.4%', trend: 'up' }} icon={<Zap className="h-5 w-5 text-orange-500" />} />
            <KPICard label="Closed Urgent Orders" value={fmtInt(urgentOrders.filter((o) => o.status === 'Closed').length)} delta={{ pct: '1.1%', trend: 'down' }} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
            <KPICard label="On-Time Completion Rate" value={fmtPercent(urgentOrders.filter((o) => o.delivery?.onTime).length / Math.max(1, urgentOrders.filter((o) => o.status === 'Closed').length), 0)} delta={{ pct: '2.2%', trend: 'up' }} icon={<Gauge className="h-5 w-5 text-sky-500" />} />
            <KPICard label="Urgent Orders / Department" value={`${fmtInt(urgentOrders.length)} / ${fmtInt(new Set(urgentOrders.map((o) => o.department)).size || 1)}`} icon={<Building2 className="h-5 w-5 text-purple-500" />} />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <BaseCard
              title="Orders by Status (Urgent Focus)"
              subtitle="Urgent vs Open vs Closed"
              headerRight={infoButton('Highlights urgent orders’ status so you can spot unresolved or delayed critical work quickly.')}
              className={chartCardClass}
            >
              <ReactECharts
                style={{ height: '100%' }}
                option={{
                  tooltip: { trigger: 'item', formatter: '{b}: {c}' },
                  legend: { show: false },
                  color: ['#F97316', '#3B82F6', '#10B981', '#F59E0B'],
                  series: [
                    {
                      name: 'Urgent Status',
                      type: 'pie',
                      roseType: 'radius',
                      radius: ['30%', '70%'],
                      label: { formatter: '{b}\n{c}', color: cardTheme.muted() },
                      data: [
                        { name: 'Urgent Total', value: urgentStatusCounts.Urgent },
                        { name: 'Open', value: urgentStatusCounts.Open },
                        { name: 'Closed', value: urgentStatusCounts.Closed },
                        { name: 'In Progress', value: urgentStatusCounts['In Progress'] },
                      ],
                    },
                  ],
                }}
              />
            </BaseCard>

            <BaseCard
              title="Urgent Orders by Department"
              subtitle="Share or count by dept"
              headerRight={infoButton('Ranks departments by urgent order load. Useful for fast-response staffing and escalation.')}
              className={chartCardClass}
            >
              <ReactECharts
                style={{ height: '100%' }}
                option={{
                  grid: { left: 42, right: 18, top: 36, bottom: 32, containLabel: true },
                  tooltip: { trigger: 'axis' },
                  xAxis: { type: 'category', data: urgentDepartmentTotals.labels, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                  yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                  series: [
                    {
                      type: 'bar',
                      data: urgentDepartmentTotals.values,
                      barWidth: 30,
                      itemStyle: { color: chartTheme.mkGradient('#F97316'), borderRadius: [10, 10, 0, 0] },
                    },
                  ],
                }}
              />
            </BaseCard>
          </div>
        </BaseCard>

        {/* Block 4 — Spend Analysis (Closed Orders only) */}
        <BaseCard title="Spend Analysis — Closed Orders" subtitle="Insights derived from closed orders only">
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <div className="flex flex-col" style={{ gap: cardTheme.gap }}>
              <div className="rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top 10 Materials</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Orders (#), total spend (SAR), avg price</div>
                  </div>
                  {infoButton('Top materials by total spend from closed orders only. Helps identify savings and consolidation opportunities.')}
                </div>
                <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: cardTheme.border() }}>
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
                className="h-[300px] flex flex-col"
              >
                <ReactECharts
                  style={{ flex: 1 }}
                  option={{
                    grid: { left: 110, right: 18, top: 12, bottom: 12, containLabel: true },
                    tooltip: { trigger: 'axis', valueFormatter: (value: number) => fmtSAR(value) },
                    xAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                    yAxis: { type: 'category', data: closedByMaterial.map((row) => row.material), axisTick: { show: false } },
                    series: [
                      {
                        type: 'bar',
                        barWidth: 14,
                        data: closedByMaterial.map((row) => row.spend),
                        itemStyle: { color: chartTheme.mkGradient(chartTheme.brandSecondary), borderRadius: [0, 12, 12, 0] },
                      },
                    ],
                  }}
                />
              </BaseCard>
            </div>

            <div className="flex flex-col" style={{ gap: cardTheme.gap }}>
              <div className="rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top 10 Vendors</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Orders (#), total spend (SAR), avg order value</div>
                  </div>
                  {infoButton('Top vendors by total spend from closed orders. Useful for sourcing strategy and negotiations.')}
                </div>
                <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: cardTheme.border() }}>
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
                className="h-[300px] flex flex-col"
              >
                <ReactECharts
                  style={{ flex: 1 }}
                  option={{
                    grid: { left: 110, right: 18, top: 12, bottom: 12, containLabel: true },
                    tooltip: { trigger: 'axis', valueFormatter: (value: number) => fmtSAR(value) },
                    xAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                    yAxis: { type: 'category', data: closedByVendor.map((row) => row.vendor), axisTick: { show: false } },
                    series: [
                      {
                        type: 'bar',
                        barWidth: 14,
                        data: closedByVendor.map((row) => row.spend),
                        itemStyle: { color: chartTheme.mkGradient(chartTheme.accentTeal), borderRadius: [0, 12, 12, 0] },
                      },
                    ],
                  }}
                />
              </BaseCard>
            </div>
          </div>
        </BaseCard>

        {/* Block 5 — Spend by Machine Category */}
        <BaseCard title="Spend by Machine Category">
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
                    const pill = statusPill(order.status);
                    return (
                      <tr key={`${order.orderNo}-machine`} className="text-sm transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{order.orderNo}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.material}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.vendor}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(order.date)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{fmtSAR(order.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: pill.bg, color: pill.text }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <BaseCard
              title="Total Spend per Machine"
              subtitle="One bar per machine"
              headerRight={infoButton('Compares total spend across machine categories. Use it to direct maintenance budgets.')}
              className="h-[340px] flex flex-col"
            >
              <ReactECharts
                style={{ flex: 1 }}
                option={{
                  grid: { left: 42, right: 18, top: 36, bottom: 32, containLabel: true },
                  tooltip: { trigger: 'axis', valueFormatter: (value: number) => fmtSAR(value) },
                  xAxis: { type: 'category', data: machineTotals.labels, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                  yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                  series: [
                    {
                      type: 'bar',
                      data: machineTotals.values,
                      barWidth: 40,
                      itemStyle: { color: chartTheme.mkGradient(chartTheme.brandPrimary), borderRadius: [14, 14, 0, 0] },
                    },
                  ],
                }}
              />
            </BaseCard>
          </div>
        </BaseCard>

        {/* Block 6 — Monthly Trends & Delivery Performance */}
        <BaseCard title="Monthly Trends & Delivery Performance">
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
                <div className="h-[280px]">
                  <ReactECharts
                    style={{ height: '100%' }}
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
                          areaStyle: { color: chartTheme.mkGradient(chartTheme.brandSecondary, 0.25, 0.05) },
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
                    {vendorDelivery.map((row) => (
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
                <div className="rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">On-Time vs Delayed Deliveries</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Delivery outcomes</div>
                    </div>
                    {infoButton('Split of on-time vs delayed deliveries for closed orders with known delivery dates.')}
                  </div>
                  <div className="h-[220px]">
                    <ReactECharts
                      style={{ height: '100%' }}
                      option={{
                        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                        legend: { show: false },
                        color: ['#10B981', '#F97316'],
                        series: [
                          {
                            type: 'pie',
                            radius: ['45%', '70%'],
                            label: { formatter: '{b}\n{c}', color: cardTheme.muted() },
                            data: [
                              { value: onTimeCount, name: 'On-Time' },
                              { value: delayedCount, name: 'Delayed' },
                            ],
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Vendors by On-Time %</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Mini comparison</div>
                    </div>
                    {infoButton('Compares top vendors by punctuality. Useful for performance reviews and SLAs.')}
                  </div>
                  <div className="h-[220px]">
                    <ReactECharts
                      style={{ height: '100%' }}
                      option={{
                        grid: { left: 42, right: 18, top: 16, bottom: 40, containLabel: true },
                        tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${Math.round(value)}%` },
                        xAxis: { type: 'category', data: vendorDelivery.map((row) => row.vendor), axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                        yAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
                        series: [
                          {
                            type: 'bar',
                            data: vendorDelivery.map((row) => Math.round(row.onTimePct * 100)),
                            barWidth: 20,
                            itemStyle: { color: chartTheme.mkGradient(chartTheme.brandSecondary), borderRadius: [12, 12, 0, 0] },
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Block 7 — Recent Activity */}
        <BaseCard title="Recent Activity">
          <RecentActivityBlock items={activityItems} footerActionLabel="View All Activity" />
        </BaseCard>
      </div>
    </Tooltip.Provider>
  );
}
