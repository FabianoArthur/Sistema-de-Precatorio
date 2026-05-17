import { z } from 'zod';
import { EstagioPrecatorio, NaturezaPrecatorio, ScorePrecatorio, TipoPrecatorio } from '../enums';

const estagioValues = [
  EstagioPrecatorio.NOVOS_RECEBIMENTOS,
  EstagioPrecatorio.TRIAGEM,
  EstagioPrecatorio.ENVIADO_COTACAO,
  EstagioPrecatorio.AGUARDANDO_BANCOS,
  EstagioPrecatorio.NEGOCIACAO_CEDENTE,
  EstagioPrecatorio.DOCUMENTACAO,
  EstagioPrecatorio.DILIGENCIA,
  EstagioPrecatorio.ESCRITURA_ASSINATURA,
  EstagioPrecatorio.CONCLUIDO,
  EstagioPrecatorio.PERDIDOS_ARQUIVADOS,
  EstagioPrecatorio.FOLLOW_UP,
] as const;

const naturezaValues = [
  NaturezaPrecatorio.FEDERAL,
  NaturezaPrecatorio.ESTADUAL,
  NaturezaPrecatorio.MUNICIPAL,
] as const;

const tipoValues = [
  TipoPrecatorio.HONORARIOS,
  TipoPrecatorio.ALIMENTAR,
  TipoPrecatorio.COMUM,
  TipoPrecatorio.DESAPROPRIACAO,
  TipoPrecatorio.ANISTIA_POLITICA,
] as const;

const scoreValues = [
  ScorePrecatorio.MEDIO,
  ScorePrecatorio.AA,
  ScorePrecatorio.AAA,
  ScorePrecatorio.URGENTE,
] as const;

export const precatorioFiltersSchema = z.object({
  estagioAtual: z.enum(estagioValues).optional(),
  devedorTipo: z.enum(naturezaValues).optional(),
  tipo: z.enum(tipoValues).optional(),
  score: z.enum(scoreValues).optional(),
  search: z.string().trim().min(1).optional(),
});
export type PrecatorioFilters = z.infer<typeof precatorioFiltersSchema>;
