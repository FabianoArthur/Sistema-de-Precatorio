import { z } from 'zod';

export const dadosExtraidosSchema = z.object({
  numeroPrecatorio: z.string().nullable().optional(),
  numeroProcesso: z.string().nullable().optional(),
  valorOriginal: z.number().nullable().optional(),
  valorAtualizado: z.number().nullable().optional(),
  devedor: z.string().nullable().optional(),
  tribunal: z.string().nullable().optional(),
  vara: z.string().nullable().optional(),
  dataExpedicao: z.string().nullable().optional(),
  parsedBy: z.enum(['federal', 'sp', 'rj']).nullable().optional(),
  textoBruto: z.string().nullable().optional(),
  erro: z.string().nullable().optional(),
});
export type DadosExtraidos = z.infer<typeof dadosExtraidosSchema>;

export const camposAplicaveis = [
  'numeroPrecatorio',
  'numeroProcesso',
  'valorOriginal',
  'valorAtualizado',
  'tribunal',
  'vara',
  'dataExpedicao',
] as const;
export type CampoAplicavel = (typeof camposAplicaveis)[number];

export const aplicarValorSchema = z.object({
  campo: z.enum(camposAplicaveis),
});
export type AplicarValorInput = z.infer<typeof aplicarValorSchema>;
