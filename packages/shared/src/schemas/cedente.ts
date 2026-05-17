import { z } from 'zod';

export const cedenteCreateSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  documento: z.string().optional().nullable(),
  contato: z.string().optional().nullable(),
});
export type CedenteCreateInput = z.infer<typeof cedenteCreateSchema>;

export const cedenteUpdateSchema = cedenteCreateSchema.partial();
export type CedenteUpdateInput = z.infer<typeof cedenteUpdateSchema>;
