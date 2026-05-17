import { apiClient } from '@/lib/api-client';
import type { CedenteCreateInput, CedenteUpdateInput } from '@preca/shared';
import type { Cedente } from './types';

export const cedentesApi = {
  list: () => apiClient.get<Cedente[]>('/cedentes').then((r) => r.data),
  findOne: (id: string) => apiClient.get<Cedente>(`/cedentes/${id}`).then((r) => r.data),
  create: (data: CedenteCreateInput) =>
    apiClient.post<Cedente>('/cedentes', data).then((r) => r.data),
  update: (id: string, data: CedenteUpdateInput) =>
    apiClient.patch<Cedente>(`/cedentes/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/cedentes/${id}`).then(() => undefined),
};
