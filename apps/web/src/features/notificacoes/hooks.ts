import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacoesApi } from './api';

const POLL_MS = 30_000;

export function useNotificacoes() {
  return useQuery({
    queryKey: ['notificacoes', 'lista'],
    queryFn: () => notificacoesApi.list(false, 20),
    refetchInterval: POLL_MS,
  });
}

export function useContarNaoLidas() {
  return useQuery({
    queryKey: ['notificacoes', 'count'],
    queryFn: () => notificacoesApi.contar(),
    refetchInterval: POLL_MS,
    select: (d) => d.count,
  });
}

export function useMarcarLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificacoesApi.marcarLida(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });
}

export function useMarcarTodasLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificacoesApi.marcarTodasLidas(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });
}

export function useRemoverNotificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificacoesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });
}
