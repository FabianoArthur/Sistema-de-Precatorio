import { z } from 'zod';

export const cotacaoEnviarSchema = z.object({
  compradorIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos um comprador'),
});
export type CotacaoEnviarInput = z.infer<typeof cotacaoEnviarSchema>;

export const MOTIVO_TIPO = {
  SCORE_ACEITO: 'SCORE_ACEITO',
  SCORE_QUALQUER: 'SCORE_QUALQUER',
  FEDERAL_OK: 'FEDERAL_OK',
  UF_ACEITA: 'UF_ACEITA',
  UF_QUALQUER: 'UF_QUALQUER',
  MUNICIPIO_ACEITO: 'MUNICIPIO_ACEITO',
  MUNICIPIO_QUALQUER: 'MUNICIPIO_QUALQUER',
} as const;
export type MotivoTipo = (typeof MOTIVO_TIPO)[keyof typeof MOTIVO_TIPO];

export const BLOQUEIO_TIPO = {
  SCORE_NAO_ACEITO: 'SCORE_NAO_ACEITO',
  FEDERAL_NAO_ACEITO: 'FEDERAL_NAO_ACEITO',
  UF_NAO_ACEITA: 'UF_NAO_ACEITA',
  MUNICIPIO_NAO_ACEITO: 'MUNICIPIO_NAO_ACEITO',
} as const;
export type BloqueioTipo = (typeof BLOQUEIO_TIPO)[keyof typeof BLOQUEIO_TIPO];

export interface MotivoMatch {
  tipo: MotivoTipo;
  label: string;
  detalhe?: string;
}

export interface MotivoBloqueio {
  tipo: BloqueioTipo;
  label: string;
  detalhe?: string;
}

export interface MatchInfo {
  pontuacao: number;
  motivos: MotivoMatch[];
}

export const cotacaoResponderSchema = z
  .object({
    valorBruto: z.number().positive('Valor bruto deve ser positivo'),
    comissao: z.number().nonnegative().default(0),
    observacao: z.string().optional().nullable(),
  })
  .refine((data) => data.comissao <= data.valorBruto, {
    message: 'Comissão não pode ser maior que o valor bruto.',
    path: ['comissao'],
  });
export type CotacaoResponderInput = z.infer<typeof cotacaoResponderSchema>;

export const cotacaoRecusarSchema = z.object({
  observacao: z.string().optional().nullable(),
});
export type CotacaoRecusarInput = z.infer<typeof cotacaoRecusarSchema>;
