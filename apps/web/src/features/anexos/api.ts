import { apiClient } from '@/lib/api-client';
import type { AplicarValorInput } from '@preca/shared';
import type { AnexoSummary } from './types';

export const anexosApi = {
  list: (precatorioId: string) =>
    apiClient.get<AnexoSummary[]>(`/precatorios/${precatorioId}/anexos`).then((r) => r.data),
  upload: (precatorioId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<AnexoSummary>(`/precatorios/${precatorioId}/anexos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  remove: (id: string) => apiClient.delete(`/anexos/${id}`).then(() => undefined),
  reprocessar: (id: string) => apiClient.post(`/anexos/${id}/reprocessar`).then(() => undefined),
  aplicar: (id: string, data: AplicarValorInput) =>
    apiClient.post(`/anexos/${id}/aplicar`, data).then((r) => r.data),
  downloadBlobUrl: async (id: string) => {
    const res = await apiClient.get(`/anexos/${id}/download`, { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },
};
