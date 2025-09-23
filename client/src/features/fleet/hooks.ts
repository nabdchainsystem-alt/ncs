import { useQuery } from '@tanstack/react-query';

import {
  fetchFleetAnalytics,
  fetchFleetKpis,
  fetchFleetMaintenance,
  fetchFleetVehicles,
} from './facade';

const fleetKeys = {
  vehicles: ['fleet', 'vehicles'] as const,
  maintenance: ['fleet', 'maintenance'] as const,
  kpis: ['fleet', 'kpis'] as const,
  analytics: ['fleet', 'analytics'] as const,
};

export function useFleetVehicles() {
  const query = useQuery({
    queryKey: fleetKeys.vehicles,
    queryFn: fetchFleetVehicles,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useFleetMaintenance() {
  const query = useQuery({
    queryKey: fleetKeys.maintenance,
    queryFn: fetchFleetMaintenance,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useFleetKpis() {
  const query = useQuery({
    queryKey: fleetKeys.kpis,
    queryFn: fetchFleetKpis,
  });

  return {
    data: query.data ?? { total: 0, inOperation: 0, underMaintenance: 0, totalDistance: 0 },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useFleetAnalytics() {
  const query = useQuery({
    queryKey: fleetKeys.analytics,
    queryFn: fetchFleetAnalytics,
  });

  return {
    data: query.data ?? { statusDistribution: [], departmentUsage: [], maintenanceTrend: [] },
    isLoading: query.isLoading,
    error: query.error,
  };
}
