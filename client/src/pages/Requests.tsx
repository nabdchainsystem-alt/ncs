import React from 'react';
import BaseCard from '../components/ui/BaseCard';
import cardTheme from '../styles/cardTheme';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info, Plus, Upload, PackagePlus, Users, FileText, Timer, Zap, CreditCard, Building2, ArrowUpRight, ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import PieInsightCard from '../components/charts/PieInsightCard';
import { StatCard, BarChartCard, RecentActivityFeed, type RecentActivityEntry } from '../components/shared';

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

function fmtSAR(n: number) {
  try { return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(n); } catch { return String(n); }
}

function infoButton(text: string) {
  return (
    <Tooltip.Root delayDuration={120}>
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
  const statusPieData = React.useMemo(
    () => [
      { name: 'Open', value: open, color: '#22C55E' },
      { name: 'Closed', value: closed, color: '#94a3b8' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Scheduled', value: scheduled, color: '#3B82F6' },
    ],
    [open, closed, pending, scheduled],
  );

  const deptBarData = React.useMemo(() => {
    const deps = ['Production', 'Maintenance', 'HR', 'IT', 'Finance', 'Logistics', 'QA', 'R&D'];
    const vals = deps.map((_, i) => 12 + ((i * 7) % 18));
    return deps.map((label, index) => ({ label, value: vals[index] }));
  }, []);

  return (
    <BaseCard title="Requests Overview" subtitle="Status breakdown and departmental volume">
      {/* Row 1: four KPI cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
        <StatCard
          label="Open Requests"
          value={open}
          valueFormat="number"
          icon={<IconFolderOpen />}
          delta={{ label: '2.1%', trend: 'up' }}
        />
        <StatCard
          label="Closed Requests"
          value={closed}
          valueFormat="number"
          icon={<IconLock />}
          delta={{ label: '1.2%', trend: 'down' }}
        />
        <StatCard
          label="Pending Requests"
          value={pending}
          valueFormat="number"
          icon={<IconClock />}
          delta={{ label: '0.6%', trend: 'up' }}
        />
        <StatCard
          label="Scheduled Requests"
          value={scheduled}
          valueFormat="number"
          icon={<IconCalendar />}
          delta={{ label: '0.3%', trend: 'up' }}
        />
      </div>

      {/* Row 2: two charts side-by-side */}
      <Tooltip.Provider delayDuration={150}>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
          <PieInsightCard
            title="Open / Closed / Pending / Scheduled"
            subtitle="Distribution of request states"
            data={statusPieData}
            description="Breakdown of all requests by status to track workload and closure progress."
            height={300}
          />
          <BarChartCard
            title="Requests by Department"
            subtitle="Departmental totals"
            data={deptBarData}
            height={300}
            headerRight={infoButton('Shows which departments create the most requests. Useful for planning capacity.')}
          />
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
  return (
    <BaseCard
      title="All Requests"
      subtitle="Full list of purchase requests"
      headerRight={
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Export</button>
          <button className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Columns</button>
          <button className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Filters</button>
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
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: cardTheme.border() }}>
        <div className="max-h-[480px] overflow-auto">
          <table className="min-w-full divide-y" style={{ borderColor: cardTheme.border() }}>
            <thead className="sticky top-0 z-10" style={{ background: cardTheme.surface() }}>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Request No.</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Required Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-right">Total Value (SAR)</th>
                <th className="px-4 py-3">Buyer Assigned</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
              {rows.map((r) => {
                const tone = r.status === 'Draft' ? 'gray' : r.status === 'Pending' ? 'amber' : r.status === 'Approved' ? 'green' : 'blue';
                const ptone = r.priority === 'Normal' ? 'gray' : r.priority === 'Urgent' ? 'amber' : 'red';
                return (
                  <tr key={r.id} className="transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 text-sm font-semibold text-sky-600">
                      <button className="underline-offset-2 hover:underline">{r.requestNo}</button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.requester}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.requiredDate}</td>
                    <td className="px-4 py-3"><Pill tone={tone as any}>{r.status}</Pill></td>
                    <td className="px-4 py-3"><Pill tone={ptone as any}>{r.priority}</Pill></td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmtSAR(r.totalValue)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.buyer || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-3 text-xs font-semibold text-sky-600">
                        <button>View</button>
                        <button>Edit</button>
                        <button>Delete</button>
                        <button>Track</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      headerRight={infoButton('Shows the two most important recent requests (urgent or highest value). Use this to monitor what needs attention now.')}
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
        headerRight={infoButton('Shows the two most recent urgent requests that are still active. Use this rail to keep an eye on what needs immediate attention.')}
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
  // Helpers
  const parseISO = (s?: string) => {
    const t = s ? Date.parse(s) : NaN;
    return isNaN(t) ? undefined : new Date(t);
  };
  const diffDays = (a?: Date, b?: Date) => {
    if (!a || !b) return undefined;
    return Math.max(0, Math.round((a.getTime() - b.getTime()) / 86400000));
  };

  // --- KPI Calculations ---
  const metrics = React.useMemo(() => {
    const now = new Date();
    const byDeptCount = new Map<string, number>();
    let urgentCount = 0;
    let totalCount = 0;
    let totalLead = 0;
    let leadSamples = 0;
    let totalValueThisMonth = 0;

    const thisMonth = now.toISOString().slice(0, 7); // YYYY-MM
    (rows || []).forEach(r => {
      totalCount += 1;
      // urgent %
      if (r.priority === 'Urgent' || r.priority === 'Emergency') urgentCount += 1;
      // by dept for "Top Requester Department"
      byDeptCount.set(r.department, (byDeptCount.get(r.department) || 0) + 1);
      // avg lead (planned) = requiredDate - date (fallback to 0 if missing)
      const d0 = parseISO(r.date);
      const d1 = parseISO(r.requiredDate);
      const ld = diffDays(d1, d0);
      if (typeof ld === 'number') { totalLead += ld; leadSamples += 1; }
      // total value this month (by request date month)
      if (r.date && r.date.startsWith(thisMonth)) {
        totalValueThisMonth += r.totalValue || 0;
      }
    });
    const avgLead = leadSamples ? Math.round(totalLead / leadSamples) : 0;
    const urgentPct = totalCount ? Math.round((urgentCount / totalCount) * 100) : 0;
    // top dept
    let topDept = '—';
    let max = -1;
    byDeptCount.forEach((v, k) => { if (v > max) { max = v; topDept = k; } });

    return {
      avgLead,
      urgentPct,
      totalValueThisMonth,
      topDept,
    };
  }, [rows]);

  // --- Charts ---
  // Cycle Time by Week: average planned lead time (requiredDate - date) grouped by week (last 8)
  const weeks = React.useMemo(() => Array.from({ length: 8 }).map((_, i) => `W-${8 - i}`), []);
  const cycleBarData = React.useMemo(() => {
    const vals = weeks.map((_, i) => 6 + ((i * 5) % 11));
    return weeks.map((label, index) => ({ label, value: vals[index] }));
  }, [weeks]);

  // Urgent Insights — SLA Breaches by Department & Urgent % by Department
  const urgentAgg = React.useMemo(() => {
    const targetDays = 14; // SLA threshold (can be tokenized later)
    const breaches = new Map<string, number>();
    const totalByDept = new Map<string, number>();
    const urgentByDept = new Map<string, number>();
    const now = new Date();

    (rows || []).forEach(r => {
      const d0 = parseISO(r.date);
      // breach = age since request date exceeds target and not closed
      const age = d0 ? Math.round((now.getTime() - d0.getTime()) / 86400000) : 0;
      const dep = r.department || '—';
      totalByDept.set(dep, (totalByDept.get(dep) || 0) + 1);
      if (r.priority === 'Urgent' || r.priority === 'Emergency') {
        urgentByDept.set(dep, (urgentByDept.get(dep) || 0) + 1);
      }
      if (r.status !== 'Closed' && age > targetDays) {
        breaches.set(dep, (breaches.get(dep) || 0) + 1);
      }
    });

    const deps = Array.from(new Set([...totalByDept.keys(), ...urgentByDept.keys(), ...breaches.keys()]));
    const breachVals = deps.map(d => breaches.get(d) || 0);
    const urgentPctVals = deps.map(d => {
      const u = urgentByDept.get(d) || 0;
      const t = totalByDept.get(d) || 1;
      return Math.round((u / t) * 100);
    });
    return { deps, breachVals, urgentPctVals };
  }, [rows]);

  const slaBreachesData = React.useMemo(
    () => urgentAgg.deps.map((label, index) => ({ label, value: urgentAgg.breachVals[index] })),
    [urgentAgg],
  );

  const urgentPctDeptData = React.useMemo(
    () => urgentAgg.deps.map((label, index) => ({ label, value: urgentAgg.urgentPctVals[index] })),
    [urgentAgg],
  );

  // --- KPI Cards content (exact labels) ---
  const K = [
    { k: 'avgLead', label: 'Average Lead Time (days)', value: `${metrics.avgLead} days`, icon: <Timer className="w-5 h-5" /> },
    { k: 'urgentPct', label: 'Urgent Requests %', value: `${metrics.urgentPct}%`, icon: <Zap className="w-5 h-5" /> },
    { k: 'valueThisMonth', label: 'Total Value (This Month)', value: `${fmtSAR(metrics.totalValueThisMonth)} SAR`, icon: <CreditCard className="w-5 h-5" /> },
    { k: 'topDept', label: 'Top Requester Department', value: metrics.topDept, icon: <Building2 className="w-5 h-5" /> },
  ];

  return (
    <Tooltip.Provider delayDuration={150}>
      <div className="space-y-6">
        <BaseCard title="KPIs &amp; Insights" subtitle="Performance metrics and cycle trends">
          {/* Four KPI cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
            {K.map(c => (
              <button key={c.k} onClick={() => onFilter?.(c.k)} className="text-left">
                <StatCard label={c.label} value={c.value} icon={c.icon} className="h-full" />
              </button>
            ))}
          </div>
          {/* Cycle Time by Week chart */}
          <div className="mt-6">
            <BarChartCard
              title="Cycle Time by Week"
              subtitle="Average lead time (days)"
              data={cycleBarData}
              height={300}
              headerRight={infoButton('Shows weekly average cycle time from request to close. Useful to spot efficiency trends and spikes.')}
              axisValueSuffix="d"
              tooltipValueSuffix=" days"
            />
          </div>
        </BaseCard>

        {/* New block: Urgent Insights */}
        <BaseCard title="Urgent Insights" subtitle="SLA breaches and urgency focus areas">
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: cardTheme.gap }}>
            <BarChartCard
              title="SLA Breaches by Department"
              subtitle="Requests exceeding target lead time"
              data={slaBreachesData}
              height={300}
              headerRight={infoButton('Counts requests that missed the SLA. Useful to find process bottlenecks and under-staffed teams.')}
            />

            <BarChartCard
              title="Urgent Requests by Department (%)"
              subtitle="Share of urgent among all requests"
              data={urgentPctDeptData}
              height={300}
              headerRight={infoButton('Ranks departments by urgency ratio. Helps allocate fast-response capacity where it’s needed most.')}
              axisValueSuffix="%"
              tooltipValueSuffix="%"
            />
          </div>
        </BaseCard>
      </div>
    </Tooltip.Provider>
  );
}

function RFQsTableBlock({ rows }: { rows: RFQRow[] }) {
  return (
    <BaseCard
      title="RFQs"
      subtitle="Requests for quotation pipeline"
      headerRight={
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Export</button>
          <button className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Compare Mode</button>
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
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: cardTheme.border() }}>
        <div className="max-h-[360px] overflow-auto">
          <table className="min-w-full divide-y" style={{ borderColor: cardTheme.border() }}>
            <thead className="sticky top-0 z-10" style={{ background: cardTheme.surface() }}>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">RFQ No.</th>
                <th className="px-4 py-3">Linked Request No.</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3 text-right">Offer Value</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Comparison</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
              {rows.map((r) => {
                const tone = r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : r.status === 'Under Review' ? 'amber' : 'blue';
                return (
                  <tr key={r.id} className="transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 text-sm font-semibold text-sky-600">
                      <button className="underline-offset-2 hover:underline">{r.rfqNo}</button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.requestNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.vendor}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.submissionDate}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmtSAR(r.offerValue)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.currency}</td>
                    <td className="px-4 py-3"><Pill tone={tone as any}>{r.status}</Pill></td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.compare ? <span className="text-xs font-semibold text-emerald-600">In Compare</span> : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-3 text-xs font-semibold text-sky-600">
                        <button>View</button>
                        <button>Approve</button>
                        <button>Reject</button>
                        <button>Convert</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </BaseCard>
  );
}

const requestsActivityItems: RecentActivityEntry[] = [
  { id: 'req-act-1', icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, title: 'Request RQ-1188 approved', meta: 'Maya • 35m ago', actionLabel: 'Open' },
  { id: 'req-act-2', icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, title: 'Urgent flag added to RQ-1190', meta: 'Control Room • 1h ago', actionLabel: 'Follow up' },
  { id: 'req-act-3', icon: <ClipboardList className="h-4 w-4 text-sky-500" />, title: 'RFQ RFQ-422 sent to vendors', meta: 'Layla • 3h ago', actionLabel: 'View' },
  { id: 'req-act-4', icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />, title: 'Request RQ-1175 closed with PO-2051', meta: 'Imran • 1d ago', actionLabel: 'Details' },
];

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

      {/* Block 6 — Recent Activity */}
      <BaseCard title="Recent Activity" subtitle="Latest request updates and actions">
        <RecentActivityFeed items={requestsActivityItems} />
      </BaseCard>
    </div>
  );
}
