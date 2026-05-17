import type {
  EstagioPrecatorio,
  NaturezaPrecatorio,
  ScorePrecatorio,
  TipoPrecatorio,
} from '@preca/shared';
import type { Cedente } from '../cedentes/types';
import type { Parceiro } from '../parceiros/types';

export interface PrecatorioListItem {
  id: string;
  numeroPrecatorio: string | null;
  numeroProcesso: string | null;
  cedenteId: string;
  cedente: Cedente;
  escritorioAdvogado: string | null;
  devedorTipo: NaturezaPrecatorio;
  devedorUf: string | null;
  devedorMunicipio: string | null;
  tipo: TipoPrecatorio;
  valorOriginal: string;
  valorAtualizado: string | null;
  desagio: string | null;
  valorLiquido: string | null;
  score: ScorePrecatorio;
  tribunal: string | null;
  vara: string | null;
  dataExpedicao: string | null;
  dataRequisicao: string | null;
  prazoEstimado: string | null;
  parceiroId: string | null;
  parceiro: Parceiro | null;
  comissaoTotal: string | null;
  comissaoParceiro: string | null;
  estagioAtual: EstagioPrecatorio;
  estagioDesde: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricoEstagioItem {
  id: string;
  precatorioId: string;
  estagioAnterior: EstagioPrecatorio | null;
  estagioNovo: EstagioPrecatorio;
  observacao: string | null;
  user: { id: string; nome: string };
  createdAt: string;
}

export interface PrecatorioDetail extends PrecatorioListItem {
  anexos: Array<{
    id: string;
    nome: string;
    url: string;
    contentType: string;
    tamanho: number;
    createdAt: string;
  }>;
  cotacoes: Array<{
    id: string;
    compradorId: string;
    comprador: { id: string; nome: string; cnpj: string };
    status: 'PENDENTE' | 'RECEBIDA' | 'RECUSADA';
    valorBruto: string | null;
    comissao: string | null;
    observacao: string | null;
    dataEnvio: string;
    dataResposta: string | null;
  }>;
  negociacoes: Array<{
    id: string;
    origem: 'NOSSA' | 'CEDENTE';
    valor: string;
    observacao: string | null;
    createdAt: string;
  }>;
  historico: HistoricoEstagioItem[];
}
