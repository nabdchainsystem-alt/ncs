import { useQuery } from '@tanstack/react-query';

import {
  fetchRequestDepartmentStats,
  fetchRequestKpis,
  fetchRequestLeadTimes,
  fetchRequestStateStats,
  fetchRequestUrgentDelays,
  fetchRequests,
} from './facade';

const requestsKeys = {
  all: ['requests'] as const,
  list: ['requests', 'list'] as const,
  kpis: ['requests', 'kpis'] as const,
  states: ['requests', 'states'] as const,
  departments: ['requests', 'departments'] as const,
  leadTimes: ['requests', 'lead-times'] as const,
  urgentDelays: ['requests', 'urgent-delays'] as const,
};

export function useRequests() {
  const query = useQuery({
    queryKey: requestsKeys.list,
    queryFn: fetchRequests,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useRequestKpis() {
  const query = useQuery({
    queryKey: requestsKeys.kpis,
    queryFn: fetchRequestKpis,
  });

  return {
    data: query.data ?? {
      total: 0,
      open: 0,
      closed: 0,
      approved: 0,
      rejected: 0,
      onHold: 0,
      inReview: 0,
    },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useRequestStateStats() {
  const query = useQuery({
    queryKey: requestsKeys.states,
    queryFn: fetchRequestStateStats,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useRequestDepartmentStats() {
  const query = useQuery({
    queryKey: requestsKeys.departments,
    queryFn: fetchRequestDepartmentStats,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useRequestLeadTimes() {
  const query = useQuery({
    queryKey: requestsKeys.leadTimes,
    queryFn: fetchRequestLeadTimes,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useRequestUrgentDelays() {
  const query = useQuery({
    queryKey: requestsKeys.urgentDelays,
    queryFn: fetchRequestUrgentDelays,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
