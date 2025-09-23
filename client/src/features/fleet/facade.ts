import axios from 'axios';

import { apiClient } from '../../lib/api';

export type MaintenanceRecord = {
  id: number;
  vehicleId: number;
  type: string;
  date: string;
  costSar: number | null;
  vendorName: string | null;
  odometer: number | null;
  notes: string | null;
  vehicle?: {
    id: number;
    plateNo: string;
    make: string | null;
    model: string | null;
  } | null;
};

export type VehicleRecord = {
  id: number;
  plateNo: string;
  make: string | null;
  model: string | null;
  year: number | null;
  department: string | null;
  status: string;
  odometer: number | null;
  isDeleted: boolean;
  lastServiceAt: string | null;
  createdAt: string;
  updatedAt: string;
  maintenance?: MaintenanceRecord[];
};

export type FleetKpis = {
  total: number;
  inOperation: number;
  underMaintenance: number;
  totalDistance: number;
};

export type FleetAnalytics = {
  statusDistribution: Array<{ status: string; count: number }>;
  departmentUsage: Array<{ department: string; count: number }>;
  maintenanceTrend: Array<{ month: string; events: number; cost: number }>;
};

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function fetchFleetVehicles(): Promise<VehicleRecord[]> {
  try {
    const { data } = await apiClient.get<VehicleRecord[]>('/api/fleet/vehicles');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function fetchFleetMaintenance(): Promise<MaintenanceRecord[]> {
  try {
    const { data } = await apiClient.get<MaintenanceRecord[]>('/api/fleet/maintenance');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function fetchFleetKpis(): Promise<FleetKpis> {
  try {
    const { data } = await apiClient.get<FleetKpis>('/api/fleet/kpis');
    return data;
  } catch (error) {
    if (isNotFound(error)) {
      return { total: 0, inOperation: 0, underMaintenance: 0, totalDistance: 0 };
    }
    throw error;
  }
}

export async function fetchFleetAnalytics(): Promise<FleetAnalytics> {
  try {
    const { data } = await apiClient.get<FleetAnalytics>('/api/fleet/analytics');
    return {
      statusDistribution: data?.statusDistribution ?? [],
      departmentUsage: data?.departmentUsage ?? [],
      maintenanceTrend: data?.maintenanceTrend ?? [],
    };
  } catch (error) {
    if (isNotFound(error)) {
      return { statusDistribution: [], departmentUsage: [], maintenanceTrend: [] };
    }
    throw error;
  }
}
