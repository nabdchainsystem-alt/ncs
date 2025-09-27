import { apiClient } from '../api';
import { MATERIAL_SUGGESTION_LIMIT } from '../../config/inventory';

export type MaterialSuggestion = {
  id: number;
  name: string;
  code: string | null;
};

export async function getMaterialsByPrefix(prefix: string, limit = MATERIAL_SUGGESTION_LIMIT): Promise<MaterialSuggestion[]> {
  const trimmed = prefix.trim();
  if (!trimmed) return [];

  const params = { prefix: trimmed, limit };
  const { data } = await apiClient.get<{ items?: Array<{ id: number; name: string; code: string | null }> }>('/api/materials', {
    params,
  });

  if (!data || !Array.isArray(data.items)) return [];
  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code ?? null,
  }));
}
