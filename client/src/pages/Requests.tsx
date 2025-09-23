import React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Download,
  Scale,
  Pause,
  X,
  ClipboardList,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Send,
  Upload,
  Trash2,
  TrendingUp,
  Zap,
  Timer,
  Lock,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import BaseCard from "../components/ui/BaseCard";
import NewRequestModal from "../components/NewRequestModal";
import RequestDetailsModal from "../components/requests/RequestDetailsModal";
import EditRequestModal, { type RequestForEdit } from "../components/requests/EditRequestModal";
import ImportRequestsModal from "../components/requests/ImportRequestsModal";
import RequestsTasksCard from "../components/requests/TasksCard";
import {
  listRequests,
  deleteRequest,
  updateRequestApproval,
  type RequestDTO,
  type RequestApprovalStatus,
  type RfqRecordDTO,
} from "../lib/api";
import { StatCard } from "../components/shared/StatCard";
import { BarChartCard, type BarChartPoint } from "../components/shared/BarChartCard";
import { RecentActivityFeed, type RecentActivityEntry } from "../components/shared/RecentActivityFeed";
import PieInsightCard from "../components/charts/PieInsightCard";
import type { PieChartDatum } from "../components/charts/PieChart";
import * as Tooltip from "@radix-ui/react-tooltip";
import { toast } from "react-hot-toast";
import QuotationModal from "../components/QuotationModal";
import {
  useRfqStore,
  refreshRfqs,
  openRfq,
  removeRfq,
  sendRfqToPo,
} from "../stores/useRfqStore";
import { apiClient } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useApiHealth } from "../context/ApiHealthContext";

const APPROVAL_CONTROLS: Array<{ value: RequestApprovalStatus; icon: React.ReactNode; tone: 'emerald' | 'red' | 'sky'; label: string }> = [
  { value: 'Approved', icon: <Check className="h-4 w-4" />, tone: 'emerald', label: 'Approved' },
  { value: 'Rejected', icon: <X className="h-4 w-4" />, tone: 'red', label: 'Rejected' },
  { value: 'OnHold', icon: <Pause className="h-4 w-4" />, tone: 'sky', label: 'On Hold' },
];

const formatApprovalLabel = (value: RequestApprovalStatus) => (value === 'OnHold' ? 'On Hold' : value);
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const generateOrderNumber = () => {
  const now = new Date();
  const prefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PO-${prefix}-${random}`;
};

const statusBadgeClass = (status?: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("approved")) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  if (normalized.includes("reject")) return "bg-red-50 text-red-600 border border-red-200";
  if (normalized.includes("pending")) return "bg-amber-50 text-amber-600 border border-amber-200";
  if (normalized.includes("completed")) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  if (normalized.includes("closed")) return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-sky-50 text-sky-600 border border-sky-200";
};

const priorityBadgeClass = (priority?: string) => {
  const normalized = (priority || "").toLowerCase();
  if (normalized === "high") return "bg-rose-50 text-rose-600 border border-rose-200";
  if (normalized === "low") return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-sky-50 text-sky-600 border border-sky-200";
};

const quotationStatusBadgeClass = (status: string) => {
  const value = status as QuotationStatus;
  switch (value) {
    case 'Approved':
    case 'SentToPO':
    case 'Completed':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    case 'Rejected':
      return 'bg-rose-50 text-rose-600 border border-rose-200';
    case 'Sent':
      return 'bg-sky-50 text-sky-600 border border-sky-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const approvalBadgeClass = (approval?: RequestApprovalStatus | null) => {
  switch (approval) {
    case 'Approved':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    case 'Rejected':
      return 'bg-rose-50 text-rose-600 border border-rose-200';
    case 'OnHold':
      return 'bg-sky-50 text-sky-600 border border-sky-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const normalizePriorityLabel = (priority?: string) => {
  if (!priority) return "—";
  const normalized = priority.toLowerCase();
  if (normalized === "medium") return "Normal";
  return priority;
};

const toEditPayload = (request: RequestDTO): RequestForEdit => ({
  id: Number(request.id ?? 0) || 0,
  requestNo: request.requestNo,
  department: request.department,
  warehouse: request.warehouse,
  machine: request.machine,
  date: request.requiredDate ?? request.dateRequested ?? undefined,
  items: (request.items || []).map((item) => ({
    id: Number(item.id ?? 0) || undefined,
    name: item.description ?? item.name ?? "",
    code: item.code ?? undefined,
    qty: Number(item.qty ?? 0),
    unit: item.unit ?? undefined,
  })),
});

const sortFieldForColumn: Record<string, string | null> = {
  requestNo: "orderNo",
  dateRequested: "createdAt",
  description: null,
  department: null,
  warehouse: null,
  machine: null,
  status: "status",
  priority: "priority",
};

type OverviewSummary = {
  total: number;
  open: number;
  closed: number;
  approved: number;
  rejected: number;
  pending: number;
  urgent: number;
  topDepartments: Array<{ name: string; count: number }>;
  newInLastWeek: number;
  stateDistribution: PieChartDatum[];
  departmentTotals: BarChartPoint[];
};

type KpiSummary = {
  averageLeadTime: number;
  urgentPercentage: number;
  totalValueThisMonth: number;
  topDepartment: string;
  cycleTimeByWeek: BarChartPoint[];
};

type UrgentInsights = {
  breachesByDepartment: BarChartPoint[];
  urgentShareByDepartment: BarChartPoint[];
};

type AnalyticsBundle = {
  overview: OverviewSummary;
  kpis: KpiSummary;
  urgent: UrgentInsights;
  recentActivity: RecentActivityEntry[];
};

type QuotationItem = {
  id: string;
  code?: string | null;
  name?: string;
  qty: number;
  unit?: string | null;
  unitPrice?: number;
};

type QuotationStatus = "Draft" | "Sent" | "Approved" | "Rejected" | "SentToPO" | string;

type QuotationRow = {
  id: string;
  quotationNo: string | null;
  requestId: string | null;
  requestNo: string | null;
  vendor?: string | null;
  status: QuotationStatus;
  locked?: boolean;
  items: QuotationItem[];
  notes?: string;
  poNumber?: string | null;
};

const DAY = 86400000;

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function mapRfqToQuotationRow(rfq: RfqRecordDTO, notes: Record<string, string>): QuotationRow {
  const requestId = rfq.requestId ?? rfq.request?.id ?? null;
  return {
    id: rfq.id,
    quotationNo: rfq.quotationNo != null ? String(rfq.quotationNo) : null,
    requestId: requestId != null ? String(requestId) : null,
    requestNo: rfq.request?.orderNo ?? rfq.requestNo ?? null,
    vendor: rfq.vendorName ?? null,
    status: rfq.status ?? 'Draft',
    locked: Boolean(rfq.locked),
    items: (rfq.items ?? []).map((item) => ({
      id: item.id,
      code: item.materialNo ?? null,
      name: item.description ?? undefined,
      qty: Number(item.qty ?? 0) || 0,
      unit: item.unit ?? null,
      unitPrice: Number(item.unitPriceSar ?? 0) || 0,
    })),
    notes: notes[rfq.id] ?? '',
    poNumber: null,
  };
}

function computeItemPrice(item: QuotationItem): number {
  if (typeof item.unitPrice !== "number") return 0;
  return Math.round((item.unitPrice || 0) * (item.qty || 0) * 100) / 100;
}

function relativeTimeFromNow(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "just now";
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.ceil(diff / 3600000);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.ceil(diff / DAY);
  return `${days}d ago`;
}

function computeAnalytics(requests: RequestDTO[], lockedRequestIds: Set<string> = new Set()): AnalyticsBundle {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let open = 0;
  let approved = 0;
  let closed = 0;
  let rejected = 0;
  let pending = 0;
  let urgent = 0;
  let newInLastWeek = 0;
  let approvalPending = 0;
  let approvalApproved = 0;
  let approvalRejected = 0;
  let approvalOnHold = 0;

  const departmentCounts = new Map<string, number>();
  const urgentBuckets = new Map<string, { total: number; urgent: number }>();
  const breachCounts = new Map<string, number>();
  const cycleBuckets = Array.from({ length: 8 }, () => ({ sum: 0, count: 0 }));

  let totalLeadSum = 0;
  let totalLeadCount = 0;
  let totalValueThisMonth = 0;

  const activityItems: Array<{ entry: RecentActivityEntry; timestamp: number }> = [];

  const normalizedRequests = [...requests];

  normalizedRequests.forEach((req) => {
    const status = (req.status || '').toLowerCase();
    const statusRaw = (req.statusRaw || '').toLowerCase();
    const combinedStatus = `${status} ${statusRaw}`.trim();
    const statusCompact = combinedStatus.replace(/\s|_/g, '');
    const priority = (req.priority || '').toLowerCase();
    const department = req.department || 'Unassigned';
    const createdAt = parseDate(req.createdAt) ?? parseDate(req.dateRequested);
    const requiredDate = parseDate(req.requiredDate);

    const requestId = String(req.id ?? '');
    const isLocked = requestId ? lockedRequestIds.has(requestId) : false;
    const isClosed =
      isLocked ||
      combinedStatus.includes('completed') ||
      combinedStatus.includes('closed') ||
      combinedStatus.includes('done') ||
      statusCompact.includes('senttopo') ||
      statusCompact.includes('pocompleted');

    if (!isClosed) open += 1;
    if (combinedStatus.includes('approved')) approved += 1;
    if (combinedStatus.includes('reject')) rejected += 1;
    if (combinedStatus.includes('pending') || combinedStatus.includes('review') || combinedStatus.includes('hold')) pending += 1;
    if (priority === 'high') urgent += 1;
    if (isClosed) closed += 1;

    const approval = (req.approval ?? 'Pending') as RequestApprovalStatus;
    if (approval === 'Approved') approvalApproved += 1;
    else if (approval === 'Rejected') approvalRejected += 1;
    else if (approval === 'OnHold') approvalOnHold += 1;
    else approvalPending += 1;

    if (createdAt) {
      const ageDays = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / DAY));
      if (ageDays <= 7) newInLastWeek += 1;

      const weeksAgo = Math.floor((now.getTime() - createdAt.getTime()) / (7 * DAY));
      if (weeksAgo >= 0 && weeksAgo < 8) {
        const bucketIndex = 7 - weeksAgo;
        if (requiredDate) {
          const lead = Math.max(0, Math.round((requiredDate.getTime() - createdAt.getTime()) / DAY));
          cycleBuckets[bucketIndex].sum += lead;
          cycleBuckets[bucketIndex].count += 1;
        }
      }

      if (!isClosed && ageDays > 14) {
        breachCounts.set(department, (breachCounts.get(department) ?? 0) + 1);
      }
    }

    departmentCounts.set(department, (departmentCounts.get(department) ?? 0) + 1);

    if (!urgentBuckets.has(department)) urgentBuckets.set(department, { total: 0, urgent: 0 });
    const bucket = urgentBuckets.get(department)!;
    bucket.total += 1;
    if (priority === 'high') bucket.urgent += 1;

    if (createdAt && requiredDate) {
      const lead = Math.max(0, Math.round((requiredDate.getTime() - createdAt.getTime()) / DAY));
      totalLeadSum += lead;
      totalLeadCount += 1;
    }

    const monthKey = createdAt ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}` : null;
    if (monthKey === currentMonthKey) {
      const quantity = (req.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      totalValueThisMonth += quantity;
    }

    const baseIcon = combinedStatus.includes('approved')
      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      : priority === 'high'
        ? <AlertTriangle className="h-4 w-4 text-amber-500" />
        : combinedStatus.includes('rfq')
          ? <Send className="h-4 w-4 text-sky-500" />
          : <Activity className="h-4 w-4 text-slate-500" />;

    activityItems.push({
      entry: {
        id: `${req.id}-activity`,
        icon: baseIcon,
        title: `Request ${req.requestNo}${status ? ` ${status}` : ''}`.trim(),
        meta: `${department} • ${relativeTimeFromNow(req.createdAt ?? req.dateRequested)}`,
        actionLabel: combinedStatus.includes('approved') ? 'Open' : priority === 'high' ? 'Follow up' : combinedStatus.includes('rfq') ? 'View' : 'Details',
      },
      timestamp: (parseDate(req.createdAt) ?? parseDate(req.dateRequested) ?? new Date(0)).getTime(),
    });
  });

  const overview: OverviewSummary = {
    total: normalizedRequests.length,
    open,
    closed,
    approved,
    rejected,
    pending,
    urgent,
    topDepartments: Array.from(departmentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count })),
    newInLastWeek,
    stateDistribution: [
      { name: 'Pending', value: approvalPending },
      { name: 'Approved', value: approvalApproved },
      { name: 'Rejected', value: approvalRejected },
      { name: 'On Hold', value: approvalOnHold },
    ],
    departmentTotals: Array.from(departmentCounts.entries()).map(([name, count]) => ({ label: name, value: count })),
  };

  const cycleTimeByWeek: BarChartPoint[] = cycleBuckets.map((bucket, idx) => ({
    label: `W-${8 - idx}`,
    value: bucket.count ? Math.round(bucket.sum / bucket.count) : 0,
  }));

  const urgentShareByDepartment: BarChartPoint[] = Array.from(urgentBuckets.entries()).map(([dept, stats]) => ({
    label: dept,
    value: stats.total ? Math.round((stats.urgent / stats.total) * 100) : 0,
  }));

  const breachesByDepartment: BarChartPoint[] = Array.from(departmentCounts.entries()).map(([dept]) => ({
    label: dept,
    value: breachCounts.get(dept) ?? 0,
  }));

  const averageLeadTime = totalLeadCount ? Math.round(totalLeadSum / totalLeadCount) : 0;
  const urgentPercentage = normalizedRequests.length ? urgent / normalizedRequests.length : 0;
  const topDepartment = overview.topDepartments[0]?.name ?? '—';

  const kpis: KpiSummary = {
    averageLeadTime,
    urgentPercentage,
    totalValueThisMonth: Math.round(totalValueThisMonth),
    topDepartment,
    cycleTimeByWeek,
  };

  const urgentInsights: UrgentInsights = {
    breachesByDepartment,
    urgentShareByDepartment,
  };

  const recentActivity = activityItems
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((item) => item.entry);

  return {
    overview,
    kpis,
    urgent: urgentInsights,
    recentActivity,
  };
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = React.useState<RequestDTO[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_OPTIONS[0]);
  const [sortBy, setSortBy] = React.useState<string>("createdAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [showNewModal, setShowNewModal] = React.useState(false);
  const [viewTarget, setViewTarget] = React.useState<RequestDTO | null>(null);
  const [editTarget, setEditTarget] = React.useState<RequestDTO | null>(null);

  const [busyApproval, setBusyApproval] = React.useState<string | null>(null);
  const [busyDelete, setBusyDelete] = React.useState<string | null>(null);
  const { rfqs, loading: rfqLoading } = useRfqStore();
  const [activeRfqId, setActiveRfqId] = React.useState<string | null>(null);
  const [comparisonRequestId, setComparisonRequestId] = React.useState<string | null>(null);
  const [rfqSortBy, setRfqSortBy] = React.useState<'quotationNo' | 'requestNo' | 'vendor' | 'status'>('quotationNo');
  const [rfqSortDir, setRfqSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [rfqPage, setRfqPage] = React.useState(1);
  const [rfqPageSize, setRfqPageSize] = React.useState(PAGE_SIZE_OPTIONS[0]);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [rfqNotes, setRfqNotes] = React.useState<Record<string, string>>({});
  const [sendOrderTarget, setSendOrderTarget] = React.useState<QuotationRow | null>(null);
  const [sendOrderNo, setSendOrderNo] = React.useState('');
  const [sendOrderLoading, setSendOrderLoading] = React.useState(false);
  const { healthy, disableWrites } = useApiHealth();

  const [analyticsDataset, setAnalyticsDataset] = React.useState<RequestDTO[]>([]);
  const [analyticsLoaded, setAnalyticsLoaded] = React.useState(false);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = React.useState(0);

  const refreshAnalytics = React.useCallback(() => {
    setAnalyticsRefreshKey((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!healthy) {
      setAnalyticsDataset([]);
      setAnalyticsLoaded(true);
      setAnalyticsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setAnalyticsLoading(true);

    const params: Record<string, any> = {};
    const trimmedSearch = search.trim();
    if (trimmedSearch) params.q = trimmedSearch;

    listRequests(params)
      .then((res) => {
        if (cancelled) return;
        setAnalyticsDataset(res.items ?? []);
        setAnalyticsLoaded(true);
      })
      .catch((_err: any) => {
        if (cancelled) return;
        setAnalyticsLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [healthy, search, analyticsRefreshKey]);

  const quotations = React.useMemo(
    () => rfqs.map((rfq) => mapRfqToQuotationRow(rfq, rfqNotes)),
    [rfqs, rfqNotes]
  );

  const lockedRequestIds = React.useMemo(() => {
    const set = new Set<string>();
    quotations.forEach((quotation) => {
      if (quotation.locked && quotation.requestId) {
        set.add(String(quotation.requestId));
      }
    });
    return set;
  }, [quotations]);

  const comparisonQuotations = React.useMemo(
    () => (comparisonRequestId ? quotations.filter((q) => q.requestId === comparisonRequestId) : []),
    [quotations, comparisonRequestId]
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalRfqs = quotations.length;
  const totalRfqPages = Math.max(1, Math.ceil(totalRfqs / rfqPageSize));
  const analytics = React.useMemo(
    () => computeAnalytics(analyticsDataset, lockedRequestIds),
    [analyticsDataset, lockedRequestIds],
  );

  const approvedFromRequests = React.useMemo(
    () => analyticsDataset.filter((req) => String(req.approval ?? '').toLowerCase() === 'approved').length,
    [analyticsDataset],
  );

  const analyticsLoadingState = analyticsLoading && !analyticsLoaded;

  const overviewData = React.useMemo(
    () => ({ ...analytics.overview, approved: approvedFromRequests }),
    [analytics.overview, approvedFromRequests],
  );

  const fetchData = React.useCallback(async () => {
    if (!healthy) {
      setRequests([]);
      setTotal(0);
      setError('Backend unavailable');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await listRequests({
        page,
        pageSize,
        sortBy,
        sortDir,
        q: search.trim() ? search.trim() : undefined,
      });
      setRequests(res.items ?? []);
      setTotal(res.total ?? (res.items ?? []).length);
      setError(null);
    } catch (err: any) {
      setRequests([]);
      setTotal(0);
      setError(err?.message ?? 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [healthy, page, pageSize, sortBy, sortDir, search]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    setRfqPage((current) => {
      if (current < 1) return 1;
      if (current > totalRfqPages) return totalRfqPages;
      return current;
    });
  }, [totalRfqPages]);

  React.useEffect(() => {
    if (disableWrites) {
      setShowNewModal(false);
      setShowImportModal(false);
      setEditTarget(null);
    }
  }, [disableWrites]);

  React.useEffect(() => {
    if (!healthy) {
      return () => {};
    }
    let mounted = true;
    refreshRfqs().catch((err: any) => {
      if (!mounted) return;
      toast.error(err?.message ?? 'Failed to load RFQs');
    });
    return () => {
      mounted = false;
    };
  }, [healthy]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleOpenQuotation = (id: string) => {
    setActiveRfqId(id);
  };

  const handleCloseQuotationModal = () => {
    setActiveRfqId(null);
  };

  const handleOpenComparison = (requestId: string) => {
    setComparisonRequestId(requestId);
  };

  const handleCloseComparison = () => {
    setComparisonRequestId(null);
  };

  const handleAddOffer = (requestId: string) => {
    void requestId;
    toast.error('Creating additional offers is not yet supported in the server RFQ flow');
  };

  const handleComparisonNoteChange = (quotationId: string, value: string) => {
    const target = quotations.find((q) => q.id === quotationId);
    if (target?.locked) return;
    setRfqNotes((prev) => ({ ...prev, [quotationId]: value }));
  };

  const toggleSort = (columnKey: string) => {
    const field = sortFieldForColumn[columnKey];
    if (!field) return;
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "createdAt" ? "desc" : "asc");
    }
  };

  const handleApprovalChange = async (request: RequestDTO, approval: RequestApprovalStatus) => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    const statusNormalized = String(request.status ?? '').toLowerCase();
    if (statusNormalized.includes('completed')) {
      toast.error('Request is locked because the purchase order was completed');
      return;
    }
    if ((request.approval ?? 'Pending') === approval) return;
    setBusyApproval(request.id);
    try {
      await updateRequestApproval(request.id, approval);
      toast.success(`Approval updated to ${formatApprovalLabel(approval)}`);
      await fetchData();
      refreshAnalytics();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update approval");
    } finally {
      setBusyApproval(null);
    }
  };

  const handleDelete = async (request: RequestDTO) => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    const statusNormalized = String(request.status ?? '').toLowerCase();
    if (statusNormalized.includes('completed')) {
      toast.error('Request is locked because the purchase order was completed');
      return;
    }
    const confirmed = window.confirm(`Delete request ${request.requestNo}?`);
    if (!confirmed) return;
    setBusyDelete(request.id);
    try {
      await deleteRequest(request.id);
      toast.success("Request deleted");
      await fetchData();
      refreshAnalytics();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete request");
    } finally {
      setBusyDelete(null);
    }
  };

  const handleSendRFQ = async (request: RequestDTO, lockedOverride = false) => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    if (lockedOverride) {
      toast.error('Request is locked because the purchase order was completed');
      return;
    }
    if (request.approval !== "Approved") {
      toast.error("Approve the request before creating an RFQ");
      return;
    }

    const requestIdNumber = Number(request.id);
    if (!Number.isFinite(requestIdNumber)) {
      toast.error('Invalid request identifier');
      return;
    }

    try {
      const record = await openRfq({ requestId: requestIdNumber });
      setActiveRfqId(record.id);
      toast.success(record.status === 'SentToPO' ? 'RFQ opened' : 'RFQ ready');
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to open RFQ');
    }
  };

  const handleDeleteRfq = async (id: string) => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    const confirmed = window.confirm('Delete this RFQ?');
    if (!confirmed) return;
    try {
      await removeRfq(id);
      toast.success('RFQ deleted');
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to delete RFQ');
    }
  };

  const openNewRequest = React.useCallback(() => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    setShowNewModal(true);
  }, [disableWrites]);
  const handleDownloadTemplate = React.useCallback(() => {
    const href = "/templates/Purchase_Request_Template.xlsx";
    const link = document.createElement('a');
    link.href = href;
    link.download = "Purchase_Request_Template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleOpenImport = React.useCallback(() => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    setShowImportModal(true);
  }, [disableWrites]);

  const handleOpenSendOrder = (quotation: QuotationRow) => {
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    if (quotation.locked || quotation.status === 'SentToPO') {
      toast.error('Quotation is already sent to a purchase order');
      return;
    }
    setSendOrderTarget(quotation);
    setSendOrderNo(generateOrderNumber());
  };

  const handleGenerateOrderNo = () => {
    setSendOrderNo(generateOrderNumber());
  };

  const handleCloseSendOrderModal = () => {
    setSendOrderTarget(null);
    setSendOrderNo('');
    setSendOrderLoading(false);
  };

  const handleConfirmSendOrder = async () => {
    if (!sendOrderTarget) return;
    const trimmed = sendOrderNo.trim();
    if (!trimmed) {
      toast.error('Order number is required');
      return;
    }
    if (disableWrites) {
      toast.error('Backend unavailable');
      return;
    }
    setSendOrderLoading(true);
    try {
      try {
        await sendRfqToPo(sendOrderTarget.id, { orderNo: trimmed });
      } catch (primaryError) {
        try {
          await apiClient.post('/api/orders', { orderNo: trimmed, quotationId: sendOrderTarget.id });
        } catch (fallbackError) {
          throw fallbackError ?? primaryError;
        }
      }
      toast.success(`Order created: ${trimmed}`);
      try {
        await refreshRfqs();
      } catch {
        // ignore refresh failure
      }
      handleCloseSendOrderModal();
      navigate('/orders?status=Pending');
    } catch (error: any) {
      const message = error?.response?.data?.error ?? error?.message ?? 'Failed to send order';
      toast.error(message);
    } finally {
      setSendOrderLoading(false);
    }
  };

  const handleOpenComparisonFromMenu = React.useCallback(() => {
    const existing = quotations.find((q) => q.requestId);
    if (!existing) {
      toast.error('No quotations available to compare yet');
      return;
    }
    setComparisonRequestId(existing.requestId);
  }, [quotations]);

  const menuItems = React.useMemo(() => (
    [
      {
        key: "new-request",
        label: "New Request",
        icon: <Plus className="w-4.5 h-4.5" />,
        onClick: openNewRequest,
        disabled: disableWrites,
        comingSoonMessage: 'Backend unavailable',
      },
      { key: 'download-template', label: 'Download Template', icon: <Download className="w-4.5 h-4.5" />, onClick: handleDownloadTemplate },
      {
        key: 'import-requests',
        label: 'Import Requests',
        icon: <Upload className="w-4.5 h-4.5" />,
        onClick: handleOpenImport,
        disabled: disableWrites,
        comingSoonMessage: 'Backend unavailable',
      },
      { key: 'comparison-rfq', label: 'Comparison RFQ', icon: <Scale className="w-4.5 h-4.5" />, onClick: handleOpenComparisonFromMenu },
    ]
  ), [disableWrites, openNewRequest, handleDownloadTemplate, handleOpenImport, handleOpenComparisonFromMenu]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {!healthy ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Backend unavailable. Data will reload automatically when the connection is restored.
        </div>
      ) : null}
      <PageHeader title="Requests" menuItems={menuItems} onSearch={handleSearch} />

      <RequestsOverviewSection data={overviewData} loading={analyticsLoadingState} />

      <BaseCard title="All Requests" subtitle="Full list of purchase requests">
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader label="Request No" columnKey="requestNo" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <TableHeader label="Date Requested" columnKey="dateRequested" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <TableHeader label="Description" columnKey="description" disabled />
                <TableHeader label="Department" columnKey="department" disabled />
                <TableHeader label="Warehouse" columnKey="warehouse" disabled />
                <TableHeader label="Machine" columnKey="machine" disabled />
                <TableHeader label="Status" columnKey="status" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <TableHeader label="Priority" columnKey="priority" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <TableHeader label="Actions" columnKey="actions" disabled />
                <TableHeader label="Approval" columnKey="approval" disabled />
                <TableHeader label="RFQ" columnKey="rfq" disabled />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : !healthy ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-gray-500">Backend unavailable.</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-red-600">{error}</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-gray-500">No requests found.</td>
                </tr>
              ) : (
                requests.map((req) => {
                  const linkedQuotation = quotations.find((q) => q.requestId === String(req.id));
                  const isSentToPO = linkedQuotation?.status === 'SentToPO' || linkedQuotation?.status === 'Completed';
                  const requestStatus = String(req.status || '').toLowerCase();
                  const requestLocked = requestStatus.includes('completed');
                  const rfqLocked = Boolean(linkedQuotation?.locked);
                  const locked = requestLocked || rfqLocked;
                  const displayStatus = locked ? 'Closed' : req.status || '—';
                  const normalizedStatusLabel = displayStatus === '—' ? 'Pending' : displayStatus.replace(/completed/i, 'Closed');
                  const statusLower = normalizedStatusLabel.toLowerCase();
                  const approvalState = (req.approval ?? 'Pending') as RequestApprovalStatus;
                  const isClosedState = statusLower.includes('closed') || statusLower.includes('completed');

                  let statusLabel = normalizedStatusLabel;
                  let statusClassName = statusBadgeClass(statusLabel);

                  if (isClosedState || locked) {
                    statusLabel = 'Closed';
                    statusClassName = statusBadgeClass('Closed');
                  } else if (approvalState !== 'Pending') {
                    statusLabel = formatApprovalLabel(approvalState);
                    statusClassName = approvalBadgeClass(approvalState);
                  } else {
                    statusClassName = statusBadgeClass(statusLabel);
                  }

                  const buttonLabel = linkedQuotation
                    ? isSentToPO
                      ? 'Sent to PO'
                      : 'Open RFQ'
                    : 'Create RFQ';

                  return (
                  <tr key={req.id} className="border-t text-center text-sm hover:bg-gray-50">
                    <td className="px-3 py-3 font-semibold text-sky-600">
                      <button onClick={() => setViewTarget(req)} className="underline-offset-2 hover:underline">
                        {req.requestNo}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">{formatDate(req.dateRequested)}</td>
                    <td className="px-3 py-3 text-center">{req.description || "—"}</td>
                    <td className="px-3 py-3">{req.department || "—"}</td>
                    <td className="px-3 py-3">{req.warehouse || "—"}</td>
                    <td className="px-3 py-3 text-center">{req.machine || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${priorityBadgeClass(req.priority)}`}>
                        {normalizePriorityLabel(req.priority)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <ActionButton icon={<Eye className="h-4 w-4" />} label="View" onClick={() => setViewTarget(req)} />
                        <ActionButton
                          icon={<Pencil className="h-4 w-4" />} label="Edit"
                          onClick={() => {
                            if (locked) {
                              toast.error('Request is locked because the purchase order was completed');
                              return;
                            }
                            setEditTarget(req);
                          }}
                          disabled={locked || disableWrites}
                        />
                        <ActionButton
                          icon={busyDelete === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          label="Delete"
                          tone="danger"
                          disabled={busyDelete === req.id || locked || disableWrites}
                          onClick={() => {
                            if (locked) {
                              toast.error('Request is locked because the purchase order was completed');
                              return;
                            }
                            handleDelete(req);
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                          {APPROVAL_CONTROLS.map(({ value, icon, tone, label }) => {
                            const currentApproval = req.approval ?? 'Pending';
                            const active = currentApproval === value;
                            const pending = busyApproval === req.id && !active;
                            const baseInactiveClass = 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50';
                            const toneClass = active
                              ? tone === 'emerald'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : tone === 'red'
                                  ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                                  : 'border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100'
                              : baseInactiveClass;
                            return (
                              <button
                                key={value}
                                onClick={() => {
                                  if (locked) {
                                    toast.error('Request is locked because the purchase order was completed');
                                    return;
                                  }
                                  handleApprovalChange(req, value);
                                }}
                                disabled={(busyApproval === req.id && !active) || locked || disableWrites}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 ${
                                  toneClass
                                } ${busyApproval === req.id && !active ? 'opacity-60' : ''}`}
                                title={label}
                                aria-label={`Set approval to ${label}`}
                              >
                                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
                              </button>
                            );
                          })}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleSendRFQ(req, locked)}
                        disabled={locked || disableWrites}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          locked || disableWrites
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 cursor-not-allowed'
                            : isSentToPO
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : linkedQuotation
                              ? "border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
                              : "border-sky-200 bg-white text-sky-600 hover:bg-sky-50"
                        }`}
                        title={buttonLabel}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <div>
            Page {page} of {totalPages} • Total {total} requests
          </div>
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border border-gray-200 px-2"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </BaseCard>

      <KpisInsightsSection data={analytics.kpis} loading={analyticsLoadingState} />

      <UrgentInsightsSection data={analytics.urgent} loading={analyticsLoadingState} />

      <RfqTableSection
        quotations={quotations}
        sortBy={rfqSortBy}
        sortDir={rfqSortDir}
        onSortChange={(field, direction) => {
          setRfqSortBy(field);
          setRfqSortDir(direction);
          setRfqPage(1);
        }}
        onOpen={handleOpenQuotation}
        onSendOrder={handleOpenSendOrder}
        onDelete={handleDeleteRfq}
        loading={rfqLoading}
        disableWrites={disableWrites}
        page={rfqPage}
        pageSize={rfqPageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={(nextPage) => {
          setRfqPage(() => {
            if (Number.isNaN(nextPage)) return 1;
            return Math.max(1, Math.min(totalRfqPages, nextPage));
          });
        }}
        onPageSizeChange={(size) => {
          setRfqPageSize(size);
          setRfqPage(1);
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:aspect-square">
          <RecentActivitySection
            items={analytics.recentActivity}
            loading={analyticsLoadingState}
            className="h-full"
          />
        </div>
        <div className="lg:aspect-square">
          <RequestsTasksCard className="h-full" />
        </div>
      </div>

      <NewRequestModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={async () => {
          await fetchData();
          refreshAnalytics();
        }}
      />

      <RequestDetailsModal
        open={!!viewTarget}
        requestId={viewTarget?.id}
        request={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(req) => {
          setViewTarget(null);
          setEditTarget(req);
        }}
        onRefresh={async () => {
          await fetchData();
          refreshAnalytics();
        }}
      />

      <EditRequestModal
        open={!!editTarget}
        request={editTarget ? toEditPayload(editTarget) : ({ id: 0 } as any)}
        onClose={() => setEditTarget(null)}
        onUpdated={async () => {
          await fetchData();
          setEditTarget(null);
          refreshAnalytics();
        }}
      />

      <ImportRequestsModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={async (file) => {
          toast.success(`Imported ${file.name}`);
          setShowImportModal(false);
        }}
      />

      <QuotationModal
        open={Boolean(activeRfqId)}
        rfqId={activeRfqId}
        onClose={handleCloseQuotationModal}
        onOpenComparison={handleOpenComparison}
      />

      <ComparisonModal
        open={!!comparisonRequestId}
        requestId={comparisonRequestId}
        quotations={comparisonQuotations}
        onClose={handleCloseComparison}
        onAddOffer={() => {
          if (comparisonRequestId) handleAddOffer(comparisonRequestId);
        }}
        onOpenQuotation={handleOpenQuotation}
        onNoteChange={handleComparisonNoteChange}
      />

      <SendOrderModal
        open={Boolean(sendOrderTarget)}
        orderNo={sendOrderNo}
        loading={sendOrderLoading}
        onOrderNoChange={(value) => setSendOrderNo(value)}
        onGenerate={handleGenerateOrderNo}
        onCancel={handleCloseSendOrderModal}
        onConfirm={handleConfirmSendOrder}
      />
    </div>
  );
}

type TableHeaderProps = {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
  disabled?: boolean;
};

function TableHeader({ label, columnKey, sortBy, sortDir, onSort, disabled }: TableHeaderProps) {
  const field = sortFieldForColumn[columnKey];
  const isActive = !!field && sortBy === field;
  const arrow = !isActive ? "↕" : sortDir === "asc" ? "▲" : "▼";
  return (
    <th
      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
      onClick={() => !disabled && onSort?.(columnKey)}
      style={{ cursor: disabled ? "default" : "pointer" }}
    >
      <span className="inline-flex items-center justify-center gap-1">
        {label}
        {!disabled ? <span className="text-gray-400">{arrow}</span> : null}
      </span>
    </th>
  );
}

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
};

function ActionButton({ icon, label, onClick, tone = "default", disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-gray-600 transition hover:bg-gray-50 ${
        tone === "danger" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-gray-200"
      } disabled:opacity-50`}
    >
      {icon}
    </button>
  );
}

function StatSkeleton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (!loading) return <>{children}</>;
  return <div className="h-[152px] animate-pulse rounded-2xl border border-gray-200 bg-gray-100" />;
}

function ChartInfo({ description }: { description: string }) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="Chart info"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <AlertCircle className="h-3.5 w-3.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="max-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-sm"
          >
            {description}
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function RequestsOverviewSection({ data, loading }: { data: OverviewSummary; loading: boolean }) {
  return (
    <BaseCard title="Requests Overview" subtitle="Current pipeline snapshot">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatSkeleton loading={loading}>
          <StatCard icon={<Activity className="h-5 w-5" />} label="Open Requests" value={data.open} valueFormat="number" />
        </StatSkeleton>
        <StatSkeleton loading={loading}>
          <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Closed Requests" value={data.closed} valueFormat="number" />
        </StatSkeleton>
        <StatSkeleton loading={loading}>
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label="Approved Requests" value={data.approved} valueFormat="number" />
        </StatSkeleton>
        <StatSkeleton loading={loading}>
          <StatCard icon={<Zap className="h-5 w-5 text-amber-500" />} label="High Priority" value={data.urgent} valueFormat="number" />
        </StatSkeleton>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PieInsightCard
          title="Pending / Approved / Rejected / On Hold"
          subtitle="Distribution of approval states"
          data={data.stateDistribution}
          loading={loading}
          headerRight={<ChartInfo description="Breakdown of current approvals for all requests." />}
        />
        <BarChartCard
          title="Requests by Department"
          subtitle="Departmental totals"
          data={data.departmentTotals}
          height={280}
          loading={loading}
          headerRight={<ChartInfo description="Total requests attributed to each department." />}
        />
      </div>
    </BaseCard>
  );
}

function KpisInsightsSection({ data, loading }: { data: KpiSummary; loading: boolean }) {
  return (
    <BaseCard title="KPIs & Insights" subtitle="Performance metrics and cycle trends">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Timer className="h-5 w-5 text-sky-500" />} label="Average Lead Time (days)" value={data.averageLeadTime} valueFormat="number" />
        <StatCard
          icon={<Zap className="h-5 w-5 text-amber-500" />}
          label="Urgent Requests %"
          value={data.urgentPercentage}
          valueFormat="percent"
          valueFractionDigits={1}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
          label="Total Value (This Month)"
          value={`${data.totalValueThisMonth.toLocaleString()} SAR`}
        />
        <StatCard icon={<Building2 className="h-5 w-5 text-gray-500" />} label="Top Requester Department" value={data.topDepartment} />
      </div>
      <div className="mt-6">
        <BarChartCard
          title="Cycle Time by Week"
          subtitle="Average lead time (days)"
          data={data.cycleTimeByWeek}
          height={280}
          loading={loading}
        />
      </div>
    </BaseCard>
  );
}

function UrgentInsightsSection({ data, loading }: { data: UrgentInsights; loading: boolean }) {
  return (
    <BaseCard title="Urgent Insights" subtitle="SLA breaches and urgency focus areas">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title="SLA Breaches by Department"
          subtitle="Requests exceeding target lead time"
          data={data.breachesByDepartment}
          height={280}
          loading={loading}
        />
        <BarChartCard
          title="Urgent Requests by Department (%)"
          subtitle="Share of urgent among all requests"
          data={data.urgentShareByDepartment}
          height={280}
          loading={loading}
          axisValueSuffix="%"
          tooltipValueSuffix="%"
        />
      </div>
    </BaseCard>
  );
}

function RecentActivitySection({ items, loading, className }: { items: RecentActivityEntry[]; loading: boolean; className?: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? items.length : Math.min(6, items.length);
  const hasMore = items.length > 6;

  return (
    <BaseCard
      title="Recent Activity"
      subtitle="Latest request updates and actions"
      className={`flex h-full min-h-[320px] flex-col ${className ?? ''}`.trim()}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <RecentActivityFeed
          items={items}
          isLoading={loading}
          emptyMessage="No recent updates yet."
          visibleCount={visible}
          className="flex-1 overflow-y-auto pr-1"
        />
        {hasMore ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? 'Show less' : 'Show older activity'}
            </button>
          </div>
        ) : null}
      </div>
    </BaseCard>
  );
}

type RfqTableSectionProps = {
  quotations: QuotationRow[];
  sortBy: 'quotationNo' | 'requestNo' | 'vendor' | 'status';
  sortDir: 'asc' | 'desc';
  onSortChange: (field: 'quotationNo' | 'requestNo' | 'vendor' | 'status', direction: 'asc' | 'desc') => void;
  onOpen: (id: string) => void;
  onSendOrder: (quotation: QuotationRow) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  disableWrites: boolean;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

function RfqTableSection({
  quotations,
  sortBy,
  sortDir,
  onSortChange,
  onOpen,
  onSendOrder,
  onDelete,
  loading,
  disableWrites,
  page,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: RfqTableSectionProps) {
  const sorted = React.useMemo(() => {
    const list = [...quotations];
    return list.sort((a, b) => {
      const left = (a[sortBy] ?? '').toString().toLowerCase();
      const right = (b[sortBy] ?? '').toString().toLowerCase();
      if (left === right) return 0;
      return sortDir === 'asc' ? (left > right ? 1 : -1) : (left > right ? -1 : 1);
    });
  }, [quotations, sortBy, sortDir]);

  const totalRfqs = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRfqs / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginated = React.useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const toggleSort = (field: RfqTableSectionProps['sortBy']) => {
    const nextDir = sortBy === field ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    onSortChange(field, nextDir);
  };

  return (
    <BaseCard title="RFQ Pipeline" subtitle="Track quotations and vendor offers">
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <RfqHeader label="Quotation NO" field="quotationNo" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} />
              <RfqHeader label="Request NO" field="requestNo" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} />
              <RfqHeader label="Vendor" field="vendor" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} />
              <RfqHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} />
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No RFQs yet. Create one from the Requests table.</td>
              </tr>
            ) : (
              paginated.map((quotation) => (
                <tr key={quotation.id} className="border-t text-center text-sm hover:bg-gray-50">
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => onOpen(quotation.id)} className="font-semibold text-sky-600 underline-offset-2 hover:underline">
                      {quotation.quotationNo}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">{quotation.requestNo}</td>
                  <td className="px-3 py-3 text-center">{quotation.vendor || '—'}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${quotationStatusBadgeClass(quotation.status)}`}>
                      {quotation.status === 'SentToPO' ? 'Sent to PO' : quotation.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {quotation.locked ? (
                      <span className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!disableWrites && quotation.status !== 'SentToPO') onSendOrder(quotation);
                          }}
                          disabled={disableWrites || quotation.status === 'SentToPO'}
                          aria-label={quotation.status === 'SentToPO' ? 'Order already sent' : 'Send Order'}
                          title={quotation.status === 'SentToPO' ? 'Order already sent' : 'Send Order'}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100 ${
                            disableWrites || quotation.status === 'SentToPO' ? 'cursor-not-allowed opacity-60 hover:bg-sky-50' : ''
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(quotation.id)}
                          aria-label="Delete"
                          title="Delete"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          Page {safePage} of {totalPages} • Total {totalRfqs} {totalRfqs === 1 ? 'RFQ' : 'RFQs'}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
            }}
            className="h-9 rounded-md border border-gray-200 px-2"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

type RfqHeaderProps = {
  label: string;
  field: RfqTableSectionProps['sortBy'];
  sortBy: RfqTableSectionProps['sortBy'];
  sortDir: RfqTableSectionProps['sortDir'];
  onToggle: (field: RfqTableSectionProps['sortBy']) => void;
};

type SendOrderModalProps = {
  open: boolean;
  orderNo: string;
  loading: boolean;
  onOrderNoChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function SendOrderModal({ open, orderNo, loading, onOrderNoChange, onGenerate, onCancel, onConfirm }: SendOrderModalProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !loading) {
      onCancel();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loading) onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-order-modal-title"
      >
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <div id="send-order-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Send Order
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Generate or enter a PO number to create the purchase order.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" htmlFor="send-order-number">
              Order Number
            </label>
            <div className="flex items-center gap-2">
              <input
                id="send-order-number"
                ref={inputRef}
                value={orderNo}
                onChange={(event) => onOrderNoChange(event.target.value)}
                placeholder="PO-202509-8342"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-900"
                disabled={loading}
              />
              <button
                type="button"
                onClick={onGenerate}
                className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                Generate
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RfqHeader({ label, field, sortBy, sortDir, onToggle }: RfqHeaderProps) {
  const isActive = sortBy === field;
  const arrow = !isActive ? '↕' : sortDir === 'asc' ? '▲' : '▼';
  return (
    <th
      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
      onClick={() => onToggle(field)}
      style={{ cursor: 'pointer' }}
    >
      <span className="inline-flex items-center justify-center gap-1">
        {label}
        <span className="text-gray-400">{arrow}</span>
      </span>
    </th>
  );
}

type InfoCardProps = {
  label: string;
  value: React.ReactNode;
};

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

type ComparisonModalProps = {
  open: boolean;
  requestId: string | null;
  quotations: QuotationRow[];
  onClose: () => void;
  onAddOffer: () => void;
  onOpenQuotation: (id: string) => void;
  onNoteChange: (quotationId: string, value: string) => void;
};

function ComparisonModal({ open, requestId, quotations, onClose, onAddOffer, onOpenQuotation, onNoteChange }: ComparisonModalProps) {
  if (!open || !requestId) return null;

  const requestNo = quotations[0]?.requestNo ?? '—';
  const slots: Array<QuotationRow | null> = [...quotations];
  while (slots.length < 3) slots.push(null);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40">
      <div className="w-[min(920px,95vw)] max-h-[88vh] overflow-hidden rounded-2xl border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">Quotation Comparison</div>
            <div className="text-sm text-gray-500">Request {requestNo}</div>
          </div>
          <button onClick={onClose} className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(88vh-140px)] overflow-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {slots.map((slot, index) => {
              if (!slot) {
                return (
                  <button
                    key={`placeholder-${index}`}
                    onClick={onAddOffer}
                    className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm font-semibold text-gray-500 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-600"
                  >
                    + Add offer
                  </button>
                );
              }

              const total = slot.items.reduce((sum, item) => sum + computeItemPrice(item), 0);
              const locked = Boolean(slot.locked);

              return (
                <div key={slot.id} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{slot.vendor || '—'}</div>
                      <div className="text-xs text-gray-500">Status: {slot.status === 'SentToPO' ? 'Sent to PO' : slot.status}</div>
                      {locked ? (
                        <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                          <Lock className="h-3 w-3" /> Locked
                        </div>
                      ) : null}
                    </div>
                    <button onClick={() => onOpenQuotation(slot.id)} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-100">
                      Open
                    </button>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">Total Price</div>
                  <div className="text-2xl font-extrabold text-gray-900">{total.toLocaleString()} SAR</div>
                  <label className="mt-4 flex flex-col gap-1 text-xs text-gray-500">
                    Notes
                    <textarea
                      value={slot.notes || ''}
                      onChange={(event) => onNoteChange(slot.id, event.target.value)}
                      rows={3}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Internal notes"
                      disabled={locked}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end border-t px-5 py-4">
          <button onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
