import axios from 'axios';

import { apiClient } from '../../lib/api';

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

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function fetchVendors(): Promise<VendorSummary[]> {
  try {
    const { data } = await apiClient.get<VendorSummary[]>('/api/vendors');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function fetchVendorsKpis(): Promise<VendorsKpis> {
  try {
    const { data } = await apiClient.get<VendorsKpis>('/api/vendors/kpis');
    return data;
  } catch (error) {
    if (isNotFound(error)) {
      return { total: 0, active: 0, onHold: 0, newThisMonth: 0, totalSpend: 0 };
    }
    throw error;
  }
}

export async function fetchVendorsAnalytics(): Promise<VendorsAnalytics> {
  try {
    const { data } = await apiClient.get<VendorsAnalytics>('/api/vendors/analytics');
    return {
      byStatus: data?.byStatus ?? [],
      byCategory: data?.byCategory ?? [],
      spendByVendor: data?.spendByVendor ?? [],
      monthlySpend: data?.monthlySpend ?? [],
      ratingAvg: data?.ratingAvg ?? null,
    };
  } catch (error) {
    if (isNotFound(error)) {
      return { byStatus: [], byCategory: [], spendByVendor: [], monthlySpend: [], ratingAvg: null };
    }
    throw error;
  }
}
