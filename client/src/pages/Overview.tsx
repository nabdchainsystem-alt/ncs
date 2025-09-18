import React from 'react';
import { OrdersProvider, useOrders } from '../context/OrdersContext';
import { listRequests } from '../lib/api';
import BaseCard from '../components/ui/BaseCard';
import { ClipboardList, ShoppingCart, CreditCard, Banknote, Plus, PackagePlus, Upload, Users, ShieldCheck, Truck, AlertTriangle } from 'lucide-react';
import WarehouseKpiMovementsBlock from '../components/inventory/WarehouseKpiMovementsBlock';
import WarehouseCompositionBlock from '../components/inventory/WarehouseCompositionBlock';
import VendorsKpiSpendBlock from '../components/vendors/VendorsKpiSpendBlock';
import VendorsInsightsBlock from '../components/vendors/VendorsInsightsBlock';
import QuickDiscussionTasksBlock from '../components/dashboard/QuickDiscussionTasksBlock';
import FinancialOverviewBlock from '../components/finance/FinancialOverviewBlock';
import PageHeader from '../components/layout/PageHeader';
import { FileText } from 'lucide-react';
import PieInsightCard from '../components/charts/PieInsightCard';
import { StatCard, BarChartCard, RecentActivityFeed, type RecentActivityEntry } from '../components/shared';

function formatSAR(v: number) {
  try {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + ' SAR';
  } catch {
    if (v >= 1_000_000) return (v/1_000_000).toFixed(1) + 'M SAR';
    if (v >= 1_000) return (v/1_000).toFixed(1) + 'k SAR';
    return String(v) + ' SAR';
  }
}

type Delta = { value: number; direction: 'up' | 'down' | 'flat' } | null;

const toStatCardDelta = (delta: Delta) => (
  delta
    ? {
        label: `${Math.abs(delta.value).toFixed(2)}%`,
        trend: delta.direction,
      }
    : null
);

function useWeeklyTrend() {
  const { orders } = useOrders();
  const [requests, setRequests] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await listRequests({ page: 1, pageSize: 1000, sortBy: 'createdAt', sortDir: 'desc' });
        setRequests(r.items || []);
      } catch {
        setRequests([]);
      }
    })();
  }, []);

  const trend = React.useMemo(() => {
    const isoWeek = (d: Date) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return { year: date.getUTCFullYear(), week: weekNo };
    };
    const keyStr = (k: { year: number; week: number }) => `${k.year}-W${String(k.week).padStart(2, '0')}`;

    const now = new Date();
    const keys: Array<{ year: number; week: number }> = [];
    let d = new Date(now);
    for (let i = 0; i < 12; i++) { keys.unshift(isoWeek(d)); d = new Date(d.getTime() - 7 * 86400000); }

    const initMap = () => new Map<string, number>(keys.map(k => [keyStr(k), 0] as [string, number]));
    const reqMap = initMap();
    const ordMap = initMap();
    const payMap = initMap();
    const ordValMap = initMap();

    // Requests: count of currently open requests created in week
    requests.forEach((it: any) => {
      const raw = String(it.status || '').toUpperCase();
      const isOpen = raw !== 'COMPLETED';
      if (!isOpen) return;
      const k = keyStr(isoWeek(new Date(it.createdAt || it.date || Date.now())));
      if (reqMap.has(k)) reqMap.set(k, (reqMap.get(k) || 0) + 1);
    });

    // Orders: open counts and value; payments: orders with unpaid payment
    orders.forEach((o: any) => {
      const isOpen = o.status !== 'Completed' && o.status !== 'Canceled';
      const k = keyStr(isoWeek(new Date(o.date)));
      if (!ordMap.has(k)) return;
      if (isOpen) {
        ordMap.set(k, (ordMap.get(k) || 0) + 1);
        ordValMap.set(k, (ordValMap.get(k) || 0) + Math.round(o.value || 0));
        if ((o.payment || []).some((p: any) => !p.paid)) {
          payMap.set(k, (payMap.get(k) || 0) + 1);
        }
      }
    });

    const labels = keys.map(k => `W${String(k.week).padStart(2,'0')}`);
    const openRequests = keys.map(k => reqMap.get(keyStr(k)) || 0);
    const openOrders = keys.map(k => ordMap.get(keyStr(k)) || 0);
    const openPayments = keys.map(k => payMap.get(keyStr(k)) || 0);
    const openOrdersValue = keys.map(k => Math.round((ordValMap.get(keyStr(k)) || 0) / 1000)); // k SAR

    const pct = (a: number, b: number) => b === 0 ? (a === 0 ? 0 : 100) : ((a - b) / b) * 100;
    const lastDelta = (arr: number[]): Delta => {
      if (arr.length < 2) return null;
      const a = arr[arr.length - 1], b = arr[arr.length - 2];
      const value = pct(a, b);
      const direction: 'up' | 'down' | 'flat' = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
      return { value, direction };
    };

    return {
      labels,
      series: { openRequests, openOrders, openPayments, openOrdersValue },
      deltas: {
        openRequests: lastDelta(openRequests),
        openOrders: lastDelta(openOrders),
        openPayments: lastDelta(openPayments),
        openOrdersValue: lastDelta(openOrdersValue),
      },
    };
  }, [orders, requests]);

  return trend;
}

function OverviewTopBlock() {
  const { orders } = useOrders();
  const [openReq, setOpenReq] = React.useState<number>(0);
  const trend = useWeeklyTrend();

  React.useEffect(() => {
    (async () => {
      try {
        const r = await listRequests({ page: 1, pageSize: 200, sortBy: 'createdAt', sortDir: 'desc' });
        const count = (r.items || []).filter((it: any) => String(it.status || '').toUpperCase() !== 'COMPLETED').length;
        setOpenReq(count);
      } catch {
        setOpenReq(0);
      }
    })();
  }, []);

  const openOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Canceled');
  const openOrdersCount = openOrders.length;
  const openPayments = orders.filter(o => (o.payment || []).some(p => !p.paid)).length;
  const openOrdersValue = Math.round(openOrders.reduce((s, o) => s + o.value, 0));

  // Monthly totals (expenses) — data slot (example)
  const months = React.useMemo(() => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], []);
  const monthlyTotals = React.useMemo(() => {
    // Example amounts in thousands (k SAR)
    const demo = [160, 360, 200, 290, 170, 190, 260, 110, 210, 360, 240, 120];
    return demo; // values in k SAR
  }, [orders]);

  const monthlyExpenseData = React.useMemo(
    () => months.map((month, index) => ({ label: month, value: monthlyTotals[index] })),
    [months, monthlyTotals],
  );

  // No right column — unified block only (four KPIs + bar chart)

  // Removed Monthly Target gauge as per latest layout

  return (
    <section className="rounded-2xl border bg-white shadow-card p-6" aria-label="Overview – KPIs and Monthly Expenses">
      <div className="text-[16px] font-semibold text-gray-900">Requests & Orders</div>
      <p className="mt-1 mb-4 text-sm text-gray-500">Headline metrics across requests, orders, and spend</p>
      {/* Row 1: four KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Open Requests"
          value={openReq}
          valueFormat="number"
          icon={<ClipboardList size={20} />}
          delta={toStatCardDelta(trend.deltas.openRequests)}
        />
        <StatCard
          label="Open Orders"
          value={openOrdersCount}
          valueFormat="number"
          icon={<ShoppingCart size={20} />}
          delta={toStatCardDelta(trend.deltas.openOrders)}
        />
        <StatCard
          label="Open Payments"
          value={openPayments}
          valueFormat="number"
          icon={<CreditCard size={20} />}
          delta={toStatCardDelta(trend.deltas.openPayments)}
        />
        <StatCard
          label="Open Orders Value"
          value={formatSAR(openOrdersValue)}
          icon={<Banknote size={20} />}
          delta={toStatCardDelta(trend.deltas.openOrdersValue)}
        />
      </div>

      {/* Row 2: full-width bar chart */}
      <div className="mt-6" role="img" aria-label="Monthly Expenses for the current year">
        <div className="relative">
          <BarChartCard
            title="Monthly Expenses"
            subtitle="Values in k SAR"
            data={monthlyExpenseData}
            height={300}
            axisValueSuffix="k"
            tooltipValueSuffix="k SAR"
          />
          <button type="button" aria-label="More options" className="absolute right-6 top-6 text-gray-400">•••</button>
        </div>
      </div>
    </section>
  );
}

const overviewActivityItems: RecentActivityEntry[] = [
  { id: 'ov-act-1', icon: <ShoppingCart className="h-4 w-4 text-indigo-500" />, title: 'PO-2052 pushed to vendor', meta: 'Ranya • 30m ago', actionLabel: 'Open' },
  { id: 'ov-act-2', icon: <Truck className="h-4 w-4 text-emerald-500" />, title: 'Outbound WH-B dispatched (12 pallets)', meta: 'Warehouse Ops • 1h ago', actionLabel: 'Track' },
  { id: 'ov-act-3', icon: <ClipboardList className="h-4 w-4 text-sky-500" />, title: 'Request RQ-1201 escalated to urgent', meta: 'Control Room • 3h ago', actionLabel: 'Review' },
  { id: 'ov-act-4', icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, title: 'Budget exception approved for vendor advance', meta: 'Finance Bot • 6h ago', actionLabel: 'Details' },
  { id: 'ov-act-5', icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, title: 'Delivery SLA risk for PO-2046', meta: 'Predictive Insights • 1d ago', actionLabel: 'Mitigate' },
];

function RequestsBlock() {
  const [statusData, setStatusData] = React.useState<Array<{ name: string; value: number }>>([]);
  const [deptData, setDeptData] = React.useState<Array<{ name: string; value: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await listRequests({ page: 1, pageSize: 500 });
        if (!mounted) return;
        const items = r.items || [];
        const mStatus = { Open: 0, Approved: 0, Completed: 0 } as Record<string, number>;
        const mDept = new Map<string, number>();
        items.forEach((it: any) => {
          const raw = String(it.status || '').toUpperCase();
          if (raw === 'COMPLETED') mStatus.Completed++;
          else if (raw === 'APPROVED') mStatus.Approved++;
          else mStatus.Open++;
          const dept = String(it.department || '—');
          mDept.set(dept, (mDept.get(dept) || 0) + 1);
        });
        setStatusData(Object.entries(mStatus).map(([name, value]) => ({ name, value })));
        const deptArr = Array.from(mDept.entries()).map(([name, value]) => ({ name, value }));
        deptArr.sort((a, b) => b.value - a.value);
        setDeptData(deptArr.slice(0, 8));
      } catch {
        if (!mounted) return;
        setStatusData([]);
        setDeptData([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border bg-white shadow-card p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1">Requests</div>
      <p className="px-1 text-sm text-gray-500 mb-2">Status distribution and top departments</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PieInsightCard
          title="Requests Status"
          subtitle="Open / Approved / Closed"
          data={statusData}
          loading={isLoading}
          description="Share of requests by current status. Use this split to track how quickly approvals move through the pipeline."
        />
        <PieInsightCard
          title="Requests by Department"
          subtitle="Departments"
          data={deptData}
          loading={isLoading}
          description="Top departments ranked by their volume of recent requests. Helps identify the teams generating the most demand this period."
        />
      </div>
    </section>
  );
}

function OrdersBlock() {
  const { orders } = useOrders();
  const status = React.useMemo(() => {
    const m = { Open: 0, Approved: 0, Completed: 0 } as Record<string, number>;
    orders.forEach(o => {
      if (o.status === 'Completed') m.Completed++;
      else if (o.status === 'In Progress') m.Approved++;
      else if (o.status === 'Open') m.Open++;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const categories = React.useMemo(() => {
    const cat = new Map<string, number>();
    const classify = (o: any): string => {
      if (o.value > 800000 || o.items > 8) return 'Raw Materials';
      if (o.items <= 3 && (o.shipMode === 'Local' || o.destination.includes('Riyadh'))) return 'Services';
      return 'Spare Parts';
    };
    orders.forEach(o => {
      const k = classify(o);
      cat.set(k, (cat.get(k) || 0) + 1);
    });
    return Array.from(cat.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  return (
    <section className="rounded-2xl border bg-white shadow-card p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1">Orders</div>
      <p className="px-1 text-sm text-gray-500 mb-2">Snapshot of order status and category mix</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PieInsightCard
          title="Orders Status"
          subtitle="Open / Approved / Closed"
          data={status}
          description="Distribution of purchase orders by fulfillment stage. Watch the open share for early signs of fulfillment bottlenecks."
        />
        <PieInsightCard
          title="Orders Category Breakdown"
          subtitle="Materials Categories"
          data={categories}
          description="Orders grouped by inferred material or service category. Highlights the sourcing mix between materials and service work orders."
        />
      </div>
    </section>
  );
}

// header actions moved into PageHeader menuItems

function OverviewShell() {
  const menuItems = [
    { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" />, onClick: () => console.log('New Request') },
    { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" />, onClick: () => console.log('Import Requests') },
    { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" />, onClick: () => console.log('New Material') },
    { key: 'import-materials', label: 'Import Materials', icon: <Upload className="w-4.5 h-4.5" />, onClick: () => console.log('Import Materials') },
    { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" />, onClick: () => console.log('New Vendor') },
    { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-4.5 h-4.5" />, onClick: () => console.log('Import Vendors') },
    { key: 'new-payment-request', label: 'New Payment Request', icon: <FileText className="w-4.5 h-4.5" />, onClick: () => console.log('New Payment Request') },
  ];
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader title="Overview" menuItems={menuItems} />
      <OverviewTopBlock />
      <RequestsBlock />
      <OrdersBlock />
      <WarehouseKpiMovementsBlock subtitle="Inventory health, alerts, and monthly movements" />
      <WarehouseCompositionBlock subtitle="Stock status and warehouse mix" />
      <VendorsKpiSpendBlock subtitle="Key vendor metrics and monthly spend" />
      <VendorsInsightsBlock subtitle="Performance insights across supplier tiers" />
      <FinancialOverviewBlock subtitle="Payment KPIs and breakdowns" />
      <QuickDiscussionTasksBlock subtitle="Team conversations and follow-up tasks" />
      <BaseCard title="Recent Activity" subtitle="Latest cross-functional updates">
        <RecentActivityFeed items={overviewActivityItems} />
      </BaseCard>
    </div>
  );
}

export default function Overview() {
  return (
    <OrdersProvider>
      <OverviewShell />
    </OrdersProvider>
  );
}

// SpendFlowBlock removed per request
