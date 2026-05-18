import { apiClient } from '@/lib/api-client';
import type { Notificacao } from './types';

export const notificacoesApi = {
  list: (apenasNaoLidas?: boolean, limit = 20) => {
    const params = new URLSearchParams();
    if (apenasNaoLidas) params.set('apenasNaoLidas', 'true');
    params.set('limit', String(limit));
    return apiClient.get<Notificacao[]>(`/notificacoes?${params.toString()}`).then((r) => r.data);
  },
  contar: () =>
    apiClient.get<{ count: number }>('/notificacoes/nao-lidas/contar').then((r) => r.data),
  marcarLida: (id: string) =>
    apiClient.patch<Notificacao>(`/notificacoes/${id}/lida`).then((r) => r.data),
  marcarTodasLidas: () =>
    apiClient.post<{ atualizadas: number }>('/notificacoes/marcar-todas-lidas').then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/notificacoes/${id}`).then(() => undefined),
};
