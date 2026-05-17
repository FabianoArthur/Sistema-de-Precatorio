import type { CompradorCreateInput, CompradorUpdateInput } from '@preca/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compradoresApi } from './api';

const KEY = ['compradores'] as const;

export function useCompradores() {
  return useQuery({ queryKey: KEY, queryFn: compradoresApi.list });
}

export function useComprador(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => compradoresApi.findOne(id as string),
    enabled: !!id,
  });
}

export function useCreateComprador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompradorCreateInput) => compradoresApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateComprador(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompradorUpdateInput) => compradoresApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteComprador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compradoresApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
