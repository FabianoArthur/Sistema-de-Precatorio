import type { EstagioPrecatorio } from '../enums';

export interface DashboardEstagioCard {
  estagio: EstagioPrecatorio;
  quantidade: number;
  valorTotal: number;
}

export interface DashboardAlertaSla {
  id: string;
  numeroPrecatorio: string | null;
  numeroProcesso: string | null;
  cedenteNome: string;
  estagioAtual: EstagioPrecatorio;
  estagioDesde: string;
  diasParado: number;
  valorEfetivo: number;
}

export interface DashboardKpis {
  pipelineTotal: { quantidade: number; valor: number };
  concluidosMesAtual: { quantidade: number; valor: number };
  perdidosMesAtual: { quantidade: number };
  cotacoesPendentes: number;
  anexosOcrPendentes: number;
}

export interface DashboardData {
  cards: DashboardEstagioCard[];
  alertasSla: DashboardAlertaSla[];
  kpis: DashboardKpis;
  slaConfigurado: number;
}
