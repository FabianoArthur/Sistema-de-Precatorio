import { apiClient } from '@/lib/api-client';
import type { CotacaoEnviarInput, CotacaoRecusarInput, CotacaoResponderInput } from '@preca/shared';
import type { CompradoresSugeridosResponse, CotacaoSummary, EnviarCotacoesResult } from './types';

export const cotacoesApi = {
  sugeridos: (precatorioId: string) =>
    apiClient
      .get<CompradoresSugeridosResponse>(`/precatorios/${precatorioId}/cotacoes/sugeridos`)
      .then((r) => r.data),
  enviar: (precatorioId: string, data: CotacaoEnviarInput) =>
    apiClient
      .post<EnviarCotacoesResult>(`/precatorios/${precatorioId}/cotacoes`, data)
      .then((r) => r.data),
  responder: (id: string, data: CotacaoResponderInput) =>
    apiClient.patch<CotacaoSummary>(`/cotacoes/${id}/responder`, data).then((r) => r.data),
  recusar: (id: string, data: CotacaoRecusarInput) =>
    apiClient.patch<CotacaoSummary>(`/cotacoes/${id}/recusar`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/cotacoes/${id}`).then(() => undefined),
};
