export const EstagioPrecatorio = {
  NOVOS_RECEBIMENTOS: 'NOVOS_RECEBIMENTOS',
  TRIAGEM: 'TRIAGEM',
  ENVIADO_COTACAO: 'ENVIADO_COTACAO',
  AGUARDANDO_BANCOS: 'AGUARDANDO_BANCOS',
  NEGOCIACAO_CEDENTE: 'NEGOCIACAO_CEDENTE',
  DOCUMENTACAO: 'DOCUMENTACAO',
  DILIGENCIA: 'DILIGENCIA',
  ESCRITURA_ASSINATURA: 'ESCRITURA_ASSINATURA',
  CONCLUIDO: 'CONCLUIDO',
  PERDIDOS_ARQUIVADOS: 'PERDIDOS_ARQUIVADOS',
  FOLLOW_UP: 'FOLLOW_UP',
} as const;
export type EstagioPrecatorio = (typeof EstagioPrecatorio)[keyof typeof EstagioPrecatorio];

export const ESTAGIO_LABELS: Record<EstagioPrecatorio, string> = {
  NOVOS_RECEBIMENTOS: 'Novos Recebimentos',
  TRIAGEM: 'Triagem',
  ENVIADO_COTACAO: 'Enviado para Cotação',
  AGUARDANDO_BANCOS: 'Aguardando Retorno dos Fundos e Bancos',
  NEGOCIACAO_CEDENTE: 'Negociação com o Cedente',
  DOCUMENTACAO: 'Documentação',
  DILIGENCIA: 'Diligência',
  ESCRITURA_ASSINATURA: 'Escritura/Assinatura',
  CONCLUIDO: 'Concluído',
  PERDIDOS_ARQUIVADOS: 'Perdidos/Arquivados',
  FOLLOW_UP: 'Follow-UP',
};

export const ESTAGIOS_TERMINAIS: EstagioPrecatorio[] = [
  EstagioPrecatorio.CONCLUIDO,
  EstagioPrecatorio.PERDIDOS_ARQUIVADOS,
];

export const NaturezaPrecatorio = {
  FEDERAL: 'FEDERAL',
  ESTADUAL: 'ESTADUAL',
  MUNICIPAL: 'MUNICIPAL',
} as const;
export type NaturezaPrecatorio = (typeof NaturezaPrecatorio)[keyof typeof NaturezaPrecatorio];

export const TipoPrecatorio = {
  HONORARIOS: 'HONORARIOS',
  ALIMENTAR: 'ALIMENTAR',
  COMUM: 'COMUM',
  DESAPROPRIACAO: 'DESAPROPRIACAO',
  ANISTIA_POLITICA: 'ANISTIA_POLITICA',
} as const;
export type TipoPrecatorio = (typeof TipoPrecatorio)[keyof typeof TipoPrecatorio];

export const TIPO_LABELS: Record<TipoPrecatorio, string> = {
  HONORARIOS: 'Honorários',
  ALIMENTAR: 'Alimentar',
  COMUM: 'Comum',
  DESAPROPRIACAO: 'Desapropriação',
  ANISTIA_POLITICA: 'Anistia Política',
};

export const ScorePrecatorio = {
  MEDIO: 'MEDIO',
  AA: 'AA',
  AAA: 'AAA',
  URGENTE: 'URGENTE',
} as const;
export type ScorePrecatorio = (typeof ScorePrecatorio)[keyof typeof ScorePrecatorio];

export const SCORE_LABELS: Record<ScorePrecatorio, string> = {
  MEDIO: 'Médio',
  AA: 'AA',
  AAA: 'AAA',
  URGENTE: 'URGENTE',
};

export const StatusCotacao = {
  PENDENTE: 'PENDENTE',
  RECEBIDA: 'RECEBIDA',
  RECUSADA: 'RECUSADA',
} as const;
export type StatusCotacao = (typeof StatusCotacao)[keyof typeof StatusCotacao];

export const OcrStatus = {
  NAO_PROCESSADO: 'NAO_PROCESSADO',
  PROCESSANDO: 'PROCESSANDO',
  EXTRAIDO: 'EXTRAIDO',
  FALHOU: 'FALHOU',
} as const;
export type OcrStatus = (typeof OcrStatus)[keyof typeof OcrStatus];

export const OrigemNegociacao = {
  NOSSA: 'NOSSA',
  CEDENTE: 'CEDENTE',
} as const;
export type OrigemNegociacao = (typeof OrigemNegociacao)[keyof typeof OrigemNegociacao];

export const AcaoAudit = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MUDANCA_ESTAGIO: 'MUDANCA_ESTAGIO',
} as const;
export type AcaoAudit = (typeof AcaoAudit)[keyof typeof AcaoAudit];

export const UF_BRASIL = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;
export type UF = (typeof UF_BRASIL)[number];
