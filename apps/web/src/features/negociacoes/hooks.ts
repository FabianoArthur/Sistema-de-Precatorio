import type { NegociacaoCreateInput } from '@preca/shared';
import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { negociacoesApi } from './api';

function invalidatePrecatorio(qc: QueryClient, precatorioId: string) {
  qc.invalidateQueries({ queryKey: ['precatorios', precatorioId] });
  qc.invalidateQueries({ queryKey: ['precatorios'] });
}

export function useCreateNegociacao(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NegociacaoCreateInput) => negociacoesApi.create(precatorioId, data),
    onSuccess: () => invalidatePrecatorio(qc, precatorioId),
  });
}

export function useDeleteNegociacao(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => negociacoesApi.remove(id),
    onSuccess: () => invalidatePrecatorio(qc, precatorioId),
  });
}
