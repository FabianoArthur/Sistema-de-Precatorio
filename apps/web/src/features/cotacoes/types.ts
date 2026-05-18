import type { MotivoBloqueio, MotivoMatch, StatusCotacao } from '@preca/shared';
import type { Comprador } from '../compradores/types';

export interface CotacaoSummary {
  id: string;
  precatorioId: string;
  compradorId: string;
  comprador: Pick<Comprador, 'id' | 'nome' | 'cnpj'>;
  status: StatusCotacao;
  valorBruto: string | null;
  comissao: string | null;
  observacao: string | null;
  dataEnvio: string;
  dataResposta: string | null;
}

export interface CompradorSugerido {
  comprador: Comprador;
  pontuacao: number;
  motivos: MotivoMatch[];
}

export interface CompradorBloqueado {
  comprador: Comprador;
  bloqueios: MotivoBloqueio[];
}

export interface CompradoresSugeridosResponse {
  sugeridos: CompradorSugerido[];
  outros: CompradorBloqueado[];
}

export interface EnviarCotacoesResult {
  criadas: number;
  duplicadas: number;
  cotacoes: CotacaoSummary[];
}
