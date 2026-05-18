import { z } from 'zod';

export const TipoNotificacao = {
  MUDANCA_ESTAGIO: 'MUDANCA_ESTAGIO',
  COTACAO_RESPONDIDA: 'COTACAO_RESPONDIDA',
  COTACAO_RECUSADA: 'COTACAO_RECUSADA',
  NEGOCIACAO_NOVA: 'NEGOCIACAO_NOVA',
  ANEXO_OCR_EXTRAIDO: 'ANEXO_OCR_EXTRAIDO',
  ANEXO_OCR_FALHOU: 'ANEXO_OCR_FALHOU',
  SLA_ESTOURADO: 'SLA_ESTOURADO',
} as const;
export type TipoNotificacao = (typeof TipoNotificacao)[keyof typeof TipoNotificacao];

export const TIPO_NOTIFICACAO_LABELS: Record<TipoNotificacao, string> = {
  MUDANCA_ESTAGIO: 'Mudança de estágio',
  COTACAO_RESPONDIDA: 'Cotação respondida',
  COTACAO_RECUSADA: 'Cotação recusada',
  NEGOCIACAO_NOVA: 'Nova proposta',
  ANEXO_OCR_EXTRAIDO: 'OCR extraído',
  ANEXO_OCR_FALHOU: 'OCR falhou',
  SLA_ESTOURADO: 'SLA estourado',
};

export const notificacoesFiltrosSchema = z.object({
  apenasNaoLidas: z
    .union([z.boolean(), z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .pipe(z.boolean().optional()),
  limit: z
    .union([z.number(), z.string().regex(/^\d+$/)])
    .optional()
    .transform((v) => (typeof v === 'string' ? Number(v) : v))
    .pipe(z.number().int().min(1).max(100).optional()),
});
export type NotificacoesFiltros = z.infer<typeof notificacoesFiltrosSchema>;
