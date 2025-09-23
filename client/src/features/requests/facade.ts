import axios from 'axios';

import { apiClient } from '../../lib/api';

export type RequestItemRecord = {
  id: number;
  name: string | null;
  code: string | null;
  qty: number | null;
  unit: string | null;
  status: string | null;
  machine: string | null;
  warehouse: string | null;
  requester: string | null;
};

export type RequestRecord = {
  id: number;
  orderNo: string;
  title: string | null;
  department: string | null;
  vendor: string | null;
  priority: string;
  status: string;
  requiredDate: string | null;
  requester: string | null;
  createdAt: string;
  updatedAt: string;
  items: RequestItemRecord[];
};

export type RequestsKpi = {
  total: number;
  open: number;
  closed: number;
  approved: number;
  rejected: number;
  onHold: number;
  inReview: number;
};

export type RequestStateStat = {
  status: string | null;
  count: number;
};

export type RequestDepartmentStat = {
  department: string | null;
  count: number;
};

export type RequestLeadTimeRecord = {
  id: number;
  orderNo: string;
  priority: string;
  leadTimeDays: number;
};

export type RequestUrgentDelayRecord = {
  id: number;
  orderNo: string;
  title: string | null;
  department: string | null;
  requiredDate: string | null;
  createdAt: string | null;
};

const emptyKpis: RequestsKpi = {
  total: 0,
  open: 0,
  closed: 0,
  approved: 0,
  rejected: 0,
  onHold: 0,
  inReview: 0,
};

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function fetchRequests(): Promise<RequestRecord[]> {
  try {
    const { data } = await apiClient.get<RequestRecord[]>('/api/requests');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function fetchRequestKpis(): Promise<RequestsKpi> {
  try {
    const { data } = await apiClient.get<RequestsKpi>('/api/requests/kpis');
    return { ...emptyKpis, ...(data ?? {}) };
  } catch (error) {
    if (isNotFound(error)) return { ...emptyKpis };
    throw error;
  }
}

export async function fetchRequestStateStats(): Promise<RequestStateStat[]> {
  try {
    const { data } = await apiClient.get<RequestStateStat[]>('/api/requests/analytics/states');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function fetchRequestDepartmentStats(): Promise<RequestDepartmentStat[]> {
  try {
    const { data } = await apiClient.get<RequestDepartmentStat[]>('/api/requests/analytics/dept');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function fetchRequestLeadTimes(): Promise<RequestLeadTimeRecord[]> {
  try {
    const { data } = await apiClient.get<RequestLeadTimeRecord[]>('/api/requests/lead-times');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function fetchRequestUrgentDelays(): Promise<RequestUrgentDelayRecord[]> {
  try {
    const { data } = await apiClient.get<RequestUrgentDelayRecord[]>('/api/requests/urgent-delays');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}
