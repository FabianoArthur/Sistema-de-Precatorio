import {
  type CampoAplicavel,
  type DashboardData,
  ESTAGIOS_TERMINAIS,
  ESTAGIO_LABELS,
  type EstagioPrecatorio as Estagio,
  EstagioPrecatorio,
  type TipoNotificacao,
  aplicarValorSchema,
  avaliarMatch,
  calcularScore,
  cedenteCreateSchema,
  cedenteUpdateSchema,
  compradorCreateSchema,
  compradorUpdateSchema,
  cotacaoEnviarSchema,
  cotacaoRecusarSchema,
  cotacaoResponderSchema,
  loginSchema,
  mudarEstagioSchema,
  negociacaoCreateSchema,
  parceiroCreateSchema,
  parceiroUpdateSchema,
  precatorioCreateSchema,
  precatorioFiltersSchema,
  precatorioUpdateSchema,
} from '@preca/shared';
import type { ZodType, ZodTypeDef } from 'zod';
import { type DemoCotacao, type DemoPrecatorio, type DemoState, criarEstadoDemo } from './fixtures';

// Um "backend" em memória que responde às mesmas rotas da API NestJS, para a demo
// estática (GitHub Pages) funcionar sem servidor. As regras de domínio que importam
// (score, match de compradores, avanço automático de estágio, SLA) vêm do mesmo código
// que a API usa ou replicam o service correspondente; o resto é CRUD simples.

export interface DemoRequest {
  method: string;
  url: string;
  data?: unknown;
}

export interface DemoResponse {
  status: number;
  data: unknown;
}

export interface DemoBackend {
  handle(req: DemoRequest): DemoResponse;
}

const SLA_DIAS = 7;
const DIA_MS = 86_400_000;
const NAO_TERMINAIS = (Object.values(EstagioPrecatorio) as Estagio[]).filter(
  (e) => !ESTAGIOS_TERMINAIS.includes(e),
);
const ESTAGIOS_ANTES_COTACAO: Estagio[] = [
  EstagioPrecatorio.NOVOS_RECEBIMENTOS,
  EstagioPrecatorio.TRIAGEM,
];

class HttpErro extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const naoEncontrado = (o: string) => new HttpErro(404, `${o} não encontrado`);

function validar<T>(schema: ZodType<T, ZodTypeDef, unknown>, body: unknown): T {
  const r = schema.safeParse(body ?? {});
  if (!r.success) throw new HttpErro(400, r.error.issues[0]?.message ?? 'Dados inválidos');
  return r.data;
}

const dec = (v: number | null | undefined) => (v === null || v === undefined ? null : String(v));
const iso = (v: Date | string | null | undefined) =>
  v === null || v === undefined ? null : new Date(v).toISOString();

type Rota = [
  method: string,
  padrao: RegExp,
  handler: (m: string[], body: unknown, q: URLSearchParams) => unknown,
];

export function createDemoBackend(agoraFixo?: Date): DemoBackend {
  const agora = () => agoraFixo ?? new Date();
  const db: DemoState = criarEstadoDemo(agora());
  const eu = db.users[0];
  let seq = 0;
  const novoId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `00000000-0000-4000-9000-${String(++seq).padStart(12, '0')}`;
  const agoraIso = () => agora().toISOString();

  // ---------- leitura com joins ----------

  const achar = <T extends { id: string }>(lista: T[], id: string, oQue: string) => {
    const x = lista.find((i) => i.id === id);
    if (!x) throw naoEncontrado(oQue);
    return x;
  };

  const comJoins = (p: DemoPrecatorio) => ({
    ...p,
    cedente: db.cedentes.find((c) => c.id === p.cedenteId) ?? null,
    parceiro: db.parceiros.find((x) => x.id === p.parceiroId) ?? null,
  });

  const cotacaoView = (c: DemoCotacao) => ({
    ...c,
    comprador: db.compradores.find((x) => x.id === c.compradorId),
  });

  const userView = (id: string) => {
    const u = db.users.find((x) => x.id === id) ?? eu;
    return { id: u.id, nome: u.nome };
  };

  const desc = <T>(lista: T[], campo: (x: T) => string) =>
    [...lista].sort((a, b) => campo(b).localeCompare(campo(a)));

  function detalhe(id: string) {
    const p = achar(db.precatorios, id, 'Precatório');
    const cotacoes = db.cotacoes
      .filter((c) => c.precatorioId === id)
      // Postgres ordena DESC com NULLs primeiro — a API se comporta assim
      .sort((a, b) => {
        if (a.valorBruto === null) return b.valorBruto === null ? 0 : -1;
        if (b.valorBruto === null) return 1;
        return Number(b.valorBruto) - Number(a.valorBruto);
      })
      .map(cotacaoView);
    return {
      ...comJoins(p),
      anexos: desc(
        db.anexos.filter((a) => a.precatorioId === id),
        (a) => a.createdAt,
      ),
      cotacoes,
      negociacoes: desc(
        db.negociacoes.filter((n) => n.precatorioId === id),
        (n) => n.createdAt,
      ).map(({ createdById, ...n }) => ({ ...n, createdBy: userView(createdById) })),
      historico: desc(
        db.historico.filter((h) => h.precatorioId === id),
        (h) => h.createdAt,
      ).map(({ userId, ...h }) => ({ ...h, user: userView(userId) })),
    };
  }

  // ---------- efeitos colaterais que a API faz na mesma transação ----------

  function notificar(tipo: TipoNotificacao, mensagem: string, link: string) {
    // Na API a notificação vai para os OUTROS usuários. Na demo só existe você, então
    // ela chega para você — do contrário o sino nunca mudaria.
    db.notificacoes.push({
      id: novoId(),
      tipo,
      mensagem,
      link,
      lida: false,
      userId: eu.id,
      createdAt: agoraIso(),
    });
  }

  function registrarEstagio(p: DemoPrecatorio, novo: Estagio, observacao: string | null) {
    db.historico.push({
      id: novoId(),
      precatorioId: p.id,
      estagioAnterior: p.estagioAtual,
      estagioNovo: novo,
      observacao,
      userId: eu.id,
      createdAt: agoraIso(),
    });
    p.estagioAtual = novo;
    p.estagioDesde = agoraIso();
    p.updatedAt = agoraIso();
  }

  // ---------- dashboard (espelha DashboardService) ----------

  function dashboard(): DashboardData {
    const efetivo = (p: DemoPrecatorio) => Number(p.valorAtualizado ?? p.valorOriginal);
    const soma = (l: DemoPrecatorio[]) => l.reduce((t, p) => t + efetivo(p), 0);
    const hoje = agora();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).getTime();
    const corte = hoje.getTime() - SLA_DIAS * DIA_MS;
    const ativos = db.precatorios.filter((p) => NAO_TERMINAIS.includes(p.estagioAtual));
    const doMes = (e: Estagio) =>
      db.precatorios.filter(
        (p) => p.estagioAtual === e && new Date(p.updatedAt).getTime() >= inicioMes,
      );
    const concluidos = doMes(EstagioPrecatorio.CONCLUIDO);

    return {
      cards: (Object.values(EstagioPrecatorio) as Estagio[]).map((estagio) => {
        const l = db.precatorios.filter((p) => p.estagioAtual === estagio);
        return { estagio, quantidade: l.length, valorTotal: soma(l) };
      }),
      alertasSla: ativos
        .filter((p) => new Date(p.estagioDesde).getTime() <= corte)
        .sort((a, b) => a.estagioDesde.localeCompare(b.estagioDesde))
        .slice(0, 50)
        .map((p) => ({
          id: p.id,
          numeroPrecatorio: p.numeroPrecatorio,
          numeroProcesso: p.numeroProcesso,
          cedenteNome: db.cedentes.find((c) => c.id === p.cedenteId)?.nome ?? '—',
          estagioAtual: p.estagioAtual,
          estagioDesde: p.estagioDesde,
          diasParado: Math.floor((hoje.getTime() - new Date(p.estagioDesde).getTime()) / DIA_MS),
          valorEfetivo: efetivo(p),
        })),
      kpis: {
        pipelineTotal: { quantidade: ativos.length, valor: soma(ativos) },
        concluidosMesAtual: { quantidade: concluidos.length, valor: soma(concluidos) },
        perdidosMesAtual: { quantidade: doMes(EstagioPrecatorio.PERDIDOS_ARQUIVADOS).length },
        cotacoesPendentes: db.cotacoes.filter((c) => c.status === 'PENDENTE').length,
        anexosOcrPendentes: db.anexos.filter(
          (a) => a.ocrStatus === 'PROCESSANDO' || a.ocrStatus === 'NAO_PROCESSADO',
        ).length,
      },
      slaConfigurado: SLA_DIAS,
    };
  }

  // ---------- CRUD genérico dos cadastros ----------

  function crud<T extends { id: string; createdAt: string; updatedAt: string }>(
    base: string,
    lista: () => T[],
    oQue: string,
    schemas: {
      criar: ZodType<unknown, ZodTypeDef, unknown>;
      editar: ZodType<unknown, ZodTypeDef, unknown>;
    },
    opts: {
      unico?: keyof T;
      antesDeApagar?: (id: string) => void;
      ordenar?: (a: T, b: T) => number;
    },
  ): Rota[] {
    const conflito = (dados: Partial<T>, ignorarId?: string) => {
      const campo = opts.unico;
      if (!campo || dados[campo] === undefined) return;
      if (lista().some((x) => x[campo] === dados[campo] && x.id !== ignorarId)) {
        throw new HttpErro(409, `${String(campo).toUpperCase()} já cadastrado`);
      }
    };
    return [
      ['get', new RegExp(`^/${base}$`), () => [...lista()].sort(opts.ordenar)],
      ['get', new RegExp(`^/${base}/([^/]+)$`), ([id]) => achar(lista(), id, oQue)],
      [
        'post',
        new RegExp(`^/${base}$`),
        (_, body) => {
          const dados = validar(schemas.criar, body) as Partial<T>;
          conflito(dados);
          const novo = {
            ...dados,
            id: novoId(),
            createdAt: agoraIso(),
            updatedAt: agoraIso(),
          } as T;
          lista().push(novo);
          return novo;
        },
      ],
      [
        'patch',
        new RegExp(`^/${base}/([^/]+)$`),
        ([id], body) => {
          const alvo = achar(lista(), id, oQue);
          const dados = validar(schemas.editar, body) as Partial<T>;
          conflito(dados, id);
          Object.assign(alvo, dados, { updatedAt: agoraIso() });
          return alvo;
        },
      ],
      [
        'delete',
        new RegExp(`^/${base}/([^/]+)$`),
        ([id]) => {
          achar(lista(), id, oQue);
          opts.antesDeApagar?.(id);
          lista().splice(
            lista().findIndex((x) => x.id === id),
            1,
          );
          return undefined;
        },
      ],
    ];
  }

  const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome);

  // ---------- rotas ----------

  const rotas: Rota[] = [
    [
      'post',
      /^\/auth\/login$/,
      (_, body) => {
        validar(loginSchema, body);
        return { accessToken: 'demo-token', user: { id: eu.id, email: eu.email, nome: eu.nome } };
      },
    ],
    ['get', /^\/auth\/me$/, () => ({ id: eu.id, email: eu.email, nome: eu.nome })],
    ['get', /^\/health$/, () => ({ status: 'ok', demo: true })],
    ['get', /^\/dashboard$/, () => dashboard()],

    // precatórios
    [
      'get',
      /^\/precatorios$/,
      (_, __, q) => {
        const f = validar(precatorioFiltersSchema, Object.fromEntries(q));
        const termo = f.search?.toLowerCase();
        return desc(db.precatorios, (p) => p.createdAt)
          .filter(
            (p) =>
              (!f.estagioAtual || p.estagioAtual === f.estagioAtual) &&
              (!f.devedorTipo || p.devedorTipo === f.devedorTipo) &&
              (!f.tipo || p.tipo === f.tipo) &&
              (!f.score || p.score === f.score) &&
              (!termo ||
                p.numeroPrecatorio?.toLowerCase().includes(termo) ||
                p.numeroProcesso?.toLowerCase().includes(termo)),
          )
          .map(comJoins);
      },
    ],
    ['get', /^\/precatorios\/([^/]+)$/, ([id]) => detalhe(id)],
    [
      'post',
      /^\/precatorios$/,
      (_, body) => {
        const d = validar(precatorioCreateSchema, body);
        achar(db.cedentes, d.cedenteId, 'Cedente');
        const p: DemoPrecatorio = {
          id: novoId(),
          numeroPrecatorio: d.numeroPrecatorio ?? null,
          numeroProcesso: d.numeroProcesso ?? null,
          cedenteId: d.cedenteId,
          escritorioAdvogado: d.escritorioAdvogado ?? null,
          devedorTipo: d.devedorTipo,
          devedorUf: d.devedorUf ?? null,
          devedorMunicipio: d.devedorMunicipio ?? null,
          tipo: d.tipo,
          valorOriginal: String(d.valorOriginal),
          valorAtualizado: dec(d.valorAtualizado),
          desagio: dec(d.desagio),
          valorLiquido: dec(d.valorLiquido),
          score: calcularScore(d.valorAtualizado ?? d.valorOriginal),
          tribunal: d.tribunal ?? null,
          vara: d.vara ?? null,
          dataExpedicao: iso(d.dataExpedicao),
          dataRequisicao: iso(d.dataRequisicao),
          prazoEstimado: iso(d.prazoEstimado),
          parceiroId: d.parceiroId ?? null,
          comissaoTotal: null,
          comissaoParceiro: null,
          estagioAtual: EstagioPrecatorio.NOVOS_RECEBIMENTOS,
          estagioDesde: agoraIso(),
          createdAt: agoraIso(),
          updatedAt: agoraIso(),
        };
        db.precatorios.push(p);
        db.historico.push({
          id: novoId(),
          precatorioId: p.id,
          estagioAnterior: null,
          estagioNovo: p.estagioAtual,
          observacao: null,
          userId: eu.id,
          createdAt: agoraIso(),
        });
        return { __status: 201, body: comJoins(p) };
      },
    ],
    [
      'patch',
      /^\/precatorios\/([^/]+)\/estagio$/,
      ([id], body) => {
        const p = achar(db.precatorios, id, 'Precatório');
        const d = validar(mudarEstagioSchema, body);
        if (p.estagioAtual === d.novoEstagio) return comJoins(p);
        const antes = p.estagioAtual;
        registrarEstagio(p, d.novoEstagio, d.observacao ?? null);
        notificar(
          'MUDANCA_ESTAGIO',
          `Precatório ${p.numeroPrecatorio ?? p.numeroProcesso ?? '(sem nº)'}: ${ESTAGIO_LABELS[antes]} → ${ESTAGIO_LABELS[d.novoEstagio]}.`,
          `/precatorios/${id}`,
        );
        return comJoins(p);
      },
    ],
    [
      'patch',
      /^\/precatorios\/([^/]+)$/,
      ([id], body) => {
        const p = achar(db.precatorios, id, 'Precatório');
        const d = validar(precatorioUpdateSchema, body);
        const {
          valorOriginal,
          valorAtualizado,
          desagio,
          valorLiquido,
          comissaoTotal,
          comissaoParceiro,
          dataExpedicao,
          dataRequisicao,
          prazoEstimado,
          ...texto
        } = d;
        Object.assign(
          p,
          Object.fromEntries(Object.entries(texto).filter(([, v]) => v !== undefined)),
        );
        const decimais = {
          valorOriginal,
          valorAtualizado,
          desagio,
          valorLiquido,
          comissaoTotal,
          comissaoParceiro,
        };
        for (const [k, v] of Object.entries(decimais)) {
          if (v !== undefined) (p as unknown as Record<string, unknown>)[k] = dec(v);
        }
        const datas = { dataExpedicao, dataRequisicao, prazoEstimado };
        for (const [k, v] of Object.entries(datas)) {
          if (v !== undefined) (p as unknown as Record<string, unknown>)[k] = iso(v);
        }
        if (valorOriginal !== undefined || valorAtualizado !== undefined) {
          p.score = calcularScore(Number(p.valorAtualizado ?? p.valorOriginal));
        }
        p.updatedAt = agoraIso();
        return comJoins(p);
      },
    ],
    [
      'delete',
      /^\/precatorios\/([^/]+)$/,
      ([id]) => {
        achar(db.precatorios, id, 'Precatório');
        db.precatorios = db.precatorios.filter((p) => p.id !== id);
        for (const k of ['cotacoes', 'negociacoes', 'historico', 'anexos'] as const) {
          (db[k] as Array<{ precatorioId: string }>) = (
            db[k] as Array<{ precatorioId: string }>
          ).filter((x) => x.precatorioId !== id);
        }
        return undefined;
      },
    ],

    // cotações (espelha CotacoesService)
    [
      'get',
      /^\/precatorios\/([^/]+)\/cotacoes\/sugeridos$/,
      ([id]) => {
        const p = achar(db.precatorios, id, 'Precatório');
        const jaCotados = new Set(
          db.cotacoes.filter((c) => c.precatorioId === id).map((c) => c.compradorId),
        );
        const sugeridos = [];
        const outros = [];
        for (const c of db.compradores
          .filter((x) => x.ativo && !jaCotados.has(x.id))
          .sort(porNome)) {
          const r = avaliarMatch(c, p);
          if (r.ok) sugeridos.push({ comprador: c, pontuacao: r.pontuacao, motivos: r.motivos });
          else outros.push({ comprador: c, bloqueios: r.bloqueios });
        }
        sugeridos.sort((a, b) => b.pontuacao - a.pontuacao);
        return { sugeridos, outros };
      },
    ],
    [
      'post',
      /^\/precatorios\/([^/]+)\/cotacoes$/,
      ([id], body) => {
        const p = achar(db.precatorios, id, 'Precatório');
        const { compradorIds } = validar(cotacaoEnviarSchema, body);
        if (compradorIds.some((cid) => !db.compradores.some((c) => c.id === cid))) {
          throw new HttpErro(400, 'Um ou mais compradores não existem');
        }
        const criadas = compradorIds
          .filter((cid) => !db.cotacoes.some((c) => c.precatorioId === id && c.compradorId === cid))
          .map((cid) => {
            const c: DemoCotacao = {
              id: novoId(),
              precatorioId: id,
              compradorId: cid,
              status: 'PENDENTE',
              valorBruto: null,
              comissao: null,
              observacao: null,
              dataEnvio: agoraIso(),
              dataResposta: null,
            };
            db.cotacoes.push(c);
            return c;
          });
        if (criadas.length > 0 && ESTAGIOS_ANTES_COTACAO.includes(p.estagioAtual)) {
          registrarEstagio(
            p,
            EstagioPrecatorio.ENVIADO_COTACAO,
            'Avanço automático ao solicitar cotações',
          );
        }
        return {
          __status: 201,
          body: {
            criadas: criadas.length,
            duplicadas: compradorIds.length - criadas.length,
            cotacoes: criadas.map(cotacaoView),
          },
        };
      },
    ],
    [
      'patch',
      /^\/cotacoes\/([^/]+)\/responder$/,
      ([id], body) => {
        const c = achar(db.cotacoes, id, 'Cotação');
        const d = validar(cotacaoResponderSchema, body);
        Object.assign(c, {
          status: 'RECEBIDA',
          valorBruto: dec(d.valorBruto),
          comissao: dec(d.comissao),
          observacao: d.observacao ?? null,
          dataResposta: agoraIso(),
        });
        const v = cotacaoView(c);
        notificar(
          'COTACAO_RESPONDIDA',
          `${v.comprador?.nome} respondeu R$ ${d.valorBruto.toLocaleString('pt-BR')}.`,
          `/precatorios/${c.precatorioId}`,
        );
        return v;
      },
    ],
    [
      'patch',
      /^\/cotacoes\/([^/]+)\/recusar$/,
      ([id], body) => {
        const c = achar(db.cotacoes, id, 'Cotação');
        const d = validar(cotacaoRecusarSchema, body);
        Object.assign(c, {
          status: 'RECUSADA',
          observacao: d.observacao ?? null,
          dataResposta: agoraIso(),
        });
        const v = cotacaoView(c);
        notificar(
          'COTACAO_RECUSADA',
          `${v.comprador?.nome} recusou cotação.`,
          `/precatorios/${c.precatorioId}`,
        );
        return v;
      },
    ],
    [
      'delete',
      /^\/cotacoes\/([^/]+)$/,
      ([id]) => {
        achar(db.cotacoes, id, 'Cotação');
        db.cotacoes = db.cotacoes.filter((c) => c.id !== id);
        return undefined;
      },
    ],

    // negociações
    [
      'post',
      /^\/precatorios\/([^/]+)\/negociacoes$/,
      ([id], body) => {
        achar(db.precatorios, id, 'Precatório');
        const d = validar(negociacaoCreateSchema, body);
        const n = {
          id: novoId(),
          precatorioId: id,
          origem: d.origem,
          valor: String(d.valor),
          observacao: d.observacao ?? null,
          createdById: eu.id,
          createdAt: agoraIso(),
        };
        db.negociacoes.push(n);
        notificar(
          'NEGOCIACAO_NOVA',
          `Nova proposta de R$ ${d.valor.toLocaleString('pt-BR')}.`,
          `/precatorios/${id}`,
        );
        const { createdById, ...resto } = n;
        return { __status: 201, body: { ...resto, createdBy: userView(createdById) } };
      },
    ],
    [
      'delete',
      /^\/negociacoes\/([^/]+)$/,
      ([id]) => {
        achar(db.negociacoes, id, 'Negociação');
        db.negociacoes = db.negociacoes.filter((n) => n.id !== id);
        return undefined;
      },
    ],

    // anexos — sem servidor não há upload nem arquivo para baixar
    ['get', /^\/precatorios\/([^/]+)\/anexos$/, ([id]) => detalhe(id).anexos],
    [
      'post',
      /^\/precatorios\/([^/]+)\/anexos$/,
      () => {
        throw new HttpErro(
          501,
          'Upload de PDF fica desligado na demo (não há servidor para rodar o OCR).',
        );
      },
    ],
    [
      'get',
      /^\/anexos\/([^/]+)\/download$/,
      () => {
        throw new HttpErro(501, 'Os PDFs da demo são fictícios e não existem para download.');
      },
    ],
    [
      'post',
      /^\/anexos\/([^/]+)\/reprocessar$/,
      ([id]) => {
        achar(db.anexos, id, 'Anexo');
        return undefined;
      },
    ],
    [
      'post',
      /^\/anexos\/([^/]+)\/aplicar$/,
      ([id], body) => {
        const a = achar(db.anexos, id, 'Anexo');
        const { campo } = validar(aplicarValorSchema, body) as { campo: CampoAplicavel };
        const valor = a.dadosExtraidos?.[campo];
        if (valor === undefined || valor === null) {
          throw new HttpErro(400, `Campo "${campo}" não foi extraído do OCR`);
        }
        const p = achar(db.precatorios, a.precatorioId, 'Precatório');
        if (campo === 'valorOriginal' || campo === 'valorAtualizado') {
          p[campo] = String(valor);
          p.score = calcularScore(Number(p.valorAtualizado ?? p.valorOriginal));
        } else if (campo === 'dataExpedicao') {
          p.dataExpedicao = iso(String(valor));
        } else {
          p[campo] = String(valor);
        }
        p.updatedAt = agoraIso();
        return comJoins(p);
      },
    ],
    [
      'delete',
      /^\/anexos\/([^/]+)$/,
      ([id]) => {
        achar(db.anexos, id, 'Anexo');
        db.anexos = db.anexos.filter((a) => a.id !== id);
        return undefined;
      },
    ],

    // notificações
    [
      'get',
      /^\/notificacoes$/,
      (_, __, q) => {
        const limite = Number(q.get('limit') ?? 20);
        return db.notificacoes
          .filter((n) => n.userId === eu.id && (q.get('apenasNaoLidas') !== 'true' || !n.lida))
          .sort((a, b) => Number(a.lida) - Number(b.lida) || b.createdAt.localeCompare(a.createdAt))
          .slice(0, limite);
      },
    ],
    [
      'get',
      /^\/notificacoes\/nao-lidas\/contar$/,
      () => ({ count: db.notificacoes.filter((n) => n.userId === eu.id && !n.lida).length }),
    ],
    [
      'patch',
      /^\/notificacoes\/([^/]+)\/lida$/,
      ([id]) => {
        const n = achar(db.notificacoes, id, 'Notificação');
        n.lida = true;
        return n;
      },
    ],
    [
      'post',
      /^\/notificacoes\/marcar-todas-lidas$/,
      () => {
        const pendentes = db.notificacoes.filter((n) => !n.lida);
        for (const n of pendentes) n.lida = true;
        return { atualizadas: pendentes.length };
      },
    ],
    [
      'delete',
      /^\/notificacoes\/([^/]+)$/,
      ([id]) => {
        achar(db.notificacoes, id, 'Notificação');
        db.notificacoes = db.notificacoes.filter((n) => n.id !== id);
        return undefined;
      },
    ],

    // cadastros
    ...crud(
      'cedentes',
      () => db.cedentes,
      'Cedente',
      { criar: cedenteCreateSchema, editar: cedenteUpdateSchema },
      {
        ordenar: porNome,
        antesDeApagar: (id) => {
          if (db.precatorios.some((p) => p.cedenteId === id)) {
            throw new HttpErro(409, 'Cedente possui precatórios vinculados');
          }
        },
      },
    ),
    ...crud(
      'parceiros',
      () => db.parceiros,
      'Parceiro',
      { criar: parceiroCreateSchema, editar: parceiroUpdateSchema },
      {
        ordenar: porNome,
        antesDeApagar: (id) => {
          for (const p of db.precatorios) if (p.parceiroId === id) p.parceiroId = null;
        },
      },
    ),
    ...crud(
      'compradores',
      () => db.compradores,
      'Comprador',
      { criar: compradorCreateSchema, editar: compradorUpdateSchema },
      {
        unico: 'cnpj',
        ordenar: porNome,
        antesDeApagar: (id) => {
          if (db.cotacoes.some((c) => c.compradorId === id)) {
            throw new HttpErro(409, 'Comprador possui cotações vinculadas');
          }
        },
      },
    ),
  ];

  return {
    handle({ method, url, data }) {
      const [caminho, query = ''] = url.split('?');
      const body = typeof data === 'string' && data ? JSON.parse(data) : data;
      for (const [m, padrao, handler] of rotas) {
        if (m !== method.toLowerCase()) continue;
        const match = caminho.match(padrao);
        if (!match) continue;
        try {
          const r = handler(match.slice(1), body, new URLSearchParams(query));
          if (r && typeof r === 'object' && '__status' in r) {
            const { __status, body: corpo } = r as { __status: number; body: unknown };
            return { status: __status, data: structuredClone(corpo) };
          }
          return { status: r === undefined ? 204 : 200, data: structuredClone(r) };
        } catch (e) {
          if (e instanceof HttpErro)
            return { status: e.status, data: { statusCode: e.status, message: e.message } };
          throw e;
        }
      }
      return {
        status: 404,
        data: {
          statusCode: 404,
          message: `Rota ${method.toUpperCase()} ${caminho} não existe na demo`,
        },
      };
    },
  };
}
