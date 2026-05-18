import { z } from 'zod';
import { ScorePrecatorio, UF_BRASIL } from '../enums';

const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

export const compradorCreateSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  cnpj: z
    .string()
    .regex(cnpjRegex, 'CNPJ inválido')
    .transform((v) => v.replace(/\D/g, '')),
  celular: z.string().min(8, 'Celular obrigatório'),
  email: z.string().email('E-mail inválido'),
  aceitaFederal: z.boolean().default(false),
  ufsAceitas: z.array(z.enum(UF_BRASIL)).default([]),
  municipiosAceitos: z.array(z.string()).default([]),
  scoresAceitos: z
    .array(
      z.enum([
        ScorePrecatorio.MEDIO,
        ScorePrecatorio.AA,
        ScorePrecatorio.AAA,
        ScorePrecatorio.URGENTE,
      ]),
    )
    .default([]),
  ativo: z.boolean().default(true),
});
export type CompradorCreateInput = z.infer<typeof compradorCreateSchema>;

export const compradorUpdateSchema = compradorCreateSchema.partial();
export type CompradorUpdateInput = z.infer<typeof compradorUpdateSchema>;
