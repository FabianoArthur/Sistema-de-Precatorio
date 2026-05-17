import { apiClient } from '@/lib/api-client';
import type {
  MudarEstagioInput,
  PrecatorioCreateInput,
  PrecatorioFilters,
  PrecatorioUpdateInput,
} from '@preca/shared';
import type { PrecatorioDetail, PrecatorioListItem } from './types';

function buildQuery(filters: PrecatorioFilters): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const precatoriosApi = {
  list: (filters: PrecatorioFilters = {}) =>
    apiClient.get<PrecatorioListItem[]>(`/precatorios${buildQuery(filters)}`).then((r) => r.data),
  findOne: (id: string) =>
    apiClient.get<PrecatorioDetail>(`/precatorios/${id}`).then((r) => r.data),
  create: (data: PrecatorioCreateInput) =>
    apiClient.post<PrecatorioListItem>('/precatorios', data).then((r) => r.data),
  update: (id: string, data: PrecatorioUpdateInput) =>
    apiClient.patch<PrecatorioListItem>(`/precatorios/${id}`, data).then((r) => r.data),
  mudarEstagio: (id: string, data: MudarEstagioInput) =>
    apiClient.patch<PrecatorioListItem>(`/precatorios/${id}/estagio`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/precatorios/${id}`).then(() => undefined),
};
