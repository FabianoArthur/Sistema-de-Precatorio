import { apiClient } from '@/lib/api-client';
import type { ParceiroCreateInput, ParceiroUpdateInput } from '@preca/shared';
import type { Parceiro } from './types';

export const parceirosApi = {
  list: () => apiClient.get<Parceiro[]>('/parceiros').then((r) => r.data),
  findOne: (id: string) => apiClient.get<Parceiro>(`/parceiros/${id}`).then((r) => r.data),
  create: (data: ParceiroCreateInput) =>
    apiClient.post<Parceiro>('/parceiros', data).then((r) => r.data),
  update: (id: string, data: ParceiroUpdateInput) =>
    apiClient.patch<Parceiro>(`/parceiros/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/parceiros/${id}`).then(() => undefined),
};
