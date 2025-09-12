

import { API_URL } from './api';

// -------- Types (lightweight) --------
export type VendorStatus = 'approved' | 'pending' | 'on-hold' | 'suspended';

export type VendorsListParams = {
  q?: string;
  status?: VendorStatus | 'all';
  category?: string | string[];
  region?: string | string[];
  minTrust?: number;
  onTimeMin?: number;
  priceIndexMax?: number;
  hasISO?: boolean;
  page?: number;
  pageSize?: number;
};

export type VendorUpsert = {
  code?: string;
  name?: string;
  categories?: string[];
  regions?: string[];
  status?: VendorStatus;
  contacts?: Array<{ name: string; role?: string; email?: string; phone?: string }>;
  documents?: Array<{ type: string; number?: string; expiry?: string; fileUrl?: string }>;
  bank?: { iban?: string; swift?: string; beneficiary?: string };
  metrics?: {
    onTimePct?: number;
    leadTimeAvgDays?: number;
    qualityPpm?: number;
    priceIndex?: number;
    quoteRespHrs?: number;
  };
  trustScore?: number;
  logistics?: { prefIncoterms?: string; shipModes?: string[]; avgCO2perOrder?: number };
};

export type VendorPerformanceQuery = { from?: string; to?: string };

// -------- Helpers --------
const toParams = (p: Record<string, any>) =>
  new URLSearchParams(
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
      .flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, String(x)]) : [[k, String(v)]])) as any
  ).toString();

const json = (init?: RequestInit): RequestInit => ({
  headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  ...init,
});

// -------- API functions --------
export async function listVendors(params: VendorsListParams = {}) {
  const qs = toParams(params);
  const res = await fetch(`${API_URL}/vendors${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('vendors_list_failed');
  return res.json();
}

export async function createVendor(body: VendorUpsert) {
  const res = await fetch(`${API_URL}/vendors`, json({ method: 'POST', body: JSON.stringify(body) }));
  if (!res.ok) throw new Error('vendor_create_failed');
  return res.json();
}

export async function updateVendor(id: string, body: VendorUpsert) {
  const res = await fetch(`${API_URL}/vendors/${id}`, json({ method: 'PATCH', body: JSON.stringify(body) }));
  if (!res.ok) throw new Error('vendor_update_failed');
  return res.json();
}

export async function bulkImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/vendors:import`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('vendors_import_failed');
  return res.json();
}

export async function exportVendors(params: VendorsListParams = {}): Promise<Blob> {
  const qs = toParams(params);
  const res = await fetch(`${API_URL}/vendors:export${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('vendors_export_failed');
  return res.blob();
}

export async function recomputeTrustScores() {
  const res = await fetch(`${API_URL}/vendors:recompute-trust`, { method: 'POST' });
  if (!res.ok) throw new Error('vendors_recompute_trust_failed');
  return res.json();
}

export async function scanRisks() {
  const res = await fetch(`${API_URL}/vendors:risk-scan`, { method: 'POST' });
  if (!res.ok) throw new Error('vendors_risk_scan_failed');
  return res.json();
}

export async function generateComplianceReport(): Promise<Blob> {
  const res = await fetch(`${API_URL}/vendors:compliance-report`);
  if (!res.ok) throw new Error('vendors_compliance_report_failed');
  return res.blob();
}

export async function estimateCarbon(vendorIds: string[]) {
  const res = await fetch(`${API_URL}/vendors:carbon-estimate`, json({ method: 'POST', body: JSON.stringify({ vendorIds }) }));
  if (!res.ok) throw new Error('vendors_carbon_estimate_failed');
  return res.json();
}

export async function getPerformance(id: string, q: VendorPerformanceQuery = {}) {
  const qs = toParams(q);
  const res = await fetch(`${API_URL}/vendors/${id}/performance${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('vendor_performance_failed');
  return res.json();
}

export async function getDocuments(id: string) {
  const res = await fetch(`${API_URL}/vendors/${id}/documents`);
  if (!res.ok) throw new Error('vendor_documents_failed');
  return res.json();
}

export async function uploadDocument(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/vendors/${id}/documents`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('vendor_upload_document_failed');
  return res.json();
}

export async function getProducts(id: string) {
  const res = await fetch(`${API_URL}/vendors/${id}/products`);
  if (!res.ok) throw new Error('vendor_products_failed');
  return res.json();
}

export async function updateProducts(id: string, products: any[]) {
  const res = await fetch(`${API_URL}/vendors/${id}/products`, json({ method: 'PATCH', body: JSON.stringify({ products }) }));
  if (!res.ok) throw new Error('vendor_update_products_failed');
  return res.json();
}