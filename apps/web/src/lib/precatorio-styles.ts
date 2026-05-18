import type { EstagioPrecatorio, ScorePrecatorio } from '@preca/shared';

export const SCORE_STYLES: Record<ScorePrecatorio, string> = {
  MEDIO:
    'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  AA: 'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800',
  AAA: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-800',
  URGENTE:
    'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800',
};

export const ESTAGIO_DOT: Record<EstagioPrecatorio, string> = {
  NOVOS_RECEBIMENTOS: 'bg-slate-400',
  TRIAGEM: 'bg-sky-500',
  ENVIADO_COTACAO: 'bg-cyan-500',
  AGUARDANDO_BANCOS: 'bg-indigo-500',
  NEGOCIACAO_CEDENTE: 'bg-violet-500',
  DOCUMENTACAO: 'bg-amber-500',
  DILIGENCIA: 'bg-orange-500',
  ESCRITURA_ASSINATURA: 'bg-teal-500',
  CONCLUIDO: 'bg-emerald-500',
  PERDIDOS_ARQUIVADOS: 'bg-rose-500',
  FOLLOW_UP: 'bg-pink-500',
};
