import type { ScorePrecatorio } from '@preca/shared';

export interface Comprador {
  id: string;
  nome: string;
  cnpj: string;
  celular: string;
  email: string;
  aceitaFederal: boolean;
  ufsAceitas: string[];
  municipiosAceitos: string[];
  scoresAceitos: ScorePrecatorio[];
  createdAt: string;
  updatedAt: string;
}
