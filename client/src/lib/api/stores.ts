import { apiClient } from '../api';

export type StoreDTO = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  deletedAt: string | null;
  location: string | null;
  description: string | null;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
  warehouseCount?: number;
  inventoryCount?: number;
};

export type StoreListParams = {
  search?: string;
  activeOnly?: boolean;
  includeCounts?: boolean;
};

export type CreateStorePayload = {
  name: string;
  code?: string;
  location?: string;
  description?: string;
  capacity?: number;
};

export type UpdateStorePayload = Partial<CreateStorePayload> & {
  isActive?: boolean;
};

function buildQueryParams(params: StoreListParams | undefined) {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.search) query.q = params.search.trim();
  if (params.activeOnly === false) {
    query.activeOnly = '0';
  } else if (params.activeOnly === true) {
    query.activeOnly = '1';
  }
  if (params.includeCounts) query.includeCounts = '1';
  return query;
}

export async function listStores(params?: StoreListParams): Promise<StoreDTO[]> {
  const query = buildQueryParams(params);
  const { data } = await apiClient.get<{ items?: StoreDTO[] }>('/api/stores', {
    params: query,
  });
  if (!data || !Array.isArray(data.items)) return [];
  return data.items.map((store) => ({
    ...store,
    deletedAt: store.deletedAt ?? null,
    location: store.location ?? null,
    description: store.description ?? null,
    capacity: store.capacity ?? null,
  }));
}

export async function createStore(payload: CreateStorePayload): Promise<StoreDTO> {
  const { data } = await apiClient.post<StoreDTO>('/api/stores', payload);
  return data;
}

export async function updateStore(id: number, payload: UpdateStorePayload): Promise<StoreDTO> {
  const { data } = await apiClient.patch<StoreDTO>(`/api/stores/${id}`, payload);
  return data;
}

export async function deleteStore(id: number): Promise<void> {
  await apiClient.delete(`/api/stores/${id}`);
}
