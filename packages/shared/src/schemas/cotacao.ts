import { z } from 'zod';

export const cotacaoEnviarSchema = z.object({
  precatorioId: z.string().uuid(),
  compradorIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos um comprador'),
});
export type CotacaoEnviarInput = z.infer<typeof cotacaoEnviarSchema>;

export const cotacaoResponderSchema = z.object({
  valorBruto: z.number().positive('Valor bruto deve ser positivo'),
  comissao: z.number().nonnegative().default(0),
  observacao: z.string().optional().nullable(),
});
export type CotacaoResponderInput = z.infer<typeof cotacaoResponderSchema>;

export const cotacaoRecusarSchema = z.object({
  observacao: z.string().optional().nullable(),
});
export type CotacaoRecusarInput = z.infer<typeof cotacaoRecusarSchema>;
