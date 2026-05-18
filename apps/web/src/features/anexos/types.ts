import type { DadosExtraidos, OcrStatus } from '@preca/shared';

export interface AnexoSummary {
  id: string;
  precatorioId: string;
  nome: string;
  url: string;
  contentType: string;
  tamanho: number;
  ocrStatus: OcrStatus;
  dadosExtraidos: DadosExtraidos | null;
  createdAt: string;
  createdById: string;
}
