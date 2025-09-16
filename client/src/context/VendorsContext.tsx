import React, { createContext, useContext, useMemo, useState } from 'react';
import { API_URL } from '../lib/api';

// Lightweight shapes for table/KPIs/alerts
export type VendorRowLite = {
  id: string | number;
  code?: string;
  name: string;
  category?: string;
  region?: string;
  leadTime?: number;        // days
  onTimePct?: number;       // 0..100
  qualityPpm?: number;
  priceIndex?: number;      // baseline 100
  responseHrs?: number;
  trustScore?: number;      // 0..100
  status?: string;
};

export type VendorsKpis = {
  total?: number;
  approved?: number;
  pending?: number;
  onHold?: number;
  avgLeadTime?: number;
  onTimePct?: number;
  complaints30d?: number;
  avgTrust?: number;
  avgQuoteRespHrs?: number;
};

export type VendorsAlertsSummary = {
  expiringDocs?: number;
  singleSource?: number;
  qualityLate?: number;
  carbonFlags?: number;
};

// Types
export type VendorStatus = 'all' | 'approved' | 'pending' | 'on-hold' | 'suspended';

export type VendorsFilters = {
  status: VendorStatus;
  categories: string[];
  regions: string[];
  minTrust: number | null;
  onTimeMin: number | null; // %
  priceIndexMax: number | null; // <= Y
  hasISO: boolean | null; // ESG/ISO valid
};

export type VendorsSelection = {
  selectedIds: string[];
  compareIds: string[]; // up to 4
};

export type VendorsContextValue = {
  // state
  query: string;
  filters: VendorsFilters;
  selection: VendorsSelection;
  loading: boolean;

  // data
  vendors: VendorRowLite[];
  kpis: VendorsKpis | null;
  alerts: VendorsAlertsSummary | null;
  error: string | null;

  // setters
  setQuery: (q: string) => void;
  setFilters: (p: Partial<VendorsFilters>) => void;
  resetFilters: () => void;

  // selection helpers
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  // actions / tools bar
  importVendors: (file: File) => Promise<void>;
  exportVendors: () => Promise<Blob>;
  recomputeTrust: () => Promise<void>;
  riskScan: () => Promise<void>;
  complianceReport: () => Promise<Blob>;
  carbonEstimate: (vendorIds: string[]) => Promise<any>;

  // loaders
  reload: () => Promise<void>;
};

const defaultFilters: VendorsFilters = {
  status: 'all',
  categories: [],
  regions: [],
  minTrust: null,
  onTimeMin: null,
  priceIndexMax: null,
  hasISO: null,
};

const VendorsContext = createContext<VendorsContextValue | null>(null);

export const useVendors = () => {
  const ctx = useContext(VendorsContext);
  if (!ctx) throw new Error('useVendors must be used within VendorsProvider');
  return ctx;
};

export const VendorsProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [filters, setFiltersState] = useState<VendorsFilters>(defaultFilters);
  const [selection, setSelection] = useState<VendorsSelection>({ selectedIds: [], compareIds: [] });
  const [loading, setLoading] = useState(false);

  const [vendors, setVendors] = useState<VendorRowLite[]>([]);
  const [kpis, setKpis] = useState<VendorsKpis | null>(null);
  const [alerts, setAlerts] = useState<VendorsAlertsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(filters)]);

  const setFilters = (p: Partial<VendorsFilters>) =>
    setFiltersState((prev) => ({ ...prev, ...p }));

  const resetFilters = () => setFiltersState(defaultFilters);

  const toggleSelect = (id: string) =>
    setSelection((s) => ({
      ...s,
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    }));

  const clearSelection = () => setSelection((s) => ({ ...s, selectedIds: [] }));

  const toggleCompare = (id: string) =>
    setSelection((s) => {
      const exists = s.compareIds.includes(id);
      const next = exists ? s.compareIds.filter((x) => x !== id) : [...s.compareIds, id];
      return { ...s, compareIds: next.slice(0, 4) };
    });

  const clearCompare = () => setSelection((s) => ({ ...s, compareIds: [] }));

  const buildParams = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.categories.length) params.set('category', filters.categories.join(','));
    if (filters.regions.length) params.set('region', filters.regions.join(','));
    if (filters.minTrust != null) params.set('minTrust', String(filters.minTrust));
    if (filters.onTimeMin != null) params.set('onTimeMin', String(filters.onTimeMin));
    if (filters.priceIndexMax != null) params.set('priceIndexMax', String(filters.priceIndexMax));
    if (filters.hasISO != null) params.set('hasISO', String(filters.hasISO));
    return params;
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/vendors?${buildParams().toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || `list_failed_${res.status}`);
      }
      const payload = await res.json();
      // Accept both plain array or {items, kpis, alerts}
      const items: VendorRowLite[] = Array.isArray(payload) ? payload : (payload.items ?? []);
      setVendors(items);
      setKpis(Array.isArray(payload) ? null : (payload.kpis ?? null));
      setAlerts(Array.isArray(payload) ? null : (payload.alerts ?? null));
    } catch (e: any) {
      setError(String(e?.message || 'list_failed'));
    } finally {
      setLoading(false);
    }
  };

  // ---- Actions (API calls) ----
  const importVendors = async (file: File) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/api/vendors/import`, { method: 'POST', body: form, credentials: 'include' });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || 'import_failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportVendors = async (): Promise<Blob> => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`${API_URL}/api/vendors/export?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || 'export_failed');
      }
      return await res.blob();
    } finally {
      setLoading(false);
    }
  };

  const recomputeTrust = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vendors/recompute-trust`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || 'recompute_failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const riskScan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vendors/risk-scan`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || 'risk_scan_failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const complianceReport = async (): Promise<Blob> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vendors/compliance-report`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || 'compliance_failed');
      }
      return await res.blob();
    } finally {
      setLoading(false);
    }
  };

  const carbonEstimate = async (vendorIds: string[]) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vendors/carbon-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vendorIds }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.message || 'carbon_failed');
      }
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const value: VendorsContextValue = useMemo(
    () => ({
      query,
      filters,
      selection,
      loading,
      vendors,
      kpis,
      alerts,
      error,
      setQuery,
      setFilters,
      resetFilters,
      toggleSelect,
      clearSelection,
      toggleCompare,
      clearCompare,
      importVendors,
      exportVendors,
      recomputeTrust,
      riskScan,
      complianceReport,
      carbonEstimate,
      reload,
    }),
    [query, filters, selection, loading, vendors, kpis, alerts, error]
  );

  return <VendorsContext.Provider value={value}>{children}</VendorsContext.Provider>;
};

export default VendorsContext;
