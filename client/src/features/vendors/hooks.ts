import { useQuery } from '@tanstack/react-query';

import { fetchVendors, fetchVendorsAnalytics, fetchVendorsKpis } from './facade';

const vendorsKeys = {
  list: ['vendors', 'list'] as const,
  kpis: ['vendors', 'kpis'] as const,
  analytics: ['vendors', 'analytics'] as const,
};

export function useVendors() {
  const query = useQuery({
    queryKey: vendorsKeys.list,
    queryFn: fetchVendors,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useVendorsKpis() {
  const query = useQuery({
    queryKey: vendorsKeys.kpis,
    queryFn: fetchVendorsKpis,
  });

  return {
    data: query.data ?? { total: 0, active: 0, onHold: 0, newThisMonth: 0, totalSpend: 0 },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useVendorsAnalytics() {
  const query = useQuery({
    queryKey: vendorsKeys.analytics,
    queryFn: fetchVendorsAnalytics,
  });

  return {
    data: query.data ?? { byStatus: [], byCategory: [], spendByVendor: [], monthlySpend: [], ratingAvg: null },
    isLoading: query.isLoading,
    error: query.error,
  };
}
