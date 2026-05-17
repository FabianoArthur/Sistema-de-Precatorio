import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ParceiroCreateInput, ParceiroUpdateInput } from '@preca/shared';
import { parceirosApi } from './api';

const KEY = ['parceiros'] as const;

export function useParceiros() {
  return useQuery({ queryKey: KEY, queryFn: parceirosApi.list });
}

export function useParceiro(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => parceirosApi.findOne(id as string),
    enabled: !!id,
  });
}

export function useCreateParceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ParceiroCreateInput) => parceirosApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateParceiro(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ParceiroUpdateInput) => parceirosApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteParceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parceirosApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
