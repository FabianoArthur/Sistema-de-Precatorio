import { z } from 'zod';
import { OrigemNegociacao } from '../enums';

export const negociacaoCreateSchema = z.object({
  origem: z.enum([OrigemNegociacao.NOSSA, OrigemNegociacao.CEDENTE]),
  valor: z.number().positive('Valor deve ser positivo'),
  observacao: z.string().optional().nullable(),
});
export type NegociacaoCreateInput = z.infer<typeof negociacaoCreateSchema>;
