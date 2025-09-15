import React from 'react';
import ReactECharts from 'echarts-for-react';
import BaseCard from '../components/ui/BaseCard';
import KPICard from '../components/ui/KPICard';
import chartTheme from '../styles/chartTheme';
import cardTheme from '../styles/cardTheme';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info, Plus, Upload, PackagePlus, Users, FileText, Timer, Zap, CreditCard, Building2, ArrowUpRight } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import RecentActivityBlock from '../components/dashboard/RecentActivityBlock';
import PageHeader from '../components/layout/PageHeader';

type RequestRow = {
  id: string;
  requestNo: string;
  requester: string;
  department: string;
  date: string;
  requiredDate: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Closed';
  priority: 'Normal' | 'Urgent' | 'Emergency';
  totalValue: number;
  buyer?: string;
  items?: Array<{ code: string; description: string; qty: number; uom: string; specs?: string; vendor?: string }>;
};

type RFQRow = {
  id: string;
  rfqNo: string;
  requestNo: string;
  vendor: string;
  submissionDate: string;
  offerValue: number;
  currency: string;
  status: 'Received' | 'Under Review' | 'Approved' | 'Rejected';
  compare?: boolean;
  lines?: Array<{ item: string; qty: number; unitPrice: number; delivery: string }>;
};

function fmtInt(n: number) {
  try { return new Intl.NumberFormat('en').format(n); } catch { return String(n); }
}
function fmtSAR(n: number) {
  try { return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(n); } catch { return String(n); }
}

function useMockData() {
  const [open, setOpen] = React.useState(128);
  const [closed, setClosed] = React.useState(342);
  const [pending, setPending] = React.useState(0);
  const [scheduled, setScheduled] = React.useState(0);
  const [reqs, setReqs] = React.useState<RequestRow[]>([]);
  const [rfqs, setRfqs] = React.useState<RFQRow[]>([]);

  React.useEffect(() => {
    // Mock dataset for table virtualization; real data can replace later via props
    const depts = ['Production','Maintenance','HR','IT','Finance','Logistics','QA','R&D'];
    const buyers = ['Ali','Sara','Noura','Hani','Maya','Ziad'];
    const rnd = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));
    const rows: RequestRow[] = Array.from({ length: 800 }).map((_, i) => ({
      id: String(i+1),
      requestNo: `RQ-${1000 + i}`,
      requester: ['Ahmed','Omar','Lina','Yara','Faisal','Layla'][i % 6],
      department: depts[i % depts.length],
      date: new Date(Date.now() - rnd(0, 60) * 86400000).toISOString().slice(0,10),
      requiredDate: new Date(Date.now() + rnd(2, 30) * 86400000).toISOString().slice(0,10),
      status: (['Draft','Pending','Approved','Closed'] as const)[i % 4],
      priority: (['Normal','Urgent','Emergency'] as const)[(i * 7) % 3],
      totalValue: rnd(1200, 1200000),
      buyer: buyers[i % buyers.length],
      items: Array.from({ length: rnd(1, 4) }).map((__, j) => ({
        code: `ITM-${i}-${j}`,
        description: `Item ${i}-${j}`,
        qty: rnd(1, 15),
        uom: 'pcs',
        specs: '—',
        vendor: j % 2 ? 'Vendor A' : undefined,
      })),
    }));
    setReqs(rows);

    const rfqRows: RFQRow[] = Array.from({ length: 260 }).map((_, i) => ({
      id: `rfq-${i+1}`,
      rfqNo: `RFQ-${300 + i}`,
      requestNo: rows[i % rows.length].requestNo,
      vendor: ['Vendor A','Vendor B','Vendor C','Vendor D'][i % 4],
      submissionDate: new Date(Date.now() - rnd(0, 30) * 86400000).toISOString().slice(0,10),
      offerValue: rnd(800, 900000),
      currency: 'SAR',
      status: (['Received','Under Review','Approved','Rejected'] as const)[i % 4],
      compare: i % 5 === 0,
      lines: Array.from({ length: rnd(1, 4) }).map((__, j) => ({ item: `Item ${i}-${j}`, qty: rnd(1, 12), unitPrice: rnd(50, 900), delivery: `${rnd(3, 21)} days` })),
    }));
    setRfqs(rfqRows);

    // Mock KPIs
    setOpen(rows.filter(r => r.status==='Draft' || r.status==='Pending' || r.status==='Approved').length);
    setClosed(rows.filter(r => r.status==='Closed').length);
    setPending(rows.filter(r => r.status === 'Pending').length);
    // Treat "scheduled" as Approved requests with requiredDate at least 7 days in the future
    setScheduled(rows.filter(r => {
      const days = Math.ceil((new Date(r.requiredDate).getTime() - Date.now()) / 86400000);
      return r.status === 'Approved' && days >= 7;
    }).length);
  }, []);

  return { open, closed, pending, scheduled, reqs, rfqs };
}

// RequestsOverviewBlock: left side shows main KPIs (Open/Closed and optionally Pending/Scheduled),
// right side toggles between a Rose chart (Open/Closed/Pending/Scheduled) and the two secondary KPI cards.
// Icon components for KPIs
const IconFolderOpen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="#0ea5e9" strokeWidth="1.6" />
    <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h3" stroke="#0ea5e9" strokeWidth="1.6" />
  </svg>
);
const IconLock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="10" width="16" height="10" rx="2" stroke="#64748b" strokeWidth="1.6" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#64748b" strokeWidth="1.6" />
  </svg>
);
const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.6" />
    <path d="M12 7v5l4 2" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="#3b82f6" strokeWidth="1.6" />
    <path d="M3 9h18" stroke="#3b82f6" strokeWidth="1.6" />
    <path d="M8 2v4M16 2v4" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function RequestsOverviewBlock({
  open,
  closed,
  pending,
  scheduled,
}: { open: number; closed: number; pending: number; scheduled: number }) {
  const roseOption = React.useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    color: ['#22C55E', '#94a3b8', '#F59E0B', '#3B82F6'],
    legend: { show: false },
    series: [{
      type: 'pie',
      roseType: 'area',
      radius: ['20%','70%'],
      label: { show: true, formatter: '{b}\n{c} ({d}%)', color: cardTheme.muted() },
      labelLine: { show: true },
      data: [
        { name: 'Open', value: open },
        { name: 'Closed', value: closed },
        { name: 'Pending', value: pending },
        { name: 'Scheduled', value: scheduled }
      ],
    }],
  }), [open, closed, pending, scheduled]);

  const deptBars = React.useMemo(() => {
    const deps = ['Production','Maintenance','HR','IT','Finance','Logistics','QA','R&D'];
    const vals = deps.map((_, i) => 12 + ((i*7)%18));
    return { deps, vals };
  }, []);

  const barOption = React.useMemo(() => ({
    grid: { left: 28, right: 18, top: 16, bottom: 28, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => `${Number(v).toLocaleString()}` },
    xAxis: { type: 'category', data: deptBars.deps, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    series: [{ name: 'Requests', type: 'bar', data: deptBars.vals, barWidth: 18, itemStyle: { color: chartTheme.mkGradient(chartTheme.brandPrimary), borderRadius: [8,8,0,0] } }],
  }), [deptBars]);

  return (
    <BaseCard title="Requests Overview">
      {/* Row 1: four KPI cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
        <KPICard label="Open Requests" value={fmtInt(open)} delta={{ pct: '2.1%', trend: 'up' }} icon={<IconFolderOpen />} />
        <KPICard label="Closed Requests" value={fmtInt(closed)} delta={{ pct: '1.2%', trend: 'down' }} icon={<IconLock />} />
        <KPICard label="Pending Requests" value={fmtInt(pending)} delta={{ pct: '0.6%', trend: 'up' }} icon={<IconClock />} />
        <KPICard label="Scheduled Requests" value={fmtInt(scheduled)} delta={{ pct: '0.3%', trend: 'up' }} icon={<IconCalendar />} />
      </div>

      {/* Row 2: two charts side-by-side */}
      <Tooltip.Provider delayDuration={150}>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
          <BaseCard
            title="Open / Closed / Pending / Scheduled"
            subtitle="Distribution of request states"
            headerRight={
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                    <Info className="w-4 h-4 text-gray-600" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[260px]">
                  Breakdown of all requests by status. Use it to track workload and closure progress.
                </Tooltip.Content>
              </Tooltip.Root>
            }
          >
            <ReactECharts option={roseOption as any} style={{ height: 300 }} notMerge />
          </BaseCard>
          <BaseCard
            title="Requests by Department"
            subtitle="Departmental totals"
            headerRight={
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                    <Info className="w-4 h-4 text-gray-600" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[260px]">
                  Shows which departments create the most requests. Useful for planning capacity.
                </Tooltip.Content>
              </Tooltip.Root>
            }
          >
            <ReactECharts option={barOption as any} style={{ height: 300 }} notMerge />
          </BaseCard>
        </div>
      </Tooltip.Provider>
    </BaseCard>
  );
}

function Pill({ tone, children }: { tone: 'gray'|'blue'|'green'|'red'|'amber'; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    gray: 'bg-gray-50 text-gray-700 border border-gray-200',
    blue: 'bg-sky-50 text-sky-700 border border-sky-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] ${tones[tone]}`}>{children}</span>;
}

function RequestsTableBlock({ rows }: { rows: RequestRow[] }) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 12,
  });

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <BaseCard
      title="All Requests"
      headerRight={
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">Export</button>
          <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">Columns</button>
          <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">Filters</button>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-12 gap-2">
        <input className="md:col-span-3 h-10 rounded-lg border px-3 text-sm" placeholder="Date range" />
        <input className="md:col-span-2 h-10 rounded-lg border px-3 text-sm" placeholder="Department" />
        <input className="md:col-span-2 h-10 rounded-lg border px-3 text-sm" placeholder="Status" />
        <input className="md:col-span-2 h-10 rounded-lg border px-3 text-sm" placeholder="Type" />
        <input className="md:col-span-2 h-10 rounded-lg border px-3 text-sm" placeholder="Value band" />
        <input className="md:col-span-1 h-10 rounded-lg border px-3 text-sm" placeholder="Search…" />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: cardTheme.border() }}>
        <div className="grid grid-cols-[140px,140px,140px,120px,140px,120px,120px,140px,140px,120px] gap-0 text-[12px] font-semibold bg-gray-50 sticky top-0" style={{ borderBottom: `1px solid ${cardTheme.border()}` }}>
          <div className="px-3 py-2">Request No.</div>
          <div className="px-3 py-2">Requester</div>
          <div className="px-3 py-2">Department</div>
          <div className="px-3 py-2">Date</div>
          <div className="px-3 py-2">Required Date</div>
          <div className="px-3 py-2">Status</div>
          <div className="px-3 py-2">Priority</div>
          <div className="px-3 py-2 text-right">Total Value (SAR)</div>
          <div className="px-3 py-2">Buyer Assigned</div>
          <div className="px-3 py-2">Actions</div>
        </div>
        <div ref={parentRef} className="h-[480px] overflow-auto relative">
          <div style={{ height: totalSize }}>
            <div className="absolute top-0 left-0 w-full" style={{ transform: `translateY(${virtualItems[0]?.start ?? 0}px)` }}>
              {virtualItems.map(v => {
                const r = rows[v.index];
                const tone = r.status==='Draft'? 'gray' : r.status==='Pending'? 'amber' : r.status==='Approved'? 'green' : 'blue';
                const ptone = r.priority==='Normal'? 'gray' : r.priority==='Urgent'? 'amber' : 'red';
                return (
                  <div key={r.id} className="grid grid-cols-[140px,140px,140px,120px,140px,120px,120px,140px,140px,120px] text-sm border-b" style={{ borderColor: cardTheme.border(), height: 52 }}>
                    <button className="px-3 py-2 text-sky-700 underline underline-offset-2 text-left">{r.requestNo}</button>
                    <div className="px-3 py-2">{r.requester}</div>
                    <div className="px-3 py-2">{r.department}</div>
                    <div className="px-3 py-2">{r.date}</div>
                    <div className="px-3 py-2">{r.requiredDate}</div>
                    <div className="px-3 py-2"><Pill tone={tone as any}>{r.status}</Pill></div>
                    <div className="px-3 py-2"><Pill tone={ptone as any}>{r.priority}</Pill></div>
                    <div className="px-3 py-2 text-right tabular-nums">{fmtSAR(r.totalValue)}</div>
                    <div className="px-3 py-2">{r.buyer || '—'}</div>
                    <div className="px-3 py-2">
                      <div className="inline-flex gap-2 text-[12px] text-sky-700">
                        <button>View</button><button>Edit</button><button>Delete</button><button>Track</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

function LastImportantRequestsBlock({ rows, onView }: { rows: RequestRow[]; onView?: (id: string) => void }) {
  const loading = !rows;
  const error = false;

  const important = React.useMemo(() => {
    const parseDate = (s?: string) => {
      const t = s ? Date.parse(s) : NaN;
      return isNaN(t) ? 0 : t;
    };
    const rank = (p: RequestRow['priority']) => (p === 'Emergency' ? 2 : p === 'Urgent' ? 1 : 0);
    const sorted = [...(rows || [])].sort((a, b) => {
      const ra = rank(a.priority), rb = rank(b.priority);
      if (ra !== rb) return rb - ra; // emergency/urgent first
      const da = parseDate(a.date), db = parseDate(b.date);
      if (da !== db) return db - da; // newest first
      return (b.totalValue || 0) - (a.totalValue || 0); // then by value
    });
    return sorted.slice(0, 2);
  }, [rows]);

  const rel = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const days = Math.round((d.getTime() - Date.now()) / 86400000);
    if (days > 1) return `in ${days}d`;
    if (days === 1) return 'in 1d';
    if (days === 0) return 'today';
    return `${Math.abs(days)}d ago`;
  };

  const statusTone = (s: RequestRow['status']) =>
    s === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : s === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : s === 'Draft' ? 'bg-slate-50 text-slate-700 border border-slate-200'
    : 'bg-gray-50 text-gray-700 border border-gray-200'; // Closed

  const priorityTone = (p: RequestRow['priority']) =>
    p === 'Emergency' ? 'bg-rose-50 text-rose-700 border border-rose-200'
    : p === 'Urgent' ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-sky-50 text-sky-700 border border-sky-200';

  const Tile = ({ r }: { r: RequestRow }) => (
    <div className="h-full rounded-2xl border bg-white p-4 flex flex-col" style={{ borderColor: cardTheme.border() }}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onView?.(r.id)} className="font-semibold text-sm text-sky-700 hover:underline">
          {r.requestNo}
        </button>
        <ArrowUpRight className="w-4 h-4 text-gray-400" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusTone(r.status)}`}>{r.status}</span>
        <span className={`px-2 py-0.5 rounded-full text-[11px] ${priorityTone(r.priority)}`}>{r.priority}</span>
      </div>
      <div className="mt-2 text-[13px] text-gray-500">
        <span>{r.department}</span>
        <span className="mx-2">•</span>
        <span>{r.requester}</span>
        <span className="mx-2">•</span>
        <span>{rel(r.requiredDate)}</span>
      </div>
      <div className="mt-auto text-right text-[15px] font-semibold text-gray-900 tabular-nums">
        {fmtSAR(r.totalValue)} SAR
      </div>
    </div>
  );

  return (
    <BaseCard
      title="Important — Last 2 Requests"
      headerRight={
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
              <Info className="w-4 h-4 text-gray-600" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[280px]">
            Shows the two most important recent requests (urgent or highest value). Use this to monitor what needs attention now.
          </Tooltip.Content>
        </Tooltip.Root>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
          {[0,1].map(i => (
            <div key={i} className="h-full rounded-2xl border p-4" style={{ borderColor: cardTheme.border() }}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/3 bg-gray-100 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
                <div className="h-6 w-24 bg-gray-100 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded border border-red-200">Failed to load. <button className="underline">Retry</button></div>
      ) : important.length === 0 ? (
        <div className="p-3 text-sm text-gray-600">No important requests found for the selected period.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
          {important.map(r => <Tile key={r.id} r={r} />)}
        </div>
      )}
    </BaseCard>
  );
}

function UrgentRequestsRail({ rows, onView }: { rows: RequestRow[]; onView?: (id: string) => void }) {
  const urgent = React.useMemo(() => {
    const list = (rows || []).filter(r => (r.priority === 'Emergency' || r.priority === 'Urgent') && r.status !== 'Closed');
    list.sort((a,b) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0));
    return list.slice(0,2);
  }, [rows]);

  const rel = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (days > 0) return `in ${days}d`;
    if (days === 0) return 'today';
    return `overdue ${Math.abs(days)}d`;
  };

  const statusTone = (s: RequestRow['status']) =>
    s === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : s === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : s === 'Draft' ? 'bg-slate-50 text-slate-700 border border-slate-200'
    : 'bg-gray-50 text-gray-700 border border-gray-200';

  const priorityTone = (p: RequestRow['priority']) =>
    p === 'Emergency' ? 'bg-rose-50 text-rose-700 border border-rose-200'
    : p === 'Urgent' ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-sky-50 text-sky-700 border border-sky-200';

  const HaloDot = ({ active, overdue }: { active: boolean; overdue: boolean }) => (
    <span
      className={`relative inline-block w-2 h-2 rounded-full ${active? 'bg-emerald-500':'bg-gray-400'} ${active? 'pulse': ''}`}
      style={{ boxShadow: `${active? '0 0 0 10px rgba(16,185,129,0.18)':''}${overdue? (active? ',':'')+'0 0 0 16px rgba(245,158,11,0.15)':''}` }}
    />
  );

  const Card = ({ r }: { r: RequestRow }) => {
    const item = (r.items && r.items[0]) || undefined;
    const headline = item ? `${item.description} — ${item.qty} ${item.uom}` : `${(r.items?.length||0)} items`;
    const eta = rel(r.requiredDate);
    const active = r.status === 'Draft' || r.status === 'Pending' || r.status === 'Approved';
    const overdue = r.requiredDate ? (new Date(r.requiredDate).getTime() < Date.now()) : false;
    return (
      <button
        onClick={()=> onView?.(r.id)}
        className="w-full rounded-2xl border bg-white p-4 shadow-sm text-left transition will-change-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
        style={{ borderColor: cardTheme.border() }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="inline-flex items-center gap-2">
            <HaloDot active={active} overdue={overdue} />
            <span className="font-semibold text-[13px] text-gray-900 hover:underline">{r.requestNo}</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="mt-2 text-[13.5px] font-medium text-gray-900 line-clamp-2">{headline}</div>
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          <span className={`px-2 py-0.5 rounded-full ${statusTone(r.status)}`}>{r.status}</span>
          <span className={`px-2 py-0.5 rounded-full ${priorityTone(r.priority)}`}>{r.priority}</span>
          <span className="text-gray-500">{r.department}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500">{r.requester}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500">{eta}</span>
        </div>
        <div className="mt-2 text-right text-[14px] font-semibold text-gray-900 tabular-nums">{fmtSAR(r.totalValue)} SAR</div>
      </button>
    );
  };

  return (
    <div className="w-full">
      <BaseCard
        title="Urgent — Live Now"
        headerRight={
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                <Info className="w-4 h-4 text-gray-600" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content sideOffset={8} className="rounded-2xl border bg-white p-2 shadow-card text-xs max-w-[280px]">
              Shows the two most recent urgent requests that are still active. Use this rail to keep an eye on what needs immediate attention.
            </Tooltip.Content>
          </Tooltip.Root>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          {urgent.map(r => <Card key={r.id} r={r} />)}
          {urgent.length < 2 && <div className="rounded-2xl border p-4 text-sm text-gray-500" style={{ borderColor: cardTheme.border() }}>No more urgent requests.</div>}
        </div>
      </BaseCard>
      <style>{`
        @keyframes pulse { 0%{opacity:.6} 50%{opacity:1} 100%{opacity:.6} }
        .pulse { animation: pulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pulse { animation:none; } }
      `}</style>
    </div>
  );
}

function KpisInsightsBlock({ rows, onFilter }: { rows: RequestRow[]; onFilter?: (k: string) => void }) {
  const weeks = React.useMemo(() => Array.from({ length: 8 }).map((_, i) => `W-${8 - i}`), []);

  // Aggregated status counts and department aggregation for charts
  const counts = React.useMemo(() => {
    const isOpen = (s: RequestRow['status']) => s === 'Draft' || s === 'Pending' || s === 'Approved';
    const open = rows.filter(r => isOpen(r.status)).length;
    const closed = rows.filter(r => r.status === 'Closed').length;
    const pending = rows.filter(r => r.status === 'Pending').length;
    const scheduled = rows.filter(r => {
      const days = Math.ceil((Date.parse(r.requiredDate || '') - Date.now()) / 86400000);
      return r.status === 'Approved' && days >= 7;
    }).length;
    return { open, closed, pending, scheduled };
  }, [rows]);
  const deptAgg = React.useMemo(() => {
    const map = new Map<string, number>();
    (rows || []).forEach(r => map.set(r.department, (map.get(r.department) || 0) + 1));
    const deps = Array.from(map.keys());
    const vals = deps.map(d => map.get(d) || 0);
    return { deps, vals };
  }, [rows]);

  // ECharts options for donut and bar charts
  const statusDonutOpt = React.useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    color: ['#22C55E', '#94a3b8', '#F59E0B', '#3B82F6'],
    legend: { show: false },
    series: [{
      type: 'pie',
      roseType: 'area',
      radius: ['20%','70%'],
      label: { show: true, formatter: '{b}\n{c} ({d}%)', color: cardTheme.muted() },
      labelLine: { show: true },
      data: [
        { name: 'Open', value: counts.open },
        { name: 'Closed', value: counts.closed },
        { name: 'Pending', value: counts.pending },
        { name: 'Scheduled', value: counts.scheduled },
      ],
    }],
  }), [counts]);
  const deptBarsOpt = React.useMemo(() => ({
    grid: { left: 28, right: 18, top: 16, bottom: 28, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => `${Number(v).toLocaleString()}` },
    xAxis: { type: 'category', data: deptAgg.deps, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    series: [{ name: 'Requests', type: 'bar', data: deptAgg.vals, barWidth: 18, itemStyle: { color: chartTheme.mkGradient(chartTheme.brandPrimary), borderRadius: [8,8,0,0] } }],
  }), [deptAgg]);

  // KPIs for the four cards
  const K = [
    { k:'open', label:'Open Requests', value: counts.open, delta: { pct:'2.1%', trend:'up' as const }, icon: <Timer className="w-5 h-5" /> },
    { k:'closed', label:'Closed Requests', value: counts.closed, delta: { pct:'1.2%', trend:'down' as const }, icon: <CreditCard className="w-5 h-5" /> },
    { k:'pending', label:'Pending Requests', value: counts.pending, delta: { pct:'0.6%', trend:'up' as const }, icon: <Zap className="w-5 h-5" /> },
    { k:'scheduled', label:'Scheduled Requests', value: counts.scheduled, delta: { pct:'0.3%', trend:'up' as const }, icon: <Building2 className="w-5 h-5" /> },
  ];

  return (
    <Tooltip.Provider delayDuration={150}>
      <div className="space-y-6">
        {/* Block: KPIs & Trends */}
        <BaseCard title="KPIs & Trends">
          {/* Four KPI cards in a row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            {K.map(c => (
              <button key={c.k} onClick={() => onFilter?.(c.k)} className="text-left">
                <KPICard label={c.label} value={c.value} delta={c.delta as any} icon={c.icon} />
              </button>
            ))}
          </div>
          {/* Two charts side by side */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <BaseCard
              title="Open / Closed / Pending / Scheduled"
              subtitle="Distribution of request states"
              headerRight={
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                      <Info className="w-4 h-4 text-gray-600" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[260px]">
                    Breakdown of all requests by status. Use it to track workload and closure progress.
                  </Tooltip.Content>
                </Tooltip.Root>
              }
            >
              <ReactECharts option={statusDonutOpt as any} style={{ height: 300 }} notMerge />
            </BaseCard>
            <BaseCard
              title="Requests by Department"
              subtitle="Departmental totals"
              headerRight={
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                      <Info className="w-4 h-4 text-gray-600" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[260px]">
                    Shows which departments create the most requests. Useful for planning capacity.
                  </Tooltip.Content>
                </Tooltip.Root>
              }
            >
              <ReactECharts option={deptBarsOpt as any} style={{ height: 300 }} notMerge />
            </BaseCard>
          </div>
        </BaseCard>

        {/* Block: Last Important Requests */}
        <LastImportantRequestsBlock rows={rows} />
      </div>
    </Tooltip.Provider>
  );
}

function RFQsTableBlock({ rows }: { rows: RFQRow[] }) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current, estimateSize: () => 52, overscan: 10 });
  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();
  return (
    <BaseCard
      title="RFQs"
      headerRight={
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">Export</button>
          <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">Compare Mode</button>
        </div>
      }
    >
      <div className="mb-3 grid grid-cols-1 md:grid-cols-12 gap-2">
        <input className="md:col-span-2 h-10 rounded-lg border px-3 text-sm" placeholder="Request No" />
        <input className="md:col-span-3 h-10 rounded-lg border px-3 text-sm" placeholder="Vendor" />
        <input className="md:col-span-2 h-10 rounded-lg border px-3 text-sm" placeholder="Status" />
        <input className="md:col-span-2 h-10 rounded-lg border px-3 text-sm" placeholder="Date" />
        <input className="md:col-span-3 h-10 rounded-lg border px-3 text-sm" placeholder="Search RFQ No / Vendor" />
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: cardTheme.border() }}>
        <div className="grid grid-cols-[120px,160px,180px,140px,140px,100px,140px,120px,160px] text-[12px] font-semibold bg-gray-50" style={{ borderBottom: `1px solid ${cardTheme.border()}` }}>
          <div className="px-3 py-2">RFQ No.</div>
          <div className="px-3 py-2">Linked Request No.</div>
          <div className="px-3 py-2">Vendor</div>
          <div className="px-3 py-2">Submission Date</div>
          <div className="px-3 py-2">Offer Value</div>
          <div className="px-3 py-2">Currency</div>
          <div className="px-3 py-2">Status</div>
          <div className="px-3 py-2">Comparison</div>
          <div className="px-3 py-2">Actions</div>
        </div>
        <div ref={parentRef} className="h-[360px] overflow-auto relative">
          <div style={{ height: totalSize }}>
            <div className="absolute top-0 left-0 w-full" style={{ transform: `translateY(${virtualItems[0]?.start ?? 0}px)` }}>
              {virtualItems.map(v => {
                const r = rows[v.index];
                const tone = r.status==='Approved'? 'green' : r.status==='Rejected'? 'red' : r.status==='Under Review'? 'amber' : 'blue';
                return (
                  <div key={r.id} className="grid grid-cols-[120px,160px,180px,140px,140px,100px,140px,120px,160px] text-sm border-b" style={{ borderColor: cardTheme.border(), height: 52 }}>
                    <button className="px-3 py-2 text-sky-700 underline underline-offset-2 text-left">{r.rfqNo}</button>
                    <div className="px-3 py-2">{r.requestNo}</div>
                    <div className="px-3 py-2">{r.vendor}</div>
                    <div className="px-3 py-2">{r.submissionDate}</div>
                    <div className="px-3 py-2">{fmtSAR(r.offerValue)}</div>
                    <div className="px-3 py-2">{r.currency}</div>
                    <div className="px-3 py-2"><Pill tone={tone as any}>{r.status}</Pill></div>
                    <div className="px-3 py-2">{r.compare ? <span className="text-xs">In Compare</span> : '—'}</div>
                    <div className="px-3 py-2"><div className="inline-flex gap-2 text-[12px] text-sky-700"><button>View</button><button>Approve</button><button>Reject</button><button>Convert</button></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

function ConversionBlock({ open, closed }: { open: number; closed: number }) {
  const converted = Math.round((closed / Math.max(1, open + closed)) * 100);
  const donut = React.useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['45%','70%'], data: [ { name: 'Converted', value: closed }, { name: 'Not Converted', value: open } ] }],
  }), [open, closed]);
  const counts = React.useMemo(() => ({
    grid: { left: 28, right: 18, top: 16, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: ['Converted','Not'], axisLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    series: [{ type:'bar', data: [closed, open], barWidth: 22, itemStyle: { color: chartTheme.mkGradient(chartTheme.brandSecondary), borderRadius: [8,8,0,0] } }],
  }), [open, closed]);
  const stacked = React.useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 28, right: 18, top: 28, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: ['Converted Requests'] },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    series: [
      { name:'Approved', type:'bar', stack:'status', data:[Math.round(closed*0.6)], itemStyle:{ color:'#22C55E' }, barWidth: 28 },
      { name:'Under Review', type:'bar', stack:'status', data:[Math.round(closed*0.3)], itemStyle:{ color:'#F59E0B' }, barWidth: 28 },
      { name:'Rejected', type:'bar', stack:'status', data:[Math.max(0, closed - Math.round(closed*0.9))], itemStyle:{ color:'#EF4444' }, barWidth: 28 },
    ],
  }), [closed]);

  return (
    <BaseCard title="Conversion to RFQs" subtitle="Requests converted vs not converted">
      <Tooltip.Provider delayDuration={150}>
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: cardTheme.gap }}>
        {/* Donut — Conversion % */}
        <BaseCard
          title="Conversion %"
          subtitle="Converted vs Not Converted"
          headerRight={
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                  <Info className="w-4 h-4 text-gray-600" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[260px]">
                Shows the percentage of requests converted to RFQs. The center label indicates the overall conversion rate.
              </Tooltip.Content>
            </Tooltip.Root>
          }
        >
          <ReactECharts option={donut as any} style={{ height: 280 }} notMerge />
          <div className="mt-2 text-sm text-gray-600">Center: {converted}%</div>
        </BaseCard>

        {/* Counts Bar */}
        <BaseCard
          title="Counts"
          subtitle="Converted vs Not"
          headerRight={
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                  <Info className="w-4 h-4 text-gray-600" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[260px]">
                Raw counts of converted and not converted requests.
              </Tooltip.Content>
            </Tooltip.Root>
          }
        >
          <ReactECharts option={counts as any} style={{ height: 280 }} notMerge />
        </BaseCard>

        {/* Stacked Status of Converted */}
        <BaseCard
          title="RFQ Status of Converted"
          subtitle="Approved / Under Review / Rejected"
          headerRight={
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                  <Info className="w-4 h-4 text-gray-600" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[260px]">
                Breakdown of RFQ statuses for the converted requests.
              </Tooltip.Content>
            </Tooltip.Root>
          }
        >
          <ReactECharts option={stacked as any} style={{ height: 280 }} notMerge />
        </BaseCard>
      </div>
      </Tooltip.Provider>
    </BaseCard>
  );
}

function AdvancedReportsBlock() {
  const [tab, setTab] = React.useState<'A'|'B'|'C'>('A');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Option builders — styling only (no data logic changes)
  const line = (label: string, data: number[]) => ({
    grid: { left: 28, right: 18, top: 24, bottom: 28, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => `${Number(v).toLocaleString()}` },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    legend: { top: 0, right: 0 },
    series: [{ type:'line', name: label, data, smooth:true, areaStyle:{ opacity:.12 }, itemStyle:{ color: chartTheme.brandPrimary } }],
  });
  const bar = (cats: string[], data: number[]) => ({
    grid: { left: 28, right: 18, top: 24, bottom: 28, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => `${Number(v).toLocaleString()}` },
    xAxis: { type: 'category', data: cats, axisLabel: { interval: 0, formatter: (v: string) => (v && v.length > 12 ? v.slice(0, 12) + '…' : v) } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.neutralGrid() } } },
    legend: { top: 0, right: 0 },
    series: [{ type:'bar', data, itemStyle:{ color: chartTheme.mkGradient(chartTheme.brandPrimary), borderRadius:[8,8,0,0] } }],
  });
  const pie = (data: Array<{ name: string; value: number }>) => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%','70%'], data, itemStyle: { borderRadius: 8 } }],
  });

  // Grid and Chart card wrappers (each chart sits in its own BaseCard)
  const gridBaseCls = 'grid grid-cols-1 lg:grid-cols-12';
  const ChartCard = ({ title, subtitle, info, opt, spanClass, height }: { title: string; subtitle: string; info: string; opt: any; spanClass: string; height: number }) => (
    <div className={`${spanClass}`}>
      <BaseCard
        title={title}
        subtitle={subtitle}
        headerRight={
          <Tooltip.Root delayDuration={150}>
            <Tooltip.Trigger asChild>
              <button className="h-8 w-8 grid place-items-center rounded-lg border bg-white hover:bg-gray-50" aria-label="Info">
                <Info className="w-4 h-4 text-gray-600" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content sideOffset={8} className="rounded-xl border bg-white p-2 shadow-card text-xs max-w-[240px]">
              {info}
            </Tooltip.Content>
          </Tooltip.Root>
        }
      >
        <div className="w-full" style={{ height }}>
          <ReactECharts option={opt} style={{ height: '100%' }} notMerge />
        </div>
      </BaseCard>
    </div>
  );

  return (
    <BaseCard title="Advanced Reports" headerRight={
      <div className="inline-flex items-center gap-2">
        <select className="h-9 rounded-lg border px-2 text-sm"><option>This month</option><option>Last month</option><option>QTD</option><option>YTD</option><option>Custom</option></select>
        <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">Export</button>
      </div>
    }>
      <Tooltip.Provider delayDuration={150}>
      <div className="mb-4 inline-flex gap-2 text-sm">
        {['A','B','C'].map(k => (
          <button key={k} onClick={()=>setTab(k as any)} className={`px-3 py-1.5 rounded-full border ${tab===k?'bg-gray-900 text-white':'bg-white'}`}>Tab {k}</button>
        ))}
      </div>

      {tab==='A' && (
        <div className={gridBaseCls} style={{ gap: cardTheme.gap }}>
          <ChartCard
            spanClass="lg:col-span-6"
            title="Requests by Priority"
            subtitle="Normal / Urgent / Emergency"
            info="Shows the distribution of request priorities. Helps managers track critical vs routine requests."
            opt={pie([{ name:'Normal', value:62 },{ name:'Urgent', value:28 },{ name:'Emergency', value:10 }])}
            height={280}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="Requests by Department"
            subtitle="Departmental breakdown"
            info="Identifies which departments generate the most requests, useful for workload analysis."
            opt={pie([
              { name:'Production', value:60 },
              { name:'Maintenance', value:40 },
              { name:'HR', value:24 },
              { name:'IT', value:28 },
              { name:'Finance', value:34 },
            ])}
            height={280}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="Requests Aging (Open)"
            subtitle="Age groups of open requests"
            info="Highlights how long requests remain unresolved. Helps detect bottlenecks."
            opt={bar(['<7d','8-14d','15-30d','>30d'], [18,12,7,3])}
            height={300}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="Requests Value (SAR) by Month"
            subtitle="Monthly totals"
            info="Displays request values over time. Useful for budget forecasting."
            opt={bar(months, months.map((_,i)=> 120 + (i*15%200)))}
            height={300}
          />
        </div>
      )}

      {tab==='B' && (
        <div className={gridBaseCls} style={{ gap: cardTheme.gap }}>
          <ChartCard
            spanClass="lg:col-span-6"
            title="RFQs Status Breakdown"
            subtitle="Received / Under Review / Approved / Rejected"
            info="Summarizes the status of all RFQs. Useful for pipeline tracking."
            opt={pie([{ name:'Received', value:42 },{ name:'Under Review', value:28 },{ name:'Approved', value:20 },{ name:'Rejected', value:10 }])}
            height={280}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="RFQs Comparison Snapshot"
            subtitle="By Vendor"
            info="Compares vendor participation. Useful for competition analysis."
            opt={pie([{ name:'Vendor A', value:82 },{ name:'Vendor B', value:74 },{ name:'Vendor C', value:66 }])}
            height={280}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="RFQs per Request (Distribution)"
            subtitle="1, 2, 3, or 4+ quotes per request"
            info="Measures how many quotes are generated for each request. Helps evaluate sourcing coverage."
            opt={bar(['1','2','3','4+'], [24,18,9,3])}
            height={300}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="RFQs Value (SAR) by Month"
            subtitle="Monthly RFQ totals"
            info="Tracks RFQ financial volume over time. Useful for spend analysis."
            opt={bar(months, months.map((_,i)=> 100 + (i*13%180)))}
            height={300}
          />
        </div>
      )}

      {tab==='C' && (
        <div className={gridBaseCls} style={{ gap: cardTheme.gap }}>
          <ChartCard
            spanClass="lg:col-span-6"
            title="End-to-End Cycle Time"
            subtitle="Avg days per request"
            info="Shows average turnaround time. Useful for efficiency monitoring."
            opt={line('Avg days', months.map((_,i)=> 9 + (i*5%14)))}
            height={300}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="Budget vs Actual"
            subtitle="Monthly comparison"
            info="Compares planned budget vs actual spend. Highlights deviations."
            opt={bar(months, months.map((_,i)=> 120 + (i*9%160)))}
            height={300}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="Top Vendors (Win Rate)"
            subtitle="Vendor performance"
            info="Shows the percentage of RFQs won per vendor. Useful for evaluating vendor competitiveness."
            opt={bar(['A','B','C','D','E','F'], [72,64,58,44,38,30])}
            height={300}
          />
          <ChartCard
            spanClass="lg:col-span-6"
            title="Vendor Performance Radar"
            subtitle="Price / Speed / Delivery / Quality"
            info="Evaluates vendors across multiple performance metrics. Helps in strategic sourcing."
            opt={pie([{ name:'Price', value:80 },{ name:'Speed', value:70 },{ name:'Delivery', value:75 },{ name:'Quality', value:68 }])}
            height={280}
          />
        </div>
      )}
      </Tooltip.Provider>
    </BaseCard>
  );
}

export default function RequestsPage() {
  const { open, closed, pending, scheduled, reqs, rfqs } = useMockData();
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="Requests"
        menuItems={[
          { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" /> },
          { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" /> },
          { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" /> },
          { key: 'import-materials', label: 'Import Materials', icon: <Upload className="w-4.5 h-4.5" /> },
          { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" /> },
          { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-4.5 h-4.5" /> },
          { key: 'new-payment-request', label: 'New Payment Request', icon: <FileText className="w-4.5 h-4.5" /> },
        ]}
      />

      {/* Block 2 — Requests Overview */}
      <RequestsOverviewBlock open={open} closed={closed} pending={pending} scheduled={scheduled} />

      {/* Block 3 — Requests Table */}
      <RequestsTableBlock rows={reqs} />

      {/* Block 4 — KPIs & Insights */}
      <KpisInsightsBlock rows={reqs} />

      {/* Block 5 — RFQs Table */}
      <RFQsTableBlock rows={rfqs} />

      {/* Block 6 — Conversion */}
      <ConversionBlock open={open} closed={closed} />

      {/* Block 7 — Advanced Reports */}
      <AdvancedReportsBlock />

      {/* Block 8 — Recent Activity */}
      <BaseCard title="Recent Activity">
        <RecentActivityBlock />
      </BaseCard>
    </div>
  );
}
