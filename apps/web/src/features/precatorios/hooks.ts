import type {
  MudarEstagioInput,
  PrecatorioCreateInput,
  PrecatorioFilters,
  PrecatorioUpdateInput,
} from '@preca/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { precatoriosApi } from './api';

const KEY = ['precatorios'] as const;

export function usePrecatorios(filters: PrecatorioFilters = {}) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => precatoriosApi.list(filters),
  });
}

export function usePrecatorio(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => precatoriosApi.findOne(id as string),
    enabled: !!id,
  });
}

export function useCreatePrecatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PrecatorioCreateInput) => precatoriosApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePrecatorio(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PrecatorioUpdateInput) => precatoriosApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMudarEstagio(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MudarEstagioInput) => precatoriosApi.mudarEstagio(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePrecatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => precatoriosApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
