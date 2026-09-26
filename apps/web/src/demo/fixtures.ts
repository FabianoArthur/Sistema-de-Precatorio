import {
  type DadosExtraidos,
  EstagioPrecatorio,
  type NaturezaPrecatorio,
  type OcrStatus,
  type OrigemNegociacao,
  type ScorePrecatorio,
  type StatusCotacao,
  type TipoNotificacao,
  type TipoPrecatorio,
  calcularScore,
} from '@preca/shared';
import { DEMO_CREDENCIAIS } from '../lib/demo-mode';

// Tudo aqui é FICTÍCIO: pessoas, empresas, CNPJs, números de processo e valores foram
// inventados para a demo. CNPJs usam a raiz 00.000.0xx e processos usam a unidade de
// origem 0000 com dígito 00 — combinações que não existem no mundo real.

export interface DemoUser {
  id: string;
  email: string;
  nome: string;
}

export interface DemoCedente {
  id: string;
  nome: string;
  documento: string | null;
  contato: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoParceiro {
  id: string;
  nome: string;
  chavePix: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoComprador {
  id: string;
  nome: string;
  cnpj: string;
  celular: string;
  email: string;
  aceitaFederal: boolean;
  ufsAceitas: string[];
  municipiosAceitos: string[];
  scoresAceitos: ScorePrecatorio[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPrecatorio {
  id: string;
  numeroPrecatorio: string | null;
  numeroProcesso: string | null;
  cedenteId: string;
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
  comissaoTotal: string | null;
  comissaoParceiro: string | null;
  estagioAtual: EstagioPrecatorio;
  estagioDesde: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoCotacao {
  id: string;
  precatorioId: string;
  compradorId: string;
  status: StatusCotacao;
  valorBruto: string | null;
  comissao: string | null;
  observacao: string | null;
  dataEnvio: string;
  dataResposta: string | null;
}

export interface DemoNegociacao {
  id: string;
  precatorioId: string;
  origem: OrigemNegociacao;
  valor: string;
  observacao: string | null;
  createdById: string;
  createdAt: string;
}

export interface DemoHistorico {
  id: string;
  precatorioId: string;
  estagioAnterior: EstagioPrecatorio | null;
  estagioNovo: EstagioPrecatorio;
  observacao: string | null;
  userId: string;
  createdAt: string;
}

export interface DemoAnexo {
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

export interface DemoNotificacao {
  id: string;
  tipo: TipoNotificacao;
  mensagem: string;
  link: string | null;
  lida: boolean;
  userId: string;
  createdAt: string;
}

export interface DemoState {
  users: DemoUser[];
  cedentes: DemoCedente[];
  parceiros: DemoParceiro[];
  compradores: DemoComprador[];
  precatorios: DemoPrecatorio[];
  cotacoes: DemoCotacao[];
  negociacoes: DemoNegociacao[];
  historico: DemoHistorico[];
  anexos: DemoAnexo[];
  notificacoes: DemoNotificacao[];
}

/** UUID v4 determinístico: os formulários validam ids com z.string().uuid(). */
function uid(grupo: number, n: number): string {
  return `00000000-0000-4000-8${String(grupo).padStart(3, '0')}-${String(n).padStart(12, '0')}`;
}

const ORDEM_LINEAR: EstagioPrecatorio[] = [
  EstagioPrecatorio.NOVOS_RECEBIMENTOS,
  EstagioPrecatorio.TRIAGEM,
  EstagioPrecatorio.ENVIADO_COTACAO,
  EstagioPrecatorio.AGUARDANDO_BANCOS,
  EstagioPrecatorio.NEGOCIACAO_CEDENTE,
  EstagioPrecatorio.DOCUMENTACAO,
  EstagioPrecatorio.DILIGENCIA,
  EstagioPrecatorio.ESCRITURA_ASSINATURA,
  EstagioPrecatorio.CONCLUIDO,
];

function caminhoAte(estagio: EstagioPrecatorio): EstagioPrecatorio[] {
  const i = ORDEM_LINEAR.indexOf(estagio);
  if (i >= 0) return ORDEM_LINEAR.slice(0, i + 1);
  // FOLLOW_UP e PERDIDOS saem da triagem
  return [EstagioPrecatorio.NOVOS_RECEBIMENTOS, EstagioPrecatorio.TRIAGEM, estagio];
}

interface SementePrecatorio {
  estagio: EstagioPrecatorio;
  diasNoEstagio: number;
  diasDeVida: number;
  devedorTipo: NaturezaPrecatorio;
  devedorUf?: string;
  devedorMunicipio?: string;
  tipo: TipoPrecatorio;
  valorOriginal: number;
  valorAtualizado?: number;
  tribunal: string;
  vara?: string;
  cedente: number;
  parceiro?: number;
}

const SEMENTES: SementePrecatorio[] = [
  {
    estagio: 'NOVOS_RECEBIMENTOS',
    diasNoEstagio: 1,
    diasDeVida: 1,
    devedorTipo: 'FEDERAL',
    tipo: 'ALIMENTAR',
    valorOriginal: 165_000,
    valorAtualizado: 182_340.55,
    tribunal: 'TRF 3ª Região',
    cedente: 1,
  },
  {
    estagio: 'TRIAGEM',
    diasNoEstagio: 3,
    diasDeVida: 5,
    devedorTipo: 'ESTADUAL',
    devedorUf: 'SP',
    tipo: 'COMUM',
    valorOriginal: 1_120_000,
    valorAtualizado: 1_348_900,
    tribunal: 'TJSP',
    vara: '4ª Vara da Fazenda Pública',
    cedente: 2,
    parceiro: 1,
  },
  {
    estagio: 'TRIAGEM',
    diasNoEstagio: 12,
    diasDeVida: 16,
    devedorTipo: 'MUNICIPAL',
    devedorUf: 'SP',
    devedorMunicipio: 'Campinas',
    tipo: 'HONORARIOS',
    valorOriginal: 85_400,
    tribunal: 'TJSP',
    cedente: 3,
  },
  {
    estagio: 'ENVIADO_COTACAO',
    diasNoEstagio: 4,
    diasDeVida: 11,
    devedorTipo: 'FEDERAL',
    tipo: 'COMUM',
    valorOriginal: 5_400_000,
    valorAtualizado: 6_215_000,
    tribunal: 'TRF 1ª Região',
    vara: '2ª Vara Federal Cível',
    cedente: 4,
  },
  {
    estagio: 'AGUARDANDO_BANCOS',
    diasNoEstagio: 9,
    diasDeVida: 21,
    devedorTipo: 'ESTADUAL',
    devedorUf: 'RJ',
    tipo: 'ALIMENTAR',
    valorOriginal: 690_000,
    valorAtualizado: 741_220.1,
    tribunal: 'TJRJ',
    cedente: 5,
    parceiro: 2,
  },
  {
    estagio: 'NEGOCIACAO_CEDENTE',
    diasNoEstagio: 5,
    diasDeVida: 27,
    devedorTipo: 'FEDERAL',
    tipo: 'ALIMENTAR',
    valorOriginal: 2_050_000,
    valorAtualizado: 2_398_000,
    tribunal: 'TRF 3ª Região',
    vara: '1ª Vara Previdenciária',
    cedente: 6,
  },
  {
    estagio: 'DOCUMENTACAO',
    diasNoEstagio: 15,
    diasDeVida: 40,
    devedorTipo: 'MUNICIPAL',
    devedorUf: 'RJ',
    devedorMunicipio: 'Niterói',
    tipo: 'DESAPROPRIACAO',
    valorOriginal: 2_870_000,
    valorAtualizado: 3_100_000,
    tribunal: 'TJRJ',
    cedente: 7,
  },
  {
    estagio: 'DILIGENCIA',
    diasNoEstagio: 6,
    diasDeVida: 45,
    devedorTipo: 'ESTADUAL',
    devedorUf: 'SP',
    tipo: 'COMUM',
    valorOriginal: 498_000,
    valorAtualizado: 520_450,
    tribunal: 'TJSP',
    cedente: 2,
  },
  {
    estagio: 'ESCRITURA_ASSINATURA',
    diasNoEstagio: 2,
    diasDeVida: 58,
    devedorTipo: 'FEDERAL',
    tipo: 'ANISTIA_POLITICA',
    valorOriginal: 1_700_000,
    valorAtualizado: 1_912_300,
    tribunal: 'TRF 2ª Região',
    cedente: 1,
    parceiro: 1,
  },
  {
    estagio: 'CONCLUIDO',
    diasNoEstagio: 0,
    diasDeVida: 64,
    devedorTipo: 'FEDERAL',
    tipo: 'ALIMENTAR',
    valorOriginal: 388_000,
    valorAtualizado: 410_000,
    tribunal: 'TRF 3ª Região',
    cedente: 5,
  },
  {
    estagio: 'PERDIDOS_ARQUIVADOS',
    diasNoEstagio: 0,
    diasDeVida: 30,
    devedorTipo: 'MUNICIPAL',
    devedorUf: 'BA',
    devedorMunicipio: 'Salvador',
    tipo: 'COMUM',
    valorOriginal: 61_000,
    tribunal: 'TJBA',
    cedente: 3,
  },
  {
    estagio: 'FOLLOW_UP',
    diasNoEstagio: 20,
    diasDeVida: 33,
    devedorTipo: 'ESTADUAL',
    devedorUf: 'RJ',
    tipo: 'ALIMENTAR',
    valorOriginal: 255_000,
    valorAtualizado: 274_800,
    tribunal: 'TJRJ',
    cedente: 6,
  },
];

export function criarEstadoDemo(agora: Date): DemoState {
  const diasAtras = (d: number, horas = 0) =>
    new Date(agora.getTime() - (d * 24 + horas) * 3_600_000).toISOString();

  const demo: DemoUser = { id: uid(1, 1), email: DEMO_CREDENCIAIS.email, nome: 'Usuário Demo' };
  const analista: DemoUser = { id: uid(1, 2), email: 'analista@preca.example', nome: 'Analista' };

  const cedentes: DemoCedente[] = [
    ['Ana Lúcia Prado', 'ana.prado@example.com'],
    ['Construtora Exemplo Ltda.', '(11) 90000-0002'],
    ['Carlos Menezes', 'carlos.menezes@example.com'],
    ['Espólio de J. Ribeiro', '(21) 90000-0004'],
    ['Helena Duarte', 'helena.duarte@example.com'],
    ['Roberto Siqueira', '(11) 90000-0006'],
    ['Associação de Moradores (exemplo)', 'contato@example.org'],
  ].map(([nome, contato], i) => ({
    id: uid(2, i + 1),
    nome,
    documento: null,
    contato,
    createdAt: diasAtras(90 - i),
    updatedAt: diasAtras(90 - i),
  }));

  const parceiros: DemoParceiro[] = [
    { nome: 'Parceiro Alfa Consultoria', chavePix: 'alfa@example.com' },
    { nome: 'Escritório Beta (indicações)', chavePix: '+55 11 90000-0010' },
  ].map((p, i) => ({
    id: uid(3, i + 1),
    ...p,
    createdAt: diasAtras(80),
    updatedAt: diasAtras(80),
  }));

  const compradores: DemoComprador[] = (
    [
      ['Fundo Alfa (fictício)', true, [], [], [], true],
      ['Banco Beta (fictício)', true, ['SP'], [], ['AAA', 'URGENTE'], true],
      ['Gama Investimentos (fictício)', false, ['SP', 'RJ'], ['Campinas', 'Niterói'], [], true],
      ['Delta Crédito (fictício)', true, ['RJ'], [], ['AA', 'AAA'], true],
      ['Épsilon Asset (fictício)', false, [], [], ['MEDIO', 'AA'], true],
      ['Zeta Fundos (fictício)', true, [], [], [], false],
    ] as Array<[string, boolean, string[], string[], ScorePrecatorio[], boolean]>
  ).map(([nome, aceitaFederal, ufsAceitas, municipiosAceitos, scoresAceitos, ativo], i) => ({
    id: uid(4, i + 1),
    nome,
    cnpj: `000000${String(i + 1).padStart(2, '0')}000100`,
    celular: `1190000002${i}`,
    email: `mesa${i + 1}@example.com`,
    aceitaFederal,
    ufsAceitas,
    municipiosAceitos,
    scoresAceitos,
    ativo,
    createdAt: diasAtras(100),
    updatedAt: diasAtras(100),
  }));

  const precatorios: DemoPrecatorio[] = [];
  const historico: DemoHistorico[] = [];

  SEMENTES.forEach((s, i) => {
    const n = i + 1;
    const id = uid(5, n);
    const criadoEm = diasAtras(s.diasDeVida, 3);
    const estagioDesde = diasAtras(s.diasNoEstagio, 1);
    const efetivo = s.valorAtualizado ?? s.valorOriginal;
    const uf = s.devedorUf ?? null;
    const ano = 2021 + (i % 4);
    precatorios.push({
      id,
      numeroPrecatorio: `${ano}.00.${String(n).padStart(6, '0')}-0`,
      numeroProcesso: `0000${String(100 + n).padStart(3, '0')}-00.${ano}.${s.devedorTipo === 'FEDERAL' ? '4.03' : '8.26'}.0000`,
      cedenteId: cedentes[s.cedente - 1].id,
      escritorioAdvogado: i % 3 === 0 ? 'Advocacia Exemplo & Associados' : null,
      devedorTipo: s.devedorTipo,
      devedorUf: uf,
      devedorMunicipio: s.devedorMunicipio ?? null,
      tipo: s.tipo,
      valorOriginal: String(s.valorOriginal),
      valorAtualizado: s.valorAtualizado !== undefined ? String(s.valorAtualizado) : null,
      desagio: null,
      valorLiquido: null,
      score: calcularScore(efetivo),
      tribunal: s.tribunal,
      vara: s.vara ?? null,
      dataExpedicao: diasAtras(400 + n * 20),
      dataRequisicao: null,
      prazoEstimado: null,
      parceiroId: s.parceiro ? parceiros[s.parceiro - 1].id : null,
      comissaoTotal: null,
      comissaoParceiro: null,
      estagioAtual: s.estagio,
      estagioDesde,
      createdAt: criadoEm,
      updatedAt: estagioDesde,
    });

    const caminho = caminhoAte(s.estagio);
    const inicio = new Date(criadoEm).getTime();
    const fim = new Date(estagioDesde).getTime();
    caminho.forEach((estagio, k) => {
      const t =
        caminho.length === 1 ? inicio : inicio + ((fim - inicio) * k) / (caminho.length - 1);
      historico.push({
        id: uid(6, n * 20 + k),
        precatorioId: id,
        estagioAnterior: k === 0 ? null : caminho[k - 1],
        estagioNovo: estagio,
        observacao:
          k === 0
            ? null
            : estagio === 'ENVIADO_COTACAO'
              ? 'Avanço automático ao solicitar cotações'
              : null,
        userId: k % 2 === 0 ? demo.id : analista.id,
        createdAt: new Date(t).toISOString(),
      });
    });
  });

  const p = (n: number) => precatorios[n - 1];
  const c = (n: number) => compradores[n - 1];
  let seqCotacao = 0;
  const cotacao = (
    pn: number,
    cn: number,
    status: StatusCotacao,
    valorBruto?: number,
    comissao?: number,
    observacao?: string,
  ): DemoCotacao => ({
    id: uid(7, ++seqCotacao),
    precatorioId: p(pn).id,
    compradorId: c(cn).id,
    status,
    valorBruto: valorBruto !== undefined ? String(valorBruto) : null,
    comissao: comissao !== undefined ? String(comissao) : null,
    observacao: observacao ?? null,
    dataEnvio: diasAtras(9),
    dataResposta: status === 'PENDENTE' ? null : diasAtras(3),
  });

  const cotacoes: DemoCotacao[] = [
    cotacao(4, 1, 'PENDENTE'),
    cotacao(4, 2, 'PENDENTE'),
    cotacao(5, 1, 'RECEBIDA', 520_000, 15_600, 'Pagamento em até 30 dias após escritura.'),
    cotacao(5, 4, 'PENDENTE'),
    cotacao(5, 5, 'RECUSADA', undefined, undefined, 'Fora da política para alimentar estadual.'),
    cotacao(6, 1, 'RECEBIDA', 1_560_000, 46_800),
    cotacao(6, 2, 'RECEBIDA', 1_610_000, 48_300, 'Validade da proposta: 10 dias.'),
    cotacao(6, 4, 'RECEBIDA', 1_498_000, 44_940),
  ];

  const negociacoes: DemoNegociacao[] = [
    {
      origem: 'NOSSA',
      valor: 1_450_000,
      obs: 'Primeira proposta ao cedente.',
      dias: 5,
      user: demo,
    },
    {
      origem: 'CEDENTE',
      valor: 1_620_000,
      obs: 'Cedente pediu mais 10%.',
      dias: 4,
      user: analista,
    },
    {
      origem: 'NOSSA',
      valor: 1_530_000,
      obs: 'Contraproposta com pagamento à vista.',
      dias: 2,
      user: demo,
    },
  ].map((x, i) => ({
    id: uid(8, i + 1),
    precatorioId: p(6).id,
    origem: x.origem as OrigemNegociacao,
    valor: String(x.valor),
    observacao: x.obs,
    createdById: x.user.id,
    createdAt: diasAtras(x.dias),
  }));

  const anexos: DemoAnexo[] = [
    {
      id: uid(9, 1),
      precatorioId: p(7).id,
      nome: 'oficio-requisitorio-tjrj.pdf',
      url: 'demo/oficio-requisitorio-tjrj.pdf',
      contentType: 'application/pdf',
      tamanho: 184_320,
      ocrStatus: 'EXTRAIDO',
      dadosExtraidos: {
        numeroPrecatorio: p(7).numeroPrecatorio,
        numeroProcesso: p(7).numeroProcesso,
        valorOriginal: 2_870_000,
        valorAtualizado: 3_245_870.12,
        devedor: 'Município de Niterói',
        tribunal: 'TJRJ',
        vara: '3ª Vara de Fazenda Pública',
        dataExpedicao: p(7).dataExpedicao?.slice(0, 10) ?? null,
        parsedBy: 'rj',
      },
      createdAt: diasAtras(14),
      createdById: analista.id,
    },
    {
      id: uid(9, 2),
      precatorioId: p(7).id,
      nome: 'certidao-digitalizada.pdf',
      url: 'demo/certidao-digitalizada.pdf',
      contentType: 'application/pdf',
      tamanho: 902_144,
      ocrStatus: 'FALHOU',
      dadosExtraidos: { erro: 'PDF não reconhecido como TRF, TJSP ou TJRJ.', parsedBy: null },
      createdAt: diasAtras(13),
      createdById: demo.id,
    },
    {
      id: uid(9, 3),
      precatorioId: p(4).id,
      nome: 'oficio-trf1.pdf',
      url: 'demo/oficio-trf1.pdf',
      contentType: 'application/pdf',
      tamanho: 256_000,
      ocrStatus: 'EXTRAIDO',
      dadosExtraidos: {
        numeroPrecatorio: p(4).numeroPrecatorio,
        numeroProcesso: p(4).numeroProcesso,
        valorOriginal: 5_400_000,
        valorAtualizado: 6_215_000,
        devedor: 'União Federal',
        tribunal: 'TRF 1ª Região',
        vara: '2ª Vara Federal Cível',
        dataExpedicao: p(4).dataExpedicao?.slice(0, 10) ?? null,
        parsedBy: 'federal',
      },
      createdAt: diasAtras(10),
      createdById: demo.id,
    },
  ];

  const notificacoes: DemoNotificacao[] = (
    [
      ['COTACAO_RESPONDIDA', `${c(2).nome} respondeu R$ 1.610.000.`, 6, false, 1],
      ['NEGOCIACAO_NOVA', 'Cedente pediu mais 10% na negociação.', 6, false, 4],
      [
        'SLA_ESTOURADO',
        `Precatório ${p(7).numeroPrecatorio} parado há 15 dias em Documentação.`,
        7,
        false,
        20,
      ],
      [
        'ANEXO_OCR_EXTRAIDO',
        'OCR extraiu 7 campos de oficio-requisitorio-tjrj.pdf.',
        7,
        true,
        14 * 24,
      ],
      ['COTACAO_RECUSADA', `${c(5).nome} recusou cotação.`, 5, true, 3 * 24],
    ] as Array<[TipoNotificacao, string, number, boolean, number]>
  ).map(([tipo, mensagem, pn, lida, horas], i) => ({
    id: uid(10, i + 1),
    tipo,
    mensagem,
    link: `/precatorios/${p(pn).id}`,
    lida,
    userId: demo.id,
    createdAt: diasAtras(0, horas),
  }));

  return {
    users: [demo, analista],
    cedentes,
    parceiros,
    compradores,
    precatorios,
    cotacoes,
    negociacoes,
    historico,
    anexos,
    notificacoes,
  };
}
