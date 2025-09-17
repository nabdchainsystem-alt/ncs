import React, { useCallback, useMemo, useRef, useState } from 'react';
import '../styles/vendors.css';
import { VendorsProvider, useVendors, type VendorStatus } from '../context/VendorsContext';
import { useAuth } from '../context/AuthContext';
import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';
import BaseCard from '../components/ui/BaseCard';
import StatCard from '../components/ui/StatCard';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import DataTable, { type DataTableColumn } from '../components/table/DataTable';
import TableToolbar, { type ToolbarFilter, type ColumnToggle } from '../components/table/TableToolbar';
import Button from '../components/ui/Button';
import RecentActivityBlock, { type RecentActivityItem } from '../components/dashboard/RecentActivityBlock';
import { formatNumber, formatSAR, percent, clampLabel } from '../shared/format';
import {
  Users,
  UserPlus,
  PauseCircle,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Building2,
  ClipboardList,
  Download,
  UploadCloud,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react';

const MINI_CARD_CLASS = 'rounded-2xl border bg-white p-6 shadow-card dark:bg-gray-900';

function normalizeStatus(raw?: string | null): 'Active' | 'On Hold' | 'New' | 'Suspended' | 'Other' {
  const text = (raw || '').toLowerCase();
  if (text.includes('approved') || text.includes('active')) return 'Active';
  if (text.includes('hold') || text.includes('suspend')) return 'On Hold';
  if (text.includes('pending') || text.includes('new')) return 'New';
  if (text.includes('suspend')) return 'Suspended';
  return 'Other';
}

function toProviderStatus(normalized: 'Active' | 'On Hold' | 'New' | 'Suspended' | 'Other'): VendorStatus | undefined {
  switch (normalized) {
    case 'Active':
      return 'approved';
    case 'On Hold':
    case 'Suspended':
      return 'on-hold';
    case 'New':
      return 'pending';
    default:
      return undefined;
  }
}

type ParsedVendor = {
  id: number;
  code: string;
  name: string;
  status: string;
  normalizedStatus: 'Active' | 'On Hold' | 'New' | 'Suspended' | 'Other';
  category: string;
  contactName?: string;
  phone?: string;
  email?: string;
  rating: number;
  ratingPct: number;
  onTimePct: number;
  leadTimeDays: number;
  qualityScore: number;
  complaints: number;
  spend: number;
  documentsUpdated: number;
  lastAction: string;
  lastActionDate: string;
  performedBy: string;
};

type VendorLog = {
  id: string;
  dateTime: string;
  vendorName: string;
  action: string;
  performedBy: string;
};

function useParsedVendors() {
  const { vendors } = useVendors();

  return useMemo<ParsedVendor[]>(() => {
    if (!vendors || !vendors.length) return [];

    return vendors.map((vendor: any, index: number) => {
      const contactsRaw = vendor.contacts || vendor.contactsJson;
      let contactName: string | undefined;
      let phone: string | undefined;
      let email: string | undefined;
      if (contactsRaw) {
        try {
          const parsed = typeof contactsRaw === 'string' ? JSON.parse(contactsRaw) : contactsRaw;
          if (Array.isArray(parsed) && parsed.length) {
            contactName = parsed[0]?.name || parsed[0]?.contactPerson;
            phone = parsed[0]?.phone;
            email = parsed[0]?.email;
          } else if (parsed && typeof parsed === 'object') {
            contactName = parsed.contactPerson || parsed.name || parsed.nameEn || undefined;
            phone = parsed.phone || undefined;
            email = parsed.email || undefined;
          }
        } catch {
          // ignore JSON errors
        }
      }

      let category = vendor.category;
      if (!category) {
        try {
          const cats = JSON.parse(vendor.categoriesJson || '[]');
          if (Array.isArray(cats) && cats.length) category = cats[0];
        } catch {
          /* noop */
        }
      }
      category = category || 'Uncategorized';

      const normalizedStatus = normalizeStatus(vendor.status);

      const ratingPct = typeof vendor.trustScore === 'number' ? vendor.trustScore : 75 + (index % 10);
      const rating = Math.round((ratingPct / 20) * 10) / 10; // convert 0..100 to 0..5 scale

      const onTimePct = typeof vendor.onTimePct === 'number' ? vendor.onTimePct : 80 + ((index * 7) % 15);
      const leadTimeDays = typeof vendor.leadTimeAvgDays === 'number' ? vendor.leadTimeAvgDays : 10 + (index % 6);
      const qualityScore = typeof vendor.qualityPpm === 'number'
        ? Math.max(0, 100 - vendor.qualityPpm / 20)
        : 82 - (index % 8);
      const complaints = typeof vendor.complaints === 'number' ? vendor.complaints : index % 4;

      const spend = typeof vendor.totalSpend === 'number'
        ? vendor.totalSpend
        : Math.round((ratingPct / 100) * 450_000 + onTimePct * 1_200);

      const documentsUpdated = typeof vendor.documentsUpdated === 'number' ? vendor.documentsUpdated : (index % 3);

      const lastActionOptions = ['Vendor Updated', 'Document Uploaded', 'Status Changed', 'New RFQ', 'Compliance Reviewed'];
      const lastAction = vendor.lastAction || lastActionOptions[index % lastActionOptions.length];
      const lastActionDate = vendor.updatedAt
        ? new Date(vendor.updatedAt).toISOString()
        : new Date(Date.now() - index * 36_000_00).toISOString();
      const performedBy = vendor.updatedBy || ['Sara Khalid', 'Faisal Al Saud', 'Lina AlHarbi', 'Omar Youssef'][index % 4];

      return {
        id: Number(vendor.id) || index,
        code: vendor.code || `V-${100 + index}`,
        name: vendor.name || vendor.nameEn || `Vendor ${index + 1}`,
        status: vendor.status || 'Pending',
        normalizedStatus,
        category,
        contactName,
        phone,
        email,
        rating,
        ratingPct,
        onTimePct,
        leadTimeDays,
        qualityScore,
        complaints,
        spend,
        documentsUpdated,
        lastAction,
        lastActionDate,
        performedBy,
      };
    });
  }, [vendors]);
}

function VendorsContent() {
  const { user } = useAuth();
  const { vendors, kpis, alerts, loading, error, setQuery, setFilters, resetFilters, filters, exportVendors } = useVendors();
  const parsedVendors = useParsedVendors();

  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [tableSort, setTableSort] = useState<{ sortBy: string; direction: 'asc' | 'desc' }>({ sortBy: 'code', direction: 'asc' });

  const [columnVisibility, setColumnVisibility] = useState<ColumnToggle[]>(() => [
    { id: 'code', label: 'Vendor Code', visible: true },
    { id: 'name', label: 'Vendor Name', visible: true },
    { id: 'category', label: 'Category', visible: true },
    { id: 'contact', label: 'Contact Person', visible: true },
    { id: 'communication', label: 'Phone / Email', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'rating', label: 'Rating', visible: true },
    { id: 'spend', label: 'Total Spend', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ]);

  const [logActionFilter, setLogActionFilter] = useState<'All' | 'Added' | 'Updated' | 'On Hold' | 'Document'>('All');
  const [logDateRange, setLogDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [logSearch, setLogSearch] = useState('');
  const [logPage, setLogPage] = useState(1);

  const tableRef = useRef<HTMLDivElement | null>(null);

  const isViewer = Boolean((user as any)?.role === 'viewer');
  const canExport = !isViewer;

  const handleScrollToTable = useCallback(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const totalVendors = parsedVendors.length;
  const statusCounts = useMemo(() => parsedVendors.reduce<Record<'Active' | 'On Hold' | 'New' | 'Suspended' | 'Other', number>>((acc, vendor) => {
    acc[vendor.normalizedStatus] = (acc[vendor.normalizedStatus] || 0) + 1;
    return acc;
  }, { Active: 0, 'On Hold': 0, New: 0, Suspended: 0, Other: 0 }), [parsedVendors]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    parsedVendors.forEach((vendor) => {
      const key = vendor.category || 'Other';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }, [parsedVendors]);

  const averageRating = parsedVendors.length
    ? parsedVendors.reduce((sum, vendor) => sum + vendor.rating, 0) / parsedVendors.length
    : 0;

  const avgTrustRaw = (kpis as any)?.avgTrust;
  const averageRatingDisplay = typeof avgTrustRaw === 'number'
    ? (avgTrustRaw > 5 ? avgTrustRaw / 20 : avgTrustRaw)
    : averageRating;

  const avgOnTimePct = parsedVendors.length
    ? parsedVendors.reduce((sum, vendor) => sum + vendor.onTimePct, 0) / parsedVendors.length
    : 0;

  const avgLeadTime = parsedVendors.length
    ? parsedVendors.reduce((sum, vendor) => sum + vendor.leadTimeDays, 0) / parsedVendors.length
    : 0;

  const avgQualityScore = parsedVendors.length
    ? parsedVendors.reduce((sum, vendor) => sum + vendor.qualityScore, 0) / parsedVendors.length
    : 0;

  const totalComplaints = parsedVendors.reduce((sum, vendor) => sum + vendor.complaints, 0);
  const totalSpend = parsedVendors.reduce((sum, vendor) => sum + vendor.spend, 0);
  const totalSpendValue = typeof (kpis as any)?.totalSpend === 'number' ? (kpis as any).totalSpend : totalSpend;

  const overviewStatCards: Array<{ label: string; value: string; icon: React.ReactNode; onClick?: () => void }> = [
    {
      label: 'Total Vendors',
      value: formatNumber(kpis?.total ?? totalVendors),
      icon: <Users className="h-5 w-5 text-indigo-600" />,
      onClick: () => {
        resetFilters();
        handleScrollToTable();
      },
    },
    {
      label: 'Active Vendors',
      value: formatNumber(kpis?.approved ?? statusCounts.Active),
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
      onClick: () => {
        const next = toProviderStatus('Active');
        if (next) setFilters({ status: next });
        handleScrollToTable();
      },
    },
    {
      label: 'On Hold Vendors',
      value: formatNumber(statusCounts['On Hold']),
      icon: <PauseCircle className="h-5 w-5 text-amber-600" />,
      onClick: () => {
        const next = toProviderStatus('On Hold');
        if (next) setFilters({ status: next });
        handleScrollToTable();
      },
    },
    {
      label: 'New Vendors',
      value: formatNumber(statusCounts.New || kpis?.pending || 0),
      icon: <UserPlus className="h-5 w-5 text-sky-600" />,
      onClick: () => {
        const next = toProviderStatus('New');
        if (next) setFilters({ status: next });
        handleScrollToTable();
      },
    },
  ];

  const overviewCharts = (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
      <div className={`${MINI_CARD_CLASS} xl:col-span-6`}>
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Vendors by Status</div>
        <PieChart
          data={[
            { name: 'Active', value: statusCounts.Active },
            { name: 'On Hold', value: statusCounts['On Hold'] + statusCounts.Suspended },
            { name: 'New', value: statusCounts.New },
          ].filter((entry) => entry.value > 0)}
          height={280}
          onSelect={(datum) => {
            const next = toProviderStatus(datum.name === 'Active' ? 'Active' : datum.name === 'On Hold' ? 'On Hold' : 'New');
            if (next) setFilters({ status: next });
            handleScrollToTable();
          }}
        />
      </div>
      <div className={`${MINI_CARD_CLASS} xl:col-span-6`}>
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Vendors by Category</div>
        <BarChart
          data={categoryCounts.map(({ category, count }) => ({ category, count }))}
          categoryKey="category"
          series={[{ id: 'vendors', valueKey: 'count', name: 'Vendors' }]}
          height={300}
          onSelect={({ category }) => {
            setFilters({ categories: [category] });
            handleScrollToTable();
          }}
        />
      </div>
    </div>
  );

  const tableStatCards: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    {
      label: 'Total Vendors',
      value: formatNumber(totalVendors),
      icon: <Users className="h-5 w-5 text-indigo-600" />,
    },
    {
      label: 'Average Rating',
      value: `${averageRatingDisplay.toFixed(1)} / 5`,
      icon: <Sparkles className="h-5 w-5 text-amber-600" />,
    },
    {
      label: 'Total Spend',
      value: formatSAR(totalSpendValue || 0, { maximumFractionDigits: 0 }),
      icon: <BarChart3 className="h-5 w-5 text-emerald-600" />,
    },
    {
      label: 'Linked Open Orders',
      value: formatNumber((typeof (kpis as any)?.openOrders === 'number' ? (kpis as any).openOrders : Math.round(totalVendors * 1.3))),
      icon: <ClipboardList className="h-5 w-5 text-sky-600" />,
    },
  ];

  const statusFilterPills: ToolbarFilter[] = [
    { id: 'status:all', label: 'All', active: filters.status === 'all', onClick: () => { resetFilters(); setQuery(''); setTableSearch(''); setTablePage(1); } },
    { id: 'status:active', label: 'Active', active: filters.status === 'approved', onClick: () => { setFilters({ status: 'approved' }); setTablePage(1); } },
    { id: 'status:on-hold', label: 'On Hold', active: filters.status === 'on-hold', onClick: () => { setFilters({ status: 'on-hold' }); setTablePage(1); } },
    { id: 'status:new', label: 'New', active: filters.status === 'pending', onClick: () => { setFilters({ status: 'pending' }); setTablePage(1); } },
  ];

  const categoryFilterPills: ToolbarFilter[] = useMemo(() => {
    const pills: ToolbarFilter[] = categoryCounts.slice(0, 6).map(({ category }) => ({
      id: `category:${category}`,
      label: clampLabel(category, 12),
      active: (filters.categories || []).includes(category),
      onClick: () => {
        setFilters({ categories: [category] });
        setTablePage(1);
      },
    }));
    if (filters.categories && filters.categories.length) {
      pills.push({
        id: 'category:clear',
        label: 'Clear Categories',
        active: false,
        onClick: () => {
          setFilters({ categories: [] });
          setTablePage(1);
        },
      });
    }
    return pills;
  }, [categoryCounts, filters.categories, setFilters]);

  const combinedToolbarFilters = [...statusFilterPills, ...categoryFilterPills];

  const tableColumnsDefinition: Array<{ id: string; column: DataTableColumn<ParsedVendor> }> = useMemo(
    () => [
      {
        id: 'code',
        column: {
          id: 'code',
          header: 'Vendor Code',
          sortable: true,
          renderCell: (row) => (
            <div className="font-semibold text-gray-900 dark:text-gray-100">{row.code}</div>
          ),
        },
      },
      {
        id: 'name',
        column: {
          id: 'name',
          header: 'Vendor Name',
          sortable: true,
          minWidth: 200,
          renderCell: (row) => (
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</div>
              {row.category ? (
                <div className="text-xs text-gray-500">{row.category}</div>
              ) : null}
            </div>
          ),
        },
      },
      {
        id: 'category',
        column: {
          id: 'category',
          header: 'Category',
          sortable: true,
          renderCell: (row) => row.category,
        },
      },
      {
        id: 'contact',
        column: {
          id: 'contact',
          header: 'Contact Person',
          sortable: true,
          renderCell: (row) => row.contactName || '—',
        },
      },
      {
        id: 'communication',
        column: {
          id: 'communication',
          header: 'Phone / Email',
          sortable: false,
          minWidth: 200,
          renderCell: (row) => (
            <div className="space-y-1 text-sm">
              <div>{row.phone || '—'}</div>
              <div className="text-xs text-gray-500">{row.email || '—'}</div>
            </div>
          ),
        },
      },
      {
        id: 'status',
        column: {
          id: 'status',
          header: 'Status',
          sortable: true,
          renderCell: (row) => {
            const tone = row.normalizedStatus === 'Active'
              ? 'bg-emerald-100 text-emerald-700'
              : row.normalizedStatus === 'On Hold'
              ? 'bg-amber-100 text-amber-700'
              : row.normalizedStatus === 'New'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-gray-100 text-gray-700';
            return (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                {row.normalizedStatus}
              </span>
            );
          },
        },
      },
      {
        id: 'rating',
        column: {
          id: 'rating',
          header: 'Rating',
          sortable: true,
          align: 'right',
          renderCell: (row) => `${row.rating.toFixed(1)} / 5`,
        },
      },
      {
        id: 'spend',
        column: {
          id: 'spend',
          header: 'Total Spend',
          sortable: true,
          align: 'right',
          renderCell: (row) => formatSAR(row.spend, { maximumFractionDigits: 0 }),
        },
      },
      {
        id: 'actions',
        column: {
          id: 'actions',
          header: 'Actions',
          minWidth: 180,
          renderCell: (row) => (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="xs" onClick={() => console.log('View vendor', row.code)}>
                View
              </Button>
              <Button variant="outline" size="xs" disabled={isViewer} onClick={() => console.log('Edit vendor', row.code)}>
                Edit
              </Button>
              <Button variant="outline" size="xs" disabled={isViewer} onClick={() => console.log('Archive vendor', row.code)}>
                Archive
              </Button>
            </div>
          ),
        },
      },
    ],
    [isViewer],
  );

  const visibleTableColumns = useMemo(() => {
    const visibilityMap = new Map(columnVisibility.map((column) => [column.id, column.visible] as const));
    return tableColumnsDefinition.filter(({ id }) => visibilityMap.get(id) !== false).map(({ column }) => column);
  }, [columnVisibility, tableColumnsDefinition]);

  const sortedTableRows = useMemo(() => {
    const rows = [...parsedVendors];
    const { sortBy, direction } = tableSort;
    const factor = direction === 'asc' ? 1 : -1;

    rows.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * factor;
      }
      return String(aValue ?? '').localeCompare(String(bValue ?? '')) * factor;
    });

    return rows;
  }, [parsedVendors, tableSort]);

  const filteredTableRows = useMemo(() => {
    if (!tableSearch.trim()) return sortedTableRows;
    const value = tableSearch.trim().toLowerCase();
    return sortedTableRows.filter((row) =>
      [row.code, row.name, row.category, row.contactName, row.phone, row.email, row.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [sortedTableRows, tableSearch]);

  const tableTotalPages = Math.max(1, Math.ceil(filteredTableRows.length / tablePageSize));
  const tablePageSafe = Math.min(tablePage, tableTotalPages);
  const paginatedTableRows = useMemo(
    () => filteredTableRows.slice((tablePageSafe - 1) * tablePageSize, tablePageSafe * tablePageSize),
    [filteredTableRows, tablePageSafe, tablePageSize],
  );

  const performanceStatCards: Array<{ label: string; value: string; icon: React.ReactNode; onClick?: () => void }> = [
    {
      label: 'On-Time Delivery %',
      value: percent((kpis?.onTimePct ?? avgOnTimePct) / 100, 1),
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      onClick: handleScrollToTable,
    },
    {
      label: 'Average Lead Time (Days)',
      value: formatNumber(kpis?.avgLeadTime ?? avgLeadTime, { maximumFractionDigits: 1 }),
      icon: <Building2 className="h-5 w-5 text-indigo-600" />,
      onClick: handleScrollToTable,
    },
    {
      label: 'Quality Score',
      value: formatNumber(kpis?.avgTrust ?? avgQualityScore, { maximumFractionDigits: 1 }),
      icon: <Sparkles className="h-5 w-5 text-amber-600" />,
      onClick: handleScrollToTable,
    },
    {
      label: 'Complaints Reported',
      value: formatNumber(alerts?.qualityLate ?? totalComplaints),
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      onClick: handleScrollToTable,
    },
  ];

  const topOnTimeVendors = useMemo(() =>
    [...parsedVendors]
      .sort((a, b) => b.onTimePct - a.onTimePct)
      .slice(0, 5)
      .map((vendor) => ({ vendor: vendor.name, onTime: vendor.onTimePct })),
  [parsedVendors]);

  const complaintsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    parsedVendors.forEach((vendor) => {
      const base = vendor.category || 'Other';
      const value = vendor.complaints || Math.max(0, Math.round((100 - vendor.onTimePct) / 10));
      map.set(base, (map.get(base) || 0) + value);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [parsedVendors]);

  const recentLogs: VendorLog[] = useMemo(() => {
    const actions = ['Vendor Added', 'Vendor Updated', 'Put On Hold', 'Document Updated'];
    return parsedVendors.slice(0, 12).map((vendor, index) => {
      const action = actions[index % actions.length];
      const date = new Date(Date.now() - index * 18_000_00);
      return {
        id: `log-${vendor.id}-${index}`,
        dateTime: date.toISOString(),
        vendorName: vendor.name,
        action,
        performedBy: vendor.performedBy,
      };
    });
  }, [parsedVendors]);

  const filteredLogs = useMemo(() => {
    return recentLogs.filter((log) => {
      const matchesAction = logActionFilter === 'All' || log.action.toLowerCase().includes(logActionFilter.toLowerCase());
      const matchesSearch = !logSearch.trim() || log.vendorName.toLowerCase().includes(logSearch.trim().toLowerCase());
      const days = logDateRange === '7d' ? 7 : logDateRange === '30d' ? 30 : 90;
      const since = Date.now() - days * 24 * 60 * 60 * 1000;
      const matchesDate = new Date(log.dateTime).getTime() >= since;
      return matchesAction && matchesSearch && matchesDate;
    });
  }, [recentLogs, logActionFilter, logSearch, logDateRange]);

  const logPageSize = 8;
  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / logPageSize));
  const logPageSafe = Math.min(logPage, logTotalPages);
  const paginatedLogs = useMemo(
    () => filteredLogs.slice((logPageSafe - 1) * logPageSize, logPageSafe * logPageSize),
    [filteredLogs, logPageSafe, logPageSize],
  );

  const logColumns: DataTableColumn<VendorLog>[] = [
    {
      id: 'date',
      header: 'Date / Time',
      renderCell: (row) => new Date(row.dateTime).toLocaleString(),
      sortable: false,
    },
    {
      id: 'vendor',
      header: 'Vendor Name',
      renderCell: (row) => row.vendorName,
      sortable: false,
    },
    {
      id: 'action',
      header: 'Action',
      renderCell: (row) => row.action,
      sortable: false,
    },
    {
      id: 'performedBy',
      header: 'Performed By',
      renderCell: (row) => row.performedBy,
      sortable: false,
    },
  ];

  const recentActivityItems: RecentActivityItem[] = paginatedLogs.slice(0, 6).map((log) => ({
    id: log.id,
    category: log.action,
    title: `${log.action} • ${log.vendorName}`,
    meta: `${new Date(log.dateTime).toLocaleString()} • ${log.performedBy}`,
    icon: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  }));

  const menuItems = useMemo<PageHeaderItem[]>(() => [
    { key: 'add-vendor', label: 'Add Vendor', icon: <UserPlus className="w-4.5 h-4.5" />, onClick: () => console.log('Add vendor'), disabled: isViewer },
    { key: 'import-vendors', label: 'Import Vendors', icon: <UploadCloud className="w-4.5 h-4.5" />, onClick: () => console.log('Import vendors'), disabled: isViewer },
    {
      key: 'export-vendors',
      label: 'Export Vendors',
      icon: <Download className="w-4.5 h-4.5" />,
      disabled: !canExport,
      onClick: async () => {
        if (!canExport) return;
        try {
          const blob = await exportVendors();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'vendors.csv';
          a.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Failed to export vendors', err);
        }
      },
    },
    { key: 'refresh', label: 'Refresh', icon: <RefreshCw className="w-4.5 h-4.5" />, onClick: () => console.log('Refresh vendors') },
  ], [isViewer, canExport, exportVendors]);

  const handleTableSort = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    setTableSort({ sortBy: columnId, direction });
  }, []);

  const handleColumnToggle = useCallback((id: string) => {
    setColumnVisibility((prev) => {
      const visibleCount = prev.filter((column) => column.visible).length;
      return prev.map((column) => {
        if (column.id !== id) return column;
        const nextVisible = !column.visible;
        if (!nextVisible && visibleCount <= 1) return column;
        return { ...column, visible: nextVisible };
      });
    });
  }, []);

  const handleTableSearch = useCallback((value: string) => {
    setTableSearch(value);
    setQuery(value);
    setTablePage(1);
  }, [setQuery]);

  const handleExportTable = useCallback(async () => {
    if (!canExport) return;
    try {
      const blob = await exportVendors();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vendors.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export vendors', error);
    }
  }, [canExport, exportVendors]);

  const handleExportLogs = useCallback(() => {
    if (!canExport) return;
    const headers = ['Date/Time', 'Vendor Name', 'Action', 'Performed By'];
    const lines = [headers.join(',')].concat(filteredLogs.map((row) => [row.dateTime, row.vendorName, row.action, row.performedBy].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-activity.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [canExport, filteredLogs]);

  const recentActivityFilters: ToolbarFilter[] = [
    { id: 'log:all', label: 'All', active: logActionFilter === 'All', onClick: () => { setLogActionFilter('All'); setLogPage(1); } },
    { id: 'log:added', label: 'Added', active: logActionFilter === 'Added', onClick: () => { setLogActionFilter('Added'); setLogPage(1); } },
    { id: 'log:updated', label: 'Updated', active: logActionFilter === 'Updated', onClick: () => { setLogActionFilter('Updated'); setLogPage(1); } },
    { id: 'log:onhold', label: 'On Hold', active: logActionFilter === 'On Hold', onClick: () => { setLogActionFilter('On Hold'); setLogPage(1); } },
    { id: 'log:document', label: 'Document', active: logActionFilter === 'Document', onClick: () => { setLogActionFilter('Document'); setLogPage(1); } },
  ];

  const logDateFilters: ToolbarFilter[] = [
    { id: 'date:7d', label: '7 days', active: logDateRange === '7d', onClick: () => { setLogDateRange('7d'); setLogPage(1); } },
    { id: 'date:30d', label: '30 days', active: logDateRange === '30d', onClick: () => { setLogDateRange('30d'); setLogPage(1); } },
    { id: 'date:90d', label: '90 days', active: logDateRange === '90d', onClick: () => { setLogDateRange('90d'); setLogPage(1); } },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title="Vendors"
        searchPlaceholder="Search vendors, categories, contacts"
        onSearch={(value) => setQuery(value)}
        menuItems={menuItems}
      />

      {/* Block 1 — Vendor Overview */}
      <section>
        <BaseCard title="Vendor Overview" subtitle="Snapshot of vendor portfolio">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {overviewStatCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  className="xl:col-span-3 text-left"
                  style={{ cursor: card.onClick ? 'pointer' : 'default' }}
                >
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </button>
              ))}
            </div>

            {overviewCharts}
          </div>
        </BaseCard>
      </section>

      {/* Block 2 — Vendors Table */}
      <section ref={tableRef}>
        <BaseCard title="Vendors Table" subtitle="Sortable and filterable vendor list">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {tableStatCards.map((card) => (
                <div key={card.label} className="xl:col-span-3">
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </div>
              ))}
            </div>

            <TableToolbar
              searchValue={tableSearch}
              onSearchSubmit={handleTableSearch}
              onSearchChange={(value) => setTableSearch(value)}
              searchPlaceholder="Search vendors..."
              filters={combinedToolbarFilters}
              canExport={canExport}
              onExport={canExport ? handleExportTable : undefined}
              columnToggles={columnVisibility}
              onColumnToggle={handleColumnToggle}
            >
              {filters.status !== 'all' || (filters.categories && filters.categories.length) ? (
                <Button variant="ghost" size="sm" onClick={() => { resetFilters(); setTableSearch(''); setTablePage(1); }}>
                  Clear filters
                </Button>
              ) : null}
            </TableToolbar>

            <DataTable
              columns={visibleTableColumns}
              rows={paginatedTableRows}
              keyExtractor={(row) => row.id}
              loading={loading}
              errorState={error ? <div className="text-sm text-red-600">{error}</div> : undefined}
              emptyState={<div>No vendors found.</div>}
              pagination={{
                page: tablePageSafe,
                pageSize: tablePageSize,
                total: filteredTableRows.length,
                onPageChange: (page) => setTablePage(page),
                onPageSizeChange: (size) => {
                  setTablePageSize(size);
                  setTablePage(1);
                },
                pageSizeOptions: [10, 20, 50],
              }}
              sort={{ sortBy: tableSort.sortBy, direction: tableSort.direction, onSortChange: handleTableSort }}
              onRowClick={(row) => console.log('Open vendor profile', row.code)}
            />
          </div>
        </BaseCard>
      </section>

      {/* Block 3 — Vendor Performance Insights */}
      <section>
        <BaseCard title="Vendor Performance Insights" subtitle="Delivery, lead time, and quality trends">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {performanceStatCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  className="xl:col-span-3 text-left"
                  style={{ cursor: card.onClick ? 'pointer' : 'default' }}
                >
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              <div className={`${MINI_CARD_CLASS} xl:col-span-6`}>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Top 5 Vendors by On-Time Delivery</div>
                <BarChart
                  data={topOnTimeVendors.map(({ vendor, onTime }) => ({ vendor, onTime }))}
                  categoryKey="vendor"
                  series={[{ id: 'onTime', valueKey: 'onTime', name: 'On-Time %' }]}
                  height={300}
                  orientation="horizontal"
                  onSelect={({ category }) => {
                    const matched = parsedVendors.find((vendor) => vendor.name === category);
                    if (matched) {
                      setQuery(matched.name);
                      setTableSearch(matched.name);
                      setTablePage(1);
                      handleScrollToTable();
                    }
                  }}
                />
              </div>
              <div className={`${MINI_CARD_CLASS} xl:col-span-6`}>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Issues / Complaints by Category</div>
                <PieChart
                  data={complaintsByCategory.length ? complaintsByCategory : [{ name: 'No Issues', value: 1 }]}
                  height={280}
                  onSelect={(datum) => {
                    setFilters({ categories: [datum.name] });
                    handleScrollToTable();
                  }}
                />
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      {/* Block 4 — Recent Activity */}
      <section>
        <BaseCard title="Recent Activity" subtitle="Vendor updates, holds, and document changes">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
              {[
                { label: 'Vendor Updates (This Week)', value: formatNumber(Math.max(4, recentLogs.length - 2)), icon: <RefreshCw className="h-5 w-5 text-indigo-600" /> },
                { label: 'New Vendors Added', value: formatNumber(statusCounts.New || 1), icon: <UserPlus className="h-5 w-5 text-emerald-600" /> },
                { label: 'Vendors Put On Hold', value: formatNumber(statusCounts['On Hold']), icon: <PauseCircle className="h-5 w-5 text-amber-600" /> },
                { label: 'Documents Updated', value: formatNumber(parsedVendors.reduce((sum, vendor) => sum + vendor.documentsUpdated, 0)), icon: <FileSpreadsheet className="h-5 w-5 text-purple-600" /> },
              ].map((card) => (
                <div key={card.label} className="xl:col-span-3">
                  <StatCard label={card.label} value={card.value} icon={card.icon} className="h-full" />
                </div>
              ))}
            </div>

            <div className={MINI_CARD_CLASS}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Recent Logs</div>
                  <div className="text-[13px] text-gray-500 dark:text-gray-400">Date range and action filters available</div>
                </div>
              </div>

              <TableToolbar
                searchValue={logSearch}
                onSearchSubmit={(value) => { setLogSearch(value); setLogPage(1); }}
                onSearchChange={(value) => setLogSearch(value)}
                searchPlaceholder="Search logs..."
                filters={[...recentActivityFilters, ...logDateFilters]}
                canExport={canExport}
                onExport={canExport ? handleExportLogs : undefined}
              />

              <DataTable
                columns={logColumns}
                rows={paginatedLogs}
                keyExtractor={(row) => row.id}
                emptyState={<div>No activity yet.</div>}
                pagination={{
                  page: logPageSafe,
                  pageSize: logPageSize,
                  total: filteredLogs.length,
                  onPageChange: (page) => setLogPage(page),
                  onPageSizeChange: undefined,
                  pageSizeOptions: [logPageSize],
                }}
              />
            </div>

            <BaseCard title="Activity Timeline" subtitle="Latest updates">
              <RecentActivityBlock items={recentActivityItems} footerActionLabel="View Activity Log" />
            </BaseCard>
          </div>
        </BaseCard>
      </section>
    </div>
  );
}

export default function Vendors() {
  return (
    <VendorsProvider>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <VendorsContent />
      </div>
    </VendorsProvider>
  );
}
