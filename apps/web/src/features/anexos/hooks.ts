import type { AplicarValorInput } from '@preca/shared';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { anexosApi } from './api';
import type { AnexoSummary } from './types';

function invalidate(qc: QueryClient, precatorioId: string) {
  qc.invalidateQueries({ queryKey: ['precatorios', precatorioId] });
  qc.invalidateQueries({ queryKey: ['precatorios'] });
  qc.invalidateQueries({ queryKey: ['anexos', precatorioId] });
}

export function useAnexos(precatorioId: string) {
  return useQuery({
    queryKey: ['anexos', precatorioId],
    queryFn: () => anexosApi.list(precatorioId),
    refetchInterval: (query) => {
      const data = query.state.data as AnexoSummary[] | undefined;
      if (!data) return false;
      const pendentes = data.some(
        (a) => a.ocrStatus === 'PROCESSANDO' || a.ocrStatus === 'NAO_PROCESSADO',
      );
      return pendentes ? 3000 : false;
    },
  });
}

export function useUploadAnexo(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => anexosApi.upload(precatorioId, file),
    onSuccess: () => invalidate(qc, precatorioId),
  });
}

export function useDeleteAnexo(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anexosApi.remove(id),
    onSuccess: () => invalidate(qc, precatorioId),
  });
}

export function useReprocessarAnexo(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anexosApi.reprocessar(id),
    onSuccess: () => invalidate(qc, precatorioId),
  });
}

export function useAplicarValor(precatorioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AplicarValorInput }) =>
      anexosApi.aplicar(id, data),
    onSuccess: () => invalidate(qc, precatorioId),
  });
}
