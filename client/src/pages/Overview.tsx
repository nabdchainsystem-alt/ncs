import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  PackagePlus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import BaseCard from '../components/ui/BaseCard';
import WarehouseKpiMovementsBlock from '../components/inventory/WarehouseKpiMovementsBlock';
import WarehouseCompositionBlock from '../components/inventory/WarehouseCompositionBlock';
import QuickDiscussionTasksBlock from '../components/dashboard/QuickDiscussionTasksBlock';
import FinancialOverviewBlock from '../components/finance/FinancialOverviewBlock';
import PageHeader from '../components/layout/PageHeader';
import PieInsightCard from '../components/charts/PieInsightCard';
import {
  StatCard,
  BarChartCard,
  RecentActivityFeed,
  type RecentActivityEntry,
} from '../components/shared';
import { useApiHealth } from '../context/ApiHealthContext';
import {
  useOverviewKpis,
  useOverviewOrdersByDept,
  useRequestsByDeptBar,
  useRequestsStatusPie,
  useOrdersStatusPie,
  useOrdersCategoryPie,
  useVendorKpis,
  useVendorMonthlySpend,
  useVendorTopSpend,
  useVendorStatusMix,
} from '../features/overview/hooks';
import type {
  OverviewOrdersByDept,
  OverviewOrdersSummary,
  OverviewRequestsSummary,
  RequestsByDeptBar,
  RequestsStatusDatum,
  OrdersStatusDatum,
  OrdersCategoryDatum,
  VendorKpisSummary,
  VendorMonthlySpend,
  VendorTopSpendDatum,
  VendorStatusMixDatum,
} from '../features/overview/facade';

type OverviewTopBlockProps = {
  requests: OverviewRequestsSummary | null;
  orders: OverviewOrdersSummary | null;
  loadingRequests: boolean;
  loadingOrders: boolean;
  ordersByDept: OverviewOrdersByDept | null;
  loadingOrdersByDept: boolean;
};

function OverviewTopBlock({
  requests,
  orders,
  loadingRequests,
  loadingOrders,
  ordersByDept,
  loadingOrdersByDept,
}: OverviewTopBlockProps) {
  const requestTotal = requests?.total ?? 0;
  const orderTotal = orders?.total ?? 0;
  const urgentRequests = React.useMemo(() => {
    const entry = requests?.priorityCounts?.find(
      (item) => String(item.name).toLowerCase() === 'high'
    );
    return entry?.value ?? 0;
  }, [requests]);

  const twelveMonthSpend = orders?.twelveMonthSpend ?? 0;

  const completedOrdersByDept = React.useMemo(() => {
    if (
      !ordersByDept ||
      !Array.isArray(ordersByDept.categories) ||
      !Array.isArray(ordersByDept.series)
    )
      return [];
    const primarySeries = ordersByDept.series[0];
    return ordersByDept.categories.map((label, index) => ({
      label,
      value: Number(primarySeries?.data?.[index] ?? 0),
    }));
  }, [ordersByDept]);

  const requestValue: number | string = loadingRequests ? '—' : requestTotal;
  const orderValue: number | string = loadingOrders ? '—' : orderTotal;
  const urgentValue: number | string = loadingRequests ? '—' : urgentRequests;
  const spendValue: number | string = loadingOrders ? '—' : twelveMonthSpend;

  return (
    <section
      className="rounded-2xl border bg-white shadow-card p-6"
      aria-label="Overview – KPIs and Monthly Expenses"
    >
      <div className="text-[16px] font-semibold text-gray-900">Requests & Orders</div>
      <p className="mt-1 mb-4 text-sm text-gray-500">
        Headline metrics across requests, orders, and spend
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Requests"
          value={requestValue}
          valueFormat={typeof requestValue === 'number' ? 'number' : undefined}
          icon={<ClipboardList size={20} />}
          delta={null}
        />
        <StatCard
          label="Orders"
          value={orderValue}
          valueFormat={typeof orderValue === 'number' ? 'number' : undefined}
          icon={<ShoppingCart size={20} />}
          delta={null}
        />
        <StatCard
          label="Urgent Requests"
          value={urgentValue}
          valueFormat={typeof urgentValue === 'number' ? 'number' : undefined}
          icon={<AlertTriangle size={20} />}
          delta={null}
        />
        <StatCard
          label="12-Month Spend"
          value={spendValue}
          valueFormat={typeof spendValue === 'number' ? 'sar' : undefined}
          valueFractionDigits={1}
          icon={<Banknote size={20} />}
          delta={null}
        />
      </div>
      <div className="mt-6" role="img" aria-label="Monthly Expenses for the current year">
        <div className="relative">
          <BarChartCard
            title="Completed Orders by Department"
            subtitle="Departmental totals"
            data={completedOrdersByDept}
            height={300}
            loading={loadingOrdersByDept}
            valueFormat="sar"
            axisValueSuffix=" SAR"
            tooltipValueSuffix=" SAR"
          />
          <button
            type="button"
            aria-label="More options"
            className="absolute right-6 top-6 text-gray-400"
          >
            •••
          </button>
        </div>
      </div>
    </section>
  );
}

const overviewActivityItems: RecentActivityEntry[] = [
  {
    id: 'ov-act-1',
    icon: <ShoppingCart className="h-4 w-4 text-indigo-500" />,
    title: 'PO-2052 pushed to vendor',
    meta: 'Ranya • 30m ago',
    actionLabel: 'Open',
  },
  {
    id: 'ov-act-2',
    icon: <Truck className="h-4 w-4 text-emerald-500" />,
    title: 'Outbound WH-B dispatched (12 pallets)',
    meta: 'Warehouse Ops • 1h ago',
    actionLabel: 'Track',
  },
  {
    id: 'ov-act-3',
    icon: <ClipboardList className="h-4 w-4 text-sky-500" />,
    title: 'Request RQ-1201 escalated to urgent',
    meta: 'Control Room • 3h ago',
    actionLabel: 'Review',
  },
  {
    id: 'ov-act-4',
    icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
    title: 'Budget exception approved for vendor advance',
    meta: 'Finance Bot • 6h ago',
    actionLabel: 'Details',
  },
  {
    id: 'ov-act-5',
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    title: 'Delivery SLA risk for PO-2046',
    meta: 'Predictive Insights • 1d ago',
    actionLabel: 'Mitigate',
  },
];

type RequestsBlockProps = {
  loading: boolean;
  statusData: RequestsStatusDatum[];
  loadingStatus: boolean;
  deptData: RequestsByDeptBar | null;
  loadingDept: boolean;
  onStatusClick: (status: string) => void;
  onDeptClick: (department: string) => void;
};

function RequestsBlock({
  loading,
  statusData,
  loadingStatus,
  deptData,
  loadingDept,
  onStatusClick,
  onDeptClick,
}: RequestsBlockProps) {
  const pieStatusData = React.useMemo(
    () =>
      statusData.map((entry) => ({
        name: entry.name === 'OnHold' ? 'On Hold' : entry.name,
        value: entry.value,
      })),
    [statusData]
  );

  const deptPieData = React.useMemo(() => {
    const categories = deptData?.categories ?? [];
    const series = deptData?.series?.[0]?.data ?? [];
    return categories.map((name, index) => ({
      name: (name || 'Unassigned').trim(),
      value: Number(series[index] ?? 0),
    }));
  }, [deptData]);

  return (
    <section className="rounded-2xl border bg-white shadow-card p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1">
        Requests
      </div>
      <p className="px-1 text-sm text-gray-500 mb-2">Status distribution and top departments</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PieInsightCard
          title="Requests Status"
          subtitle="New / Approved / On Hold / Rejected / Closed"
          data={pieStatusData}
          loading={loading || loadingStatus}
          description="Share of requests by current status. Use this split to track how quickly approvals move through the pipeline."
          onSelect={(datum) => datum?.name && onStatusClick(datum.name)}
        />
        <PieInsightCard
          title="Requests by Department"
          subtitle="Departments"
          data={deptPieData}
          loading={loading || loadingDept}
          description="Share of requests split by department"
          onSelect={(datum) => {
            const label = datum?.name?.trim();
            if (label) onDeptClick(label);
          }}
        />
      </div>
    </section>
  );
}

type OrdersBlockProps = {
  data: OverviewOrdersSummary | null;
  loading: boolean;
  statusData: OrdersStatusDatum[];
  loadingStatus: boolean;
  categoryData: OrdersCategoryDatum[];
  loadingCategory: boolean;
  onStatusClick: (status: string) => void;
  onCategoryClick: (category: string) => void;
};

function OrdersBlock({
  data,
  loading,
  statusData,
  loadingStatus,
  categoryData,
  loadingCategory,
  onStatusClick,
  onCategoryClick,
}: OrdersBlockProps) {
  const statusPieData = React.useMemo(
    () =>
      statusData.map((entry) => ({
        name: entry.name === 'OnHold' ? 'On Hold' : entry.name,
        value: entry.value,
      })),
    [statusData]
  );

  const categoryPieData = React.useMemo(
    () =>
      categoryData.map((entry) => ({
        name: entry.name || 'Unassigned',
        value: entry.value,
      })),
    [categoryData]
  );

  return (
    <section className="rounded-2xl border bg-white shadow-card p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1">Orders</div>
      <p className="px-1 text-sm text-gray-500 mb-2">Snapshot of order status and category mix</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PieInsightCard
          title="Orders Status"
          subtitle="Pending / Completed / On Hold / New"
          data={statusPieData}
          loading={loading || loadingStatus}
          description="Distribution of purchase orders by lifecycle stage. Track pending items for potential fulfillment delays."
          onSelect={(datum) => datum?.name && onStatusClick(datum.name)}
        />
        <PieInsightCard
          title="Orders Category Breakdown"
          subtitle="Spend by category"
          data={categoryPieData}
          loading={loading || loadingCategory}
          description="Completed orders grouped by primary spend category or request department when categories are missing."
          onSelect={(datum) => datum?.name && onCategoryClick(datum.name)}
        />
      </div>
    </section>
  );
}

type VendorsBlockProps = {
  kpis: VendorKpisSummary | null;
  loadingKpis: boolean;
  monthlySpend: VendorMonthlySpend | null;
  loadingMonthly: boolean;
  topSpend: VendorTopSpendDatum[];
  loadingTopSpend: boolean;
  statusMix: VendorStatusMixDatum[];
  loadingStatusMix: boolean;
  onVendorClick: (name: string) => void;
  onTierClick: (tier: string) => void;
};

function VendorsBlock({
  kpis,
  loadingKpis,
  monthlySpend,
  loadingMonthly,
  topSpend,
  loadingTopSpend,
  statusMix,
  loadingStatusMix,
  onVendorClick,
  onTierClick,
}: VendorsBlockProps) {
  const stats = React.useMemo(() => {
    const snapshot: VendorKpisSummary = kpis ?? {
      active: 0,
      newThisMonth: 0,
      avgTrustScore: 0,
      totalSpend: 0,
    };

    return [
      {
        label: 'Active Vendors',
        value: snapshot.active,
        icon: <Users size={20} />,
        format: 'number' as const,
      },
      {
        label: 'New Vendors (This Month)',
        value: snapshot.newThisMonth,
        icon: <Plus size={20} />,
        format: 'number' as const,
      },
      {
        label: 'Average Trust Score',
        value: snapshot.avgTrustScore,
        icon: <ShieldCheck size={20} />,
        format: 'number' as const,
      },
      {
        label: 'Total Vendor Spend (SAR)',
        value: snapshot.totalSpend,
        icon: <Banknote size={20} />,
        format: 'sar' as const,
      },
    ];
  }, [kpis]);

  const monthlyBarData = React.useMemo(() => {
    const categories = monthlySpend?.categories ?? [];
    const primarySeries = monthlySpend?.series?.[0]?.data ?? [];
    return categories.map((label, index) => ({
      label,
      value: Number(primarySeries[index] ?? 0),
    }));
  }, [monthlySpend]);

  const topSpendPieData = React.useMemo(
    () => (topSpend ?? []).map((entry) => ({ name: entry.name, value: entry.value })),
    [topSpend],
  );

  const statusPieData = React.useMemo(
    () => (statusMix ?? []).map((entry) => ({ name: entry.name, value: entry.value })),
    [statusMix],
  );

  return (
    <section className="rounded-2xl border bg-white shadow-card p-6" aria-label="Vendors KPIs and Analytics">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900">Vendors</div>
        <p className="mt-1 text-sm text-gray-500">
          Snapshot of vendor performance, spend concentration, and portfolio health
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={loadingKpis ? '—' : stat.value}
            valueFormat={stat.format}
            valueFractionDigits={stat.label === 'Average Trust Score' ? 1 : undefined}
            icon={stat.icon}
            delta={null}
            className="h-full"
          />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChartCard
          title="Monthly Vendor Spend"
          subtitle="Spend (SAR)"
          data={monthlyBarData}
          height={300}
          loading={loadingMonthly || loadingKpis}
          emptyMessage="No spend captured for this year"
          tooltipValueSuffix=" SAR"
        />
        <PieInsightCard
          title="Top Vendors by Spend"
          subtitle="Top contributors"
          data={topSpendPieData}
          loading={loadingTopSpend}
          description="Spend distribution across leading suppliers. Drill in to manage vendor concentration."
          onSelect={(datum) => datum?.name && onVendorClick(datum.name)}
          emptyMessage="No vendor spend data"
        />
      </div>
      <div className="mt-6">
        <PieInsightCard
          title="Vendor Status Mix"
          subtitle="Performing / Watchlist / Critical / Other"
          data={statusPieData}
          loading={loadingStatusMix}
          description="Portfolio mix by trust tier. Monitor watchlist and critical vendors to mitigate risk."
          onSelect={(datum) => datum?.name && onTierClick(datum.name)}
          emptyMessage="No vendors available"
          height={280}
        />
      </div>
    </section>
  );
}

// header actions moved into PageHeader menuItems

function OverviewShell() {
  const { healthy } = useApiHealth();
  const navigate = useNavigate();
  const {
    data: overviewData,
    isLoading: loadingOverview,
    error: overviewError,
  } = useOverviewKpis();
  const { data: ordersByDeptData, isLoading: loadingOrdersByDept } = useOverviewOrdersByDept();
  const { data: requestsStatusData, isLoading: loadingRequestsStatus } = useRequestsStatusPie();
  const { data: requestsDeptData, isLoading: loadingRequestsDept } = useRequestsByDeptBar();
  const { data: ordersStatusData, isLoading: loadingOrdersStatus } = useOrdersStatusPie();
  const { data: ordersCategoryData, isLoading: loadingOrdersCategory } = useOrdersCategoryPie();
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const { data: vendorKpisData, isLoading: loadingVendorKpis } = useVendorKpis();
  const { data: vendorMonthlyData, isLoading: loadingVendorMonthly } = useVendorMonthlySpend(currentYear);
  const { data: vendorTopSpendData, isLoading: loadingVendorTopSpend } = useVendorTopSpend();
  const { data: vendorStatusMixData, isLoading: loadingVendorStatusMix } = useVendorStatusMix();

  const requests = healthy ? overviewData.requests : null;
  const orders = healthy ? overviewData.orders : null;
  const ordersByDept = healthy ? ordersByDeptData : null;
  const vendorKpis = healthy ? vendorKpisData : null;
  const vendorMonthly = healthy ? vendorMonthlyData : null;
  const vendorTopSpend = healthy ? vendorTopSpendData : [];
  const vendorStatusMix = healthy ? vendorStatusMixData : [];
  const loading = loadingOverview || !healthy;
  const statusSelection = React.useCallback(
    (statusName: string) => {
      const name = statusName.replace(/\s+/g, '');
      navigate(`/requests?status=${encodeURIComponent(name)}`);
    },
    [navigate]
  );

  const deptSelection = React.useCallback(
    (department: string) => {
      const trimmed = department.trim();
      navigate(trimmed ? `/requests?dept=${encodeURIComponent(trimmed)}` : '/requests');
    },
    [navigate]
  );

  const orderStatusSelection = React.useCallback(
    (statusName: string) => {
      const normalized = statusName.replace(/\s+/g, '');
      navigate(`/orders?status=${encodeURIComponent(normalized)}`);
    },
    [navigate]
  );

  const orderCategorySelection = React.useCallback(
    (category: string) => {
      const trimmed = category.trim();
      const query = new URLSearchParams({ status: 'Completed' });
      if (trimmed) query.set('category', trimmed);
      navigate(`/orders?${query.toString()}`);
    },
    [navigate]
  );
  const vendorSelection = React.useCallback(
    (vendorName: string) => {
      const trimmed = vendorName.trim();
      if (!trimmed) return;
      navigate(`/vendors?vendor=${encodeURIComponent(trimmed)}`);
    },
    [navigate]
  );

  const vendorTierSelection = React.useCallback(
    (tier: string) => {
      const trimmed = tier.trim();
      navigate(trimmed ? `/vendors?tier=${encodeURIComponent(trimmed)}` : '/vendors');
    },
    [navigate]
  );

  const financialKpiPlaceholders = React.useMemo(() => ([
    { label: 'Open Payments', value: '—', icon: <Wallet size={20} />, delta: null },
    { label: 'Pending Payments', value: '—', icon: <Clock size={20} />, delta: null },
    { label: 'Closed Payments', value: '—', icon: <CheckCircle2 size={20} />, delta: null },
    { label: 'Scheduled Payments', value: '—', icon: <CalendarDays size={20} />, delta: null },
  ]), []);
  const menuItems = [
    {
      key: 'new-request',
      label: 'New Request',
      icon: <Plus className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Request'),
    },
    {
      key: 'import-requests',
      label: 'Import Requests',
      icon: <Upload className="w-4.5 h-4.5" />,
      onClick: () => console.log('Import Requests'),
    },
    {
      key: 'new-material',
      label: 'New Material',
      icon: <PackagePlus className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Material'),
    },
    {
      key: 'import-materials',
      label: 'Import Materials',
      icon: <Upload className="w-4.5 h-4.5" />,
      onClick: () => console.log('Import Materials'),
    },
    {
      key: 'new-vendor',
      label: 'New Vendor',
      icon: <Users className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Vendor'),
    },
    {
      key: 'import-vendors',
      label: 'Import Vendors',
      icon: <Upload className="w-4.5 h-4.5" />,
      onClick: () => console.log('Import Vendors'),
    },
    {
      key: 'new-payment-request',
      label: 'New Payment Request',
      icon: <FileText className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Payment Request'),
    },
  ];
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {!healthy ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Backend unavailable. Insights will update when the connection is restored.
        </div>
      ) : null}
      {overviewError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Failed to load overview KPIs. Please retry shortly.
        </div>
      ) : null}
      <PageHeader title="Overview" menuItems={menuItems} />
      <OverviewTopBlock
        requests={requests}
        orders={orders}
        loadingRequests={loading}
        loadingOrders={loading}
        ordersByDept={ordersByDept ?? null}
        loadingOrdersByDept={loadingOrdersByDept || !healthy}
      />
      <RequestsBlock
        loading={loading}
        statusData={healthy ? requestsStatusData : []}
        loadingStatus={loadingRequestsStatus}
        deptData={healthy ? requestsDeptData : null}
        loadingDept={loadingRequestsDept || !healthy}
        onStatusClick={statusSelection}
        onDeptClick={deptSelection}
      />
      <OrdersBlock
        data={orders}
        loading={loading}
        statusData={healthy ? ordersStatusData : []}
        loadingStatus={loadingOrdersStatus}
        categoryData={healthy ? ordersCategoryData : []}
        loadingCategory={loadingOrdersCategory || !healthy}
        onStatusClick={orderStatusSelection}
        onCategoryClick={orderCategorySelection}
      />
      <WarehouseKpiMovementsBlock subtitle="Inventory health, alerts, and monthly movements" />
      <WarehouseCompositionBlock subtitle="Stock status and warehouse mix" />
      <VendorsBlock
        kpis={vendorKpis}
        loadingKpis={loadingVendorKpis || !healthy}
        monthlySpend={vendorMonthly}
        loadingMonthly={loadingVendorMonthly || !healthy}
        topSpend={vendorTopSpend}
        loadingTopSpend={loadingVendorTopSpend || !healthy}
        statusMix={vendorStatusMix}
        loadingStatusMix={loadingVendorStatusMix || !healthy}
        onVendorClick={vendorSelection}
        onTierClick={vendorTierSelection}
      />
      <FinancialOverviewBlock
        subtitle="Payment KPIs and breakdowns"
        kpis={financialKpiPlaceholders}
        statusData={[]}
        methodData={[]}
      />
      <QuickDiscussionTasksBlock subtitle="Team conversations and follow-up tasks" />
      <BaseCard title="Recent Activity" subtitle="Latest cross-functional updates">
        <RecentActivityFeed items={overviewActivityItems} />
      </BaseCard>
    </div>
  );
}

export default function Overview() {
  return <OverviewShell />;
}

// SpendFlowBlock removed per request
