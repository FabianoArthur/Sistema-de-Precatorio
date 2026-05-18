import type { CotacaoEnviarInput, CotacaoRecusarInput, CotacaoResponderInput } from '@preca/shared';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cotacoesApi } from './api';

function invalidatePrecatorio(qc: QueryClient, precatorioId: string) {
  qc.invalidateQueries({ queryKey: ['precatorios', precatorioId] });
  qc.invalidateQueries({ queryKey: ['precatorios'] });
  qc.invalidateQueries({ queryKey: ['cotacoes', 'sugeridos', precatorioId] });
}

export function useCompradoresSugeridos(precatorioId: string | undefined) {
  return useQuery({
    queryKey: ['cotacoes', 'sugeridos', precatorioId],
    queryFn: () => cotacoesApi.sugeridos(precatorioId as string),
    enabled: !!precatorioId,
  });
}

export function useEnviarCotacoes(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CotacaoEnviarInput) => cotacoesApi.enviar(precatorioId, data),
    onSuccess: () => invalidatePrecatorio(qc, precatorioId),
  });
}

export function useResponderCotacao(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CotacaoResponderInput }) =>
      cotacoesApi.responder(id, data),
    onSuccess: () => invalidatePrecatorio(qc, precatorioId),
  });
}

export function useRecusarCotacao(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CotacaoRecusarInput }) =>
      cotacoesApi.recusar(id, data),
    onSuccess: () => invalidatePrecatorio(qc, precatorioId),
  });
}

export function useDeleteCotacao(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cotacoesApi.remove(id),
    onSuccess: () => invalidatePrecatorio(qc, precatorioId),
  });
}
