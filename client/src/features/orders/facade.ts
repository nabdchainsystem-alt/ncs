import axios from 'axios';

import { apiClient } from '../../lib/api';

export type OrderRecord = {
  id: number;
  orderNo: string;
  status: string;
  totalValue: number | null;
  currency: string | null;
  expectedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: number;
    name: string;
    code: string;
  } | null;
  request?: {
    id: number;
    orderNo: string | null;
  } | null;
};

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function fetchOrders(): Promise<OrderRecord[]> {
  try {
    const { data } = await apiClient.get<OrderRecord[]>('/api/orders');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}
