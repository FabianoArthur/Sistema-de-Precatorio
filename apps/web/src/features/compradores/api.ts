import type { CompradorCreateInput, CompradorUpdateInput } from '@preca/shared';
import { apiClient } from '@/lib/api-client';
import type { Comprador } from './types';

export const compradoresApi = {
  list: () => apiClient.get<Comprador[]>('/compradores').then((r) => r.data),
  findOne: (id: string) => apiClient.get<Comprador>(`/compradores/${id}`).then((r) => r.data),
  create: (data: CompradorCreateInput) =>
    apiClient.post<Comprador>('/compradores', data).then((r) => r.data),
  update: (id: string, data: CompradorUpdateInput) =>
    apiClient.patch<Comprador>(`/compradores/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/compradores/${id}`).then(() => undefined),
};
