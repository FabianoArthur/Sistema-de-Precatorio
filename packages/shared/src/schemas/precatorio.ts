import { z } from 'zod';
import {
  EstagioPrecatorio,
  NaturezaPrecatorio,
  TipoPrecatorio,
  UF_BRASIL,
} from '../enums';

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

export const precatorioCreateSchema = z
  .object({
    numeroPrecatorio: z.string().optional().nullable(),
    numeroProcesso: z.string().optional().nullable(),
    cedenteId: z.string().uuid('Cedente obrigatório'),
    escritorioAdvogado: z.string().optional().nullable(),

    devedorTipo: z.enum(naturezaValues),
    devedorUf: z.enum(UF_BRASIL).optional().nullable(),
    devedorMunicipio: z.string().optional().nullable(),

    tipo: z.enum(tipoValues),

    valorOriginal: z.number().positive('Valor original deve ser positivo'),
    valorAtualizado: z.number().positive().optional().nullable(),
    desagio: z.number().optional().nullable(),
    valorLiquido: z.number().optional().nullable(),

    tribunal: z.string().optional().nullable(),
    vara: z.string().optional().nullable(),
    dataExpedicao: z.coerce.date().optional().nullable(),
    dataRequisicao: z.coerce.date().optional().nullable(),
    prazoEstimado: z.coerce.date().optional().nullable(),

    parceiroId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) =>
      data.devedorTipo !== NaturezaPrecatorio.ESTADUAL || !!data.devedorUf,
    {
      message: 'UF é obrigatória para precatórios estaduais',
      path: ['devedorUf'],
    },
  )
  .refine(
    (data) =>
      data.devedorTipo !== NaturezaPrecatorio.MUNICIPAL ||
      (!!data.devedorUf && !!data.devedorMunicipio),
    {
      message: 'UF e município são obrigatórios para precatórios municipais',
      path: ['devedorMunicipio'],
    },
  );
export type PrecatorioCreateInput = z.infer<typeof precatorioCreateSchema>;

export const precatorioUpdateSchema = z.object({
  numeroPrecatorio: z.string().optional().nullable(),
  numeroProcesso: z.string().optional().nullable(),
  cedenteId: z.string().uuid().optional(),
  escritorioAdvogado: z.string().optional().nullable(),
  devedorTipo: z.enum(naturezaValues).optional(),
  devedorUf: z.enum(UF_BRASIL).optional().nullable(),
  devedorMunicipio: z.string().optional().nullable(),
  tipo: z.enum(tipoValues).optional(),
  valorOriginal: z.number().positive().optional(),
  valorAtualizado: z.number().positive().optional().nullable(),
  desagio: z.number().optional().nullable(),
  valorLiquido: z.number().optional().nullable(),
  tribunal: z.string().optional().nullable(),
  vara: z.string().optional().nullable(),
  dataExpedicao: z.coerce.date().optional().nullable(),
  dataRequisicao: z.coerce.date().optional().nullable(),
  prazoEstimado: z.coerce.date().optional().nullable(),
  parceiroId: z.string().uuid().optional().nullable(),
  comissaoTotal: z.number().nonnegative().optional().nullable(),
  comissaoParceiro: z.number().nonnegative().optional().nullable(),
});
export type PrecatorioUpdateInput = z.infer<typeof precatorioUpdateSchema>;

export const mudarEstagioSchema = z.object({
  novoEstagio: z.enum(estagioValues),
  observacao: z.string().optional().nullable(),
});
export type MudarEstagioInput = z.infer<typeof mudarEstagioSchema>;
