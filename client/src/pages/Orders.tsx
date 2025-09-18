import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import PageHeader from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import PieInsightCard from '../components/charts/PieInsightCard';
import BarChartCard from '../components/shared/BarChartCard';
import BarChart from '../components/charts/BarChart';
import { StatCard, RecentActivityFeed, PurchaseOrdersTable, type PurchaseOrderRow, type RecentActivityEntry } from '../components/shared';
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
  Lock,
  Timer,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Gauge,
  Building2,
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

type TableSortColumn = 'orderNo' | 'vendor' | 'department' | 'date' | 'status' | 'amount';

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

const activityItems: RecentActivityEntry[] = [
  { id: 'act-1', icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, title: 'Purchase Order PO-2024-011 approved', meta: 'Sara Khalid • 2h ago', actionLabel: 'View' },
  { id: 'act-2', icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />, title: 'Order PO-2024-010 closed successfully', meta: 'Faisal Mutairi • 5h ago', actionLabel: 'Details' },
  { id: 'act-3', icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, title: 'Urgent flag added to PO-2024-006', meta: 'Maintenance Desk • 7h ago', actionLabel: 'Respond' },
  { id: 'act-4', icon: <Truck className="h-4 w-4 text-sky-500" />, title: 'Vertex Robotics sent updated invoice', meta: 'Uploaded by Imran • 1d ago', actionLabel: 'Open' },
  { id: 'act-5', icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, title: 'Approval reminder: PO-2024-024', meta: 'Auto reminder • 1d ago', actionLabel: 'Review' },
  { id: 'act-6', icon: <FileTextIcon className="h-4 w-4 text-indigo-500" />, title: 'Closure report added for PO-2024-023', meta: 'Logistics Ops • 2d ago', actionLabel: 'Download' },
  { id: 'act-7', icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, title: 'Expedite request from Production', meta: 'Khaled • 2d ago', actionLabel: 'Follow up' },
  { id: 'act-8', icon: <UserRound className="h-4 w-4 text-purple-500" />, title: 'New vendor contact uploaded: Nova Chemicals', meta: 'Maha Abbas • 3d ago', actionLabel: 'View' },
];

export default function Orders() {
  const orders = useOrdersDataset();
  const [statusFilter, setStatusFilter] = React.useState<'All' | OrderStatus>('All');
  const [tableSort, setTableSort] = React.useState<{ column: TableSortColumn; direction: 'asc' | 'desc' }>({ column: 'date', direction: 'desc' });
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

  const departmentChartData = React.useMemo(
    () => {
      const map = new Map<string, number>();
      orders.forEach((o) => {
        map.set(o.department, (map.get(o.department) || 0) + 1);
      });
      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, value]) => ({ label, value }));
    },
    [orders],
  );

  const statusChartData = React.useMemo(
    () => statusOrder.map((status) => ({ name: status, value: statusCounts[status] })),
    [statusCounts],
  );

  const urgentStatusCounts = React.useMemo(() => {
    const base: Record<'Urgent' | OrderStatus, number> = { Urgent: urgentOrders.length, Open: 0, Closed: 0, 'In Progress': 0, 'Pending Approval': 0 };
    urgentOrders.forEach((o) => { base[o.status] += 1; });
    return base;
  }, [urgentOrders]);

  const urgentStatusChartData = React.useMemo(
    () => [
      { name: 'Urgent Total', value: urgentStatusCounts.Urgent },
      { name: 'Open', value: urgentStatusCounts.Open },
      { name: 'Closed', value: urgentStatusCounts.Closed },
      { name: 'In Progress', value: urgentStatusCounts['In Progress'] },
      { name: 'Pending Approval', value: urgentStatusCounts['Pending Approval'] },
    ],
    [urgentStatusCounts],
  );

  const urgentDepartmentChartData = React.useMemo(
    () => {
      const map = new Map<string, number>();
      urgentOrders.forEach((o) => {
        map.set(o.department, (map.get(o.department) || 0) + 1);
      });
      return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, value]) => ({ label, value }));
    },
    [urgentOrders],
  );

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
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
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

  const deliveryOutcomeChartData = React.useMemo(
    () => [
      { name: 'On-Time', value: onTimeCount },
      { name: 'Delayed', value: delayedCount },
    ],
    [delayedCount, onTimeCount],
  );

  const vendorOnTimeChartData = React.useMemo(
    () => vendorDelivery.map((row) => ({ label: row.vendor, value: Math.round(row.onTimePct * 100) })),
    [vendorDelivery],
  );

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
      const dir = tableSort.direction === 'asc' ? 1 : -1;
      switch (tableSort.column) {
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
        case 'amount':
          return (a.amount - b.amount) * dir;
        case 'orderNo':
          return a.orderNo.localeCompare(b.orderNo) * dir;
        case 'vendor':
          return a.vendor.localeCompare(b.vendor) * dir;
        case 'department':
          return a.department.localeCompare(b.department) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        default:
          return 0;
      }
    });
    return rows;
  }, [orders, statusFilter, tableSort]);

  const paginatedOrders = React.useMemo(() => {
    const start = page * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const tableRows = React.useMemo<PurchaseOrderRow[]>(
    () =>
      paginatedOrders.map((order) => ({
        id: order.orderNo,
        orderNo: order.orderNo,
        vendor: order.vendor,
        department: order.department,
        date: formatDate(order.date),
        status: order.status,
        amount: order.amount,
      })),
    [paginatedOrders],
  );

  React.useEffect(() => {
    setPage(0);
  }, [statusFilter, tableSort]);

  return (
    <Tooltip.Provider delayDuration={120}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <PageHeader title="Orders" menuItems={menuItems} />

        {/* Block 1 — KPI + Charts */}
        <BaseCard title="Orders Overview" subtitle="Status KPIs and department performance">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            <StatCard
              label="Open Orders"
              value={statusCounts.Open}
              valueFormat="number"
              icon={<FolderOpen className="h-5 w-5 text-sky-500" />}
              delta={{ label: '4.2%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Closed Orders"
              value={statusCounts.Closed}
              valueFormat="number"
              icon={<Lock className="h-5 w-5 text-slate-500" />}
              delta={{ label: '1.5%', trend: 'down' }}
              className="h-full"
            />
            <StatCard
              label="In Progress"
              value={statusCounts['In Progress']}
              valueFormat="number"
              icon={<Timer className="h-5 w-5 text-amber-500" />}
              delta={{ label: '2.9%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Pending Approval"
              value={statusCounts['Pending Approval']}
              valueFormat="number"
              icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
              delta={{ label: '0.8%', trend: 'up' }}
              className="h-full"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <PieInsightCard
              title="Orders by Status"
              subtitle="Open / Closed / In Progress / Pending Approval"
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

        <PurchaseOrdersTable
          title="Purchase Orders"
          subtitle="Sortable table of all purchase orders"
          filters={(
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
          )}
          rows={tableRows}
          totalRows={filteredOrders.length}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={[pageSize]}
          onPageChange={setPage}
          sort={{ column: tableSort.column, direction: tableSort.direction }}
          onSortChange={({ column, direction }) => {
            if (column === 'actions') return;
            setTableSort({ column: column as TableSortColumn, direction });
          }}
          statusRenderer={(status) => {
            const pill = statusPill(status as OrderStatus);
            return (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: pill.bg, color: pill.text }}
              >
                {status}
              </span>
            );
          }}
          actionRenderer={(row) => (
            <button
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={(event) => {
                event.stopPropagation();
                console.log('Action menu for', row.orderNo);
              }}
            >
              Quick Actions
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
          onRowClick={(row) => console.log('Open order details', row.orderNo)}
          className="mt-0"
        />

        {/* Block 3 — Urgent Orders Overview */}
        <BaseCard title="Urgent Orders Overview" subtitle="High-priority orders and SLA tracking">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            <StatCard
              label="Open Urgent Orders"
              value={urgentOrders.filter((o) => o.status === 'Open').length}
              valueFormat="number"
              icon={<Zap className="h-5 w-5 text-orange-500" />}
              delta={{ label: '3.4%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Closed Urgent Orders"
              value={urgentOrders.filter((o) => o.status === 'Closed').length}
              valueFormat="number"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              delta={{ label: '1.1%', trend: 'down' }}
              className="h-full"
            />
            <StatCard
              label="On-Time Completion Rate"
              value={fmtPercent(
                urgentOrders.filter((o) => o.delivery?.onTime).length /
                  Math.max(1, urgentOrders.filter((o) => o.status === 'Closed').length),
                0,
              )}
              icon={<Gauge className="h-5 w-5 text-sky-500" />}
              delta={{ label: '2.2%', trend: 'up' }}
              className="h-full"
            />
            <StatCard
              label="Urgent Orders / Department"
              value={`${fmtInt(urgentOrders.length)} / ${fmtInt(new Set(urgentOrders.map((o) => o.department)).size || 1)}`}
              icon={<Building2 className="h-5 w-5 text-purple-500" />}
              className="h-full"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <PieInsightCard
              title="Orders by Status (Urgent Focus)"
              subtitle="Urgent vs Open vs Closed"
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
                className="flex flex-col"
              >
                <div className="mt-3 h-[300px]">
                  <BarChart
                    data={closedByMaterial}
                    categoryKey="material"
                    series={[{ id: 'spend', valueKey: 'spend', name: 'Spend (SAR)' }]}
                    orientation="horizontal"
                    height={300}
                    appearance={{ grid: { left: 120 }, barWidth: '38%' }}
                  />
                </div>
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
                className="flex flex-col"
              >
                <div className="mt-3 h-[300px]">
                  <BarChart
                    data={closedByVendor}
                    categoryKey="vendor"
                    series={[{ id: 'spend', valueKey: 'spend', name: 'Spend (SAR)' }]}
                    orientation="horizontal"
                    height={300}
                    appearance={{ grid: { left: 120 }, barWidth: '38%' }}
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

        {/* Block 7 — Recent Activity */}
        <BaseCard title="Recent Activity" subtitle="Latest order updates and approvals">
          <RecentActivityFeed items={activityItems} />
        </BaseCard>
      </div>
    </Tooltip.Provider>
  );
}
