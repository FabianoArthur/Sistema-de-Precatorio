import { apiClient } from '@/lib/api-client';
import type { NegociacaoCreateInput } from '@preca/shared';
import type { NegociacaoSummary } from './types';

export const negociacoesApi = {
  create: (precatorioId: string, data: NegociacaoCreateInput) =>
    apiClient
      .post<NegociacaoSummary>(`/precatorios/${precatorioId}/negociacoes`, data)
      .then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/negociacoes/${id}`).then(() => undefined),
};
