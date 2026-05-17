import type { CedenteCreateInput, CedenteUpdateInput } from '@preca/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cedentesApi } from './api';

const KEY = ['cedentes'] as const;

export function useCedentes() {
  return useQuery({ queryKey: KEY, queryFn: cedentesApi.list });
}

export function useCedente(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => cedentesApi.findOne(id as string),
    enabled: !!id,
  });
}

export function useCreateCedente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CedenteCreateInput) => cedentesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCedente(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CedenteUpdateInput) => cedentesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCedente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cedentesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
