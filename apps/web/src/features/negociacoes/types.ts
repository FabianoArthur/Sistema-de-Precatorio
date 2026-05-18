import type { OrigemNegociacao } from '@preca/shared';

export interface NegociacaoSummary {
  id: string;
  precatorioId: string;
  origem: OrigemNegociacao;
  valor: string;
  observacao: string | null;
  createdBy: { id: string; nome: string };
  createdAt: string;
}
