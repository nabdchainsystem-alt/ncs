

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
  credentials: init?.credentials ?? 'include',
  ...init,
});

async function ensureOk(res: Response, fallback: string) {
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    const message = detail?.message || detail?.error || fallback;
    throw new Error(message);
  }
  return res;
}

// -------- API functions --------
export async function listVendors(params: VendorsListParams = {}) {
  const qs = toParams(params);
  const res = await fetch(`${API_URL}/vendors${qs ? `?${qs}` : ''}` , {
    credentials: 'include',
  });
  await ensureOk(res, 'Failed to load vendors');
  return res.json();
}

export async function createVendor(body: VendorUpsert) {
  const res = await fetch(`${API_URL}/vendors`, json({ method: 'POST', body: JSON.stringify(body) }));
  await ensureOk(res, 'Failed to create vendor');
  return res.json();
}

export async function updateVendor(id: string, body: VendorUpsert) {
  const res = await fetch(`${API_URL}/vendors/${id}`, json({ method: 'PATCH', body: JSON.stringify(body) }));
  await ensureOk(res, 'Failed to update vendor');
  return res.json();
}

export async function bulkImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/vendors:import`, { method: 'POST', body: form, credentials: 'include' });
  await ensureOk(res, 'Failed to import vendors');
  return res.json();
}

export async function exportVendors(params: VendorsListParams = {}): Promise<Blob> {
  const qs = toParams(params);
  const res = await fetch(`${API_URL}/vendors:export${qs ? `?${qs}` : ''}`, {
    credentials: 'include',
  });
  await ensureOk(res, 'Failed to export vendors');
  return res.blob();
}

export async function recomputeTrustScores() {
  const res = await fetch(`${API_URL}/vendors:recompute-trust`, { method: 'POST', credentials: 'include' });
  await ensureOk(res, 'Failed to recompute trust scores');
  return res.json();
}

export async function scanRisks() {
  const res = await fetch(`${API_URL}/vendors:risk-scan`, { method: 'POST', credentials: 'include' });
  await ensureOk(res, 'Failed to run risk scan');
  return res.json();
}

export async function generateComplianceReport(): Promise<Blob> {
  const res = await fetch(`${API_URL}/vendors:compliance-report`, {
    credentials: 'include',
  });
  await ensureOk(res, 'Failed to generate compliance report');
  return res.blob();
}

export async function estimateCarbon(vendorIds: string[]) {
  const res = await fetch(`${API_URL}/vendors:carbon-estimate`, json({ method: 'POST', body: JSON.stringify({ vendorIds }) }));
  await ensureOk(res, 'Failed to estimate carbon impact');
  return res.json();
}

export async function getPerformance(id: string, q: VendorPerformanceQuery = {}) {
  const qs = toParams(q);
  const res = await fetch(`${API_URL}/vendors/${id}/performance${qs ? `?${qs}` : ''}`, {
    credentials: 'include',
  });
  await ensureOk(res, 'Failed to load performance');
  return res.json();
}

export async function getDocuments(id: string) {
  const res = await fetch(`${API_URL}/vendors/${id}/documents`, {
    credentials: 'include',
  });
  await ensureOk(res, 'Failed to load documents');
  return res.json();
}

export async function uploadDocument(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/vendors/${id}/documents`, { method: 'POST', body: form, credentials: 'include' });
  await ensureOk(res, 'Failed to upload document');
  return res.json();
}

export async function getProducts(id: string) {
  const res = await fetch(`${API_URL}/vendors/${id}/products`, {
    credentials: 'include',
  });
  await ensureOk(res, 'Failed to load products');
  return res.json();
}

export async function updateProducts(id: string, products: any[]) {
  const res = await fetch(`${API_URL}/vendors/${id}/products`, json({ method: 'PATCH', body: JSON.stringify({ products }) }));
  await ensureOk(res, 'Failed to update products');
  return res.json();
}
