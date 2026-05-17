import { z } from 'zod';

export const parceiroCreateSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  chavePix: z.string().min(3, 'Chave PIX obrigatória'),
});
export type ParceiroCreateInput = z.infer<typeof parceiroCreateSchema>;

export const parceiroUpdateSchema = parceiroCreateSchema.partial();
export type ParceiroUpdateInput = z.infer<typeof parceiroUpdateSchema>;
