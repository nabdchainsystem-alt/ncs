import React from 'react';
import { OrdersProvider, useOrders } from '../context/OrdersContext';
import { listRequests } from '../lib/api';
import ReactECharts from 'echarts-for-react';
import chartTheme from '../styles/chartTheme';
import { ClipboardList, ShoppingCart, CreditCard, Banknote } from 'lucide-react';
import WarehouseKpiMovementsBlock from '../components/inventory/WarehouseKpiMovementsBlock';
import WarehouseCompositionBlock from '../components/inventory/WarehouseCompositionBlock';
import VendorsKpiSpendBlock from '../components/vendors/VendorsKpiSpendBlock';
import VendorsInsightsBlock from '../components/vendors/VendorsInsightsBlock';
import QuickDiscussionTasksBlock from '../components/dashboard/QuickDiscussionTasksBlock';
import RecentActivityBlock from '../components/dashboard/RecentActivityBlock';
import FinancialOverviewBlock from '../components/finance/FinancialOverviewBlock';
import RequestsOrdersActionBar from '../components/dashboard/RequestsOrdersActionBar';

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
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  delta?: Delta;
}> = ({ label, value, icon, delta }) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-gray-500">{label}</div>
        <div className="mt-1 text-3xl font-extrabold tabular-nums text-gray-900">{value}</div>
      </div>
      {delta && (
        <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
          delta.direction === 'up' ? 'bg-green-50 text-green-700' : delta.direction === 'down' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
        }`}>
          <span>{delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'}</span>
          <span>{Math.abs(delta.value).toFixed(2)}%</span>
        </div>
      )}
    </div>
  </div>
);

const BigStatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  delta?: Delta;
}> = ({ label, value, icon, delta }) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-card h-[168px]">
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-50 text-gray-700" aria-hidden="true">
          {icon}
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold text-gray-500">{label}</div>
      <div className="mt-1 text-4xl font-extrabold tabular-nums text-gray-900 tracking-normal">{value}</div>
      {delta && (
        <div className={`absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
          delta.direction === 'up' ? 'bg-green-50 text-green-700' : delta.direction === 'down' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
        }`}>
          <span>{delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '→'}</span>
          <span>{Math.abs(delta.value).toFixed(2)}%</span>
        </div>
      )}
    </div>
  </div>
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

  const barOption = React.useMemo(() => ({
    aria: { enabled: true },
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => `${Number(v).toLocaleString()}k SAR` },
    grid: { left: 28, right: 18, top: 24, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: months, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}k' }, splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    series: [{ type: 'bar', data: monthlyTotals, barWidth: 18, itemStyle: { color: chartTheme.mkGradient(chartTheme.brandPrimary), borderRadius: [8,8,0,0] } }],
  }), [months, monthlyTotals]);

  // No right column — unified block only (four KPIs + bar chart)

  // Removed Monthly Target gauge as per latest layout

  return (
    <section className="rounded-2xl border bg-white shadow-card p-6" aria-label="Overview – KPIs and Monthly Expenses">
      <div className="text-[16px] font-semibold text-gray-900 mb-4">Requests & Orders</div>
      {/* Row 1: four KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <BigStatCard label="Open Requests" value={openReq} icon={<ClipboardList size={20} />} delta={trend.deltas.openRequests} />
        <BigStatCard label="Open Orders" value={openOrdersCount} icon={<ShoppingCart size={20} />} delta={trend.deltas.openOrders} />
        <BigStatCard label="Open Payments" value={openPayments} icon={<CreditCard size={20} />} delta={trend.deltas.openPayments} />
        <BigStatCard label="Open Orders Value" value={formatSAR(openOrdersValue)} icon={<Banknote size={20} />} delta={trend.deltas.openOrdersValue} />
      </div>

      {/* Row 2: full-width bar chart */}
      <div className="mt-6 relative" role="img" aria-label="Monthly Expenses for the current year">
        <div className="text-[16px] font-semibold mb-2">Monthly Expenses</div>
        <button type="button" aria-label="More options" className="absolute top-0 right-0 text-gray-400">•••</button>
        <ReactECharts option={barOption as any} style={{ height: 300 }} notMerge />
      </div>
    </section>
  );
}

function PieCard({ title, subtitle, data }: { title: string; subtitle?: string; data: Array<{ name: string; value: number }>; }) {
  const option = React.useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { show: false },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['35%', '65%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: true, formatter: '{b}: {c}' },
        emphasis: { label: { show: true, fontWeight: 'bold' } },
        data,
      },
    ],
  }), [title, data]);

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-sm font-semibold">{title}</div>
      {subtitle ? <div className="text-[12px] text-gray-500 mb-1">{subtitle}</div> : null}
      <ReactECharts option={option as any} style={{ height: 260 }} />
    </div>
  );
}

function RequestsBlock() {
  const [statusData, setStatusData] = React.useState<Array<{ name: string; value: number }>>([]);
  const [deptData, setDeptData] = React.useState<Array<{ name: string; value: number }>>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await listRequests({ page: 1, pageSize: 500 });
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
        setStatusData([]); setDeptData([]);
      }
    })();
  }, []);

  return (
    <section className="rounded-2xl border bg-white shadow-card p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1 mb-2">Requests</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PieCard title="Requests Status" subtitle="Open / Approved / Closed" data={statusData} />
        <PieCard title="Requests by Department" subtitle="Departments" data={deptData} />
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
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1 mb-2">Orders</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PieCard title="Orders Status" subtitle="Open / Approved / Closed" data={status} />
        <PieCard title="Orders Category Breakdown" subtitle="Materials Categories" data={categories} />
      </div>
    </section>
  );
}

function OverviewShell() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Slim action bar above Requests & Orders */}
      <RequestsOrdersActionBar />
      <OverviewTopBlock />
      <RequestsBlock />
      <OrdersBlock />
      <WarehouseKpiMovementsBlock />
      <WarehouseCompositionBlock />
      <VendorsKpiSpendBlock />
      <VendorsInsightsBlock />
      <FinancialOverviewBlock />
      <QuickDiscussionTasksBlock />
      <RecentActivityBlock />
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
