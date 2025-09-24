import { safeApiGet } from '../../lib/api';

export type VendorSummary = {
  id: number;
  name: string;
  status: string;
  category: string;
  createdAt: string;
};

export type VendorsKpis = {
  total: number;
  active: number;
  onHold: number;
  newThisMonth: number;
  totalSpend: number;
};

export type VendorsAnalytics = {
  byStatus: Array<{ status: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  spendByVendor: Array<{ vendorId: number; vendorName: string; total: number }>;
  monthlySpend: Array<{ month: string; total: number }>;
  ratingAvg: number | null;
};

export async function fetchVendors(): Promise<VendorSummary[]> {
  const data = await safeApiGet<VendorSummary[]>('/api/vendors', []);
  return Array.isArray(data) ? data : [];
}

export async function fetchVendorsKpis(): Promise<VendorsKpis> {
  return safeApiGet<VendorsKpis>('/api/vendors/kpis', {
    total: 0,
    active: 0,
    onHold: 0,
    newThisMonth: 0,
    totalSpend: 0,
  });
}

export async function fetchVendorsAnalytics(): Promise<VendorsAnalytics> {
  const data = await safeApiGet<VendorsAnalytics>('/api/vendors/analytics', {
    byStatus: [],
    byCategory: [],
    spendByVendor: [],
    monthlySpend: [],
    ratingAvg: null,
  });
  return {
    byStatus: data?.byStatus ?? [],
    byCategory: data?.byCategory ?? [],
    spendByVendor: data?.spendByVendor ?? [],
    monthlySpend: data?.monthlySpend ?? [],
    ratingAvg: data?.ratingAvg ?? null,
  };
}
