import { ESTAGIOS_TERMINAIS, EstagioPrecatorio, ScorePrecatorio } from '@preca/shared';
import { beforeEach, describe, expect, test } from 'vitest';
import type { CompradoresSugeridosResponse, CotacaoSummary } from '../features/cotacoes/types';
import type { Notificacao } from '../features/notificacoes/types';
import type { PrecatorioDetail, PrecatorioListItem } from '../features/precatorios/types';
import { DEMO_CREDENCIAIS } from '../lib/demo-mode';
import { type DemoBackend, createDemoBackend } from './backend';

const AGORA = new Date('2026-09-15T12:00:00Z');

let api: DemoBackend;

function get<T>(url: string) {
  return api.handle({ method: 'get', url }) as { status: number; data: T };
}

function send<T>(method: 'post' | 'patch' | 'delete', url: string, data?: unknown) {
  return api.handle({ method, url, data }) as { status: number; data: T };
}

beforeEach(() => {
  api = createDemoBackend(AGORA);
});

describe('auth', () => {
  test('login aceita as credenciais demo e /auth/me devolve o mesmo usuário', () => {
    const login = send<{ accessToken: string; user: { email: string } }>('post', '/auth/login', {
      ...DEMO_CREDENCIAIS,
    });
    expect(login.status).toBe(200);
    expect(login.data.accessToken).toBeTruthy();
    expect(get<{ email: string }>('/auth/me').data.email).toBe(login.data.user.email);
  });
});

describe('precatórios', () => {
  test('lista vem com cedente, ordenada do mais novo para o mais antigo', () => {
    const { data } = get<PrecatorioListItem[]>('/precatorios');
    expect(data.length).toBeGreaterThanOrEqual(8);
    expect(data.every((p) => p.cedente?.nome)).toBe(true);
    const datas = data.map((p) => new Date(p.createdAt).getTime());
    expect([...datas].sort((a, b) => b - a)).toEqual(datas);
  });

  test('filtra por estágio e busca por número (sem diferenciar maiúsculas)', () => {
    const triagem = get<PrecatorioListItem[]>('/precatorios?estagioAtual=TRIAGEM').data;
    expect(triagem.length).toBeGreaterThan(0);
    expect(triagem.every((p) => p.estagioAtual === 'TRIAGEM')).toBe(true);

    const alvo = get<PrecatorioListItem[]>('/precatorios').data[0];
    const termo = (alvo.numeroPrecatorio ?? '').slice(-4).toLowerCase();
    const achados = get<PrecatorioListItem[]>(`/precatorios?search=${termo}`).data;
    expect(achados.map((p) => p.id)).toContain(alvo.id);
  });

  test('criar calcula o score pelo valor efetivo e registra o estágio inicial', () => {
    const cedenteId = get<Array<{ id: string }>>('/cedentes').data[0].id;
    const criado = send<PrecatorioListItem>('post', '/precatorios', {
      cedenteId,
      devedorTipo: 'FEDERAL',
      tipo: 'ALIMENTAR',
      valorOriginal: 90_000,
      valorAtualizado: 2_000_000,
    });
    expect(criado.status).toBe(201);
    expect(criado.data.score).toBe(ScorePrecatorio.AAA);
    expect(criado.data.estagioAtual).toBe(EstagioPrecatorio.NOVOS_RECEBIMENTOS);
    expect(criado.data.valorOriginal).toBe('90000');

    const detalhe = get<PrecatorioDetail>(`/precatorios/${criado.data.id}`).data;
    expect(detalhe.historico).toHaveLength(1);
    expect(detalhe.historico[0].estagioAnterior).toBeNull();
  });

  test('mudar estágio grava histórico, reinicia o relógio do SLA e notifica', () => {
    const p = get<PrecatorioListItem[]>('/precatorios?estagioAtual=TRIAGEM').data[0];
    const antesNotif = get<{ count: number }>('/notificacoes/nao-lidas/contar').data.count;

    const r = send<PrecatorioListItem>('patch', `/precatorios/${p.id}/estagio`, {
      novoEstagio: 'DOCUMENTACAO',
      observacao: 'docs recebidos',
    });
    expect(r.data.estagioAtual).toBe('DOCUMENTACAO');
    expect(r.data.estagioDesde).toBe(AGORA.toISOString());

    const detalhe = get<PrecatorioDetail>(`/precatorios/${p.id}`).data;
    expect(detalhe.historico[0]).toMatchObject({
      estagioAnterior: 'TRIAGEM',
      estagioNovo: 'DOCUMENTACAO',
      observacao: 'docs recebidos',
    });
    expect(get<{ count: number }>('/notificacoes/nao-lidas/contar').data.count).toBe(
      antesNotif + 1,
    );
  });

  test('id inexistente devolve 404 com mensagem', () => {
    const r = get<{ message: string }>('/precatorios/nao-existe');
    expect(r.status).toBe(404);
    expect(r.data.message).toMatch(/não encontrado/i);
  });
});

describe('dashboard', () => {
  test('tem um card por estágio e o pipeline exclui estágios terminais', () => {
    const { data } = get<import('@preca/shared').DashboardData>('/dashboard');
    expect(data.cards.map((c) => c.estagio).sort()).toEqual(
      Object.values(EstagioPrecatorio).sort(),
    );

    const lista = get<PrecatorioListItem[]>('/precatorios').data;
    const ativos = lista.filter((p) => !ESTAGIOS_TERMINAIS.includes(p.estagioAtual));
    expect(data.kpis.pipelineTotal.quantidade).toBe(ativos.length);
  });

  test('alertas de SLA só trazem ativos parados há mais que o SLA, do mais antigo ao mais novo', () => {
    const { data } = get<import('@preca/shared').DashboardData>('/dashboard');
    expect(data.alertasSla.length).toBeGreaterThan(0);
    for (const a of data.alertasSla) {
      expect(ESTAGIOS_TERMINAIS).not.toContain(a.estagioAtual);
      expect(a.diasParado).toBeGreaterThanOrEqual(data.slaConfigurado);
    }
    const dias = data.alertasSla.map((a) => a.diasParado);
    expect([...dias].sort((a, b) => b - a)).toEqual(dias);
  });
});

describe('cotações', () => {
  test('sugeridos usa a regra de match do shared e ignora compradores já cotados', () => {
    const p = get<PrecatorioListItem[]>('/precatorios?estagioAtual=TRIAGEM').data[0];
    const r = get<CompradoresSugeridosResponse>(`/precatorios/${p.id}/cotacoes/sugeridos`).data;
    expect(r.sugeridos.length + r.outros.length).toBeGreaterThan(0);
    const pontos = r.sugeridos.map((s) => s.pontuacao);
    expect([...pontos].sort((a, b) => b - a)).toEqual(pontos);
    for (const o of r.outros) expect(o.bloqueios.length).toBeGreaterThan(0);

    const escolhidos = r.sugeridos.slice(0, 1).map((s) => s.comprador.id);
    send('post', `/precatorios/${p.id}/cotacoes`, { compradorIds: escolhidos });
    const depois = get<CompradoresSugeridosResponse>(`/precatorios/${p.id}/cotacoes/sugeridos`);
    const ids = [...depois.data.sugeridos, ...depois.data.outros].map((s) => s.comprador.id);
    expect(ids).not.toContain(escolhidos[0]);
  });

  test('enviar cotação a partir da triagem avança para "Enviado para Cotação"', () => {
    const p = get<PrecatorioListItem[]>('/precatorios?estagioAtual=TRIAGEM').data[0];
    const { sugeridos } = get<CompradoresSugeridosResponse>(
      `/precatorios/${p.id}/cotacoes/sugeridos`,
    ).data;
    const r = send<{ criadas: number }>('post', `/precatorios/${p.id}/cotacoes`, {
      compradorIds: sugeridos.map((s) => s.comprador.id),
    });
    expect(r.data.criadas).toBe(sugeridos.length);
    const detalhe = get<PrecatorioDetail>(`/precatorios/${p.id}`).data;
    expect(detalhe.estagioAtual).toBe('ENVIADO_COTACAO');
    expect(detalhe.historico[0].observacao).toMatch(/autom/i);
  });

  test('responder grava valor como decimal em string e marca como recebida', () => {
    const detalhe = get<PrecatorioDetail>(
      `/precatorios/${get<PrecatorioListItem[]>('/precatorios?estagioAtual=AGUARDANDO_BANCOS').data[0].id}`,
    ).data;
    const pendente = detalhe.cotacoes.find((c) => c.status === 'PENDENTE') as CotacaoSummary;
    const r = send<CotacaoSummary>('patch', `/cotacoes/${pendente.id}/responder`, {
      valorBruto: 123456.78,
      comissao: 1000,
    });
    expect(r.data.status).toBe('RECEBIDA');
    expect(r.data.valorBruto).toBe('123456.78');
    expect(r.data.dataResposta).toBe(AGORA.toISOString());
  });
});

describe('anexos', () => {
  test('aplicar copia o valor extraído pelo OCR para o precatório', () => {
    const comAnexo = get<PrecatorioListItem[]>('/precatorios')
      .data.map((p) => get<PrecatorioDetail>(`/precatorios/${p.id}`).data)
      .find((d) => d.anexos.length > 0) as PrecatorioDetail;
    const anexos = get<import('../features/anexos/types').AnexoSummary[]>(
      `/precatorios/${comAnexo.id}/anexos`,
    ).data;
    const anexo = anexos.find((a) => a.dadosExtraidos?.valorAtualizado);
    expect(anexo).toBeDefined();

    send('post', `/anexos/${anexo?.id}/aplicar`, { campo: 'valorAtualizado' });
    const depois = get<PrecatorioDetail>(`/precatorios/${comAnexo.id}`).data;
    expect(Number(depois.valorAtualizado)).toBe(anexo?.dadosExtraidos?.valorAtualizado);
  });

  test('upload é recusado na demo com mensagem explicando o motivo', () => {
    const p = get<PrecatorioListItem[]>('/precatorios').data[0];
    const r = send<{ message: string }>('post', `/precatorios/${p.id}/anexos`, {});
    expect(r.status).toBe(501);
    expect(r.data.message).toMatch(/demo/i);
  });
});

describe('notificações', () => {
  test('marcar todas como lidas zera o contador', () => {
    expect(get<{ count: number }>('/notificacoes/nao-lidas/contar').data.count).toBeGreaterThan(0);
    send('post', '/notificacoes/marcar-todas-lidas');
    expect(get<{ count: number }>('/notificacoes/nao-lidas/contar').data.count).toBe(0);
    const lista = get<Notificacao[]>('/notificacoes?limit=20').data;
    expect(lista.every((n) => n.lida)).toBe(true);
  });
});

describe('cadastros', () => {
  test('não deixa apagar cedente com precatórios vinculados', () => {
    const usado = get<PrecatorioListItem[]>('/precatorios').data[0].cedenteId;
    const r = send<{ message: string }>('delete', `/cedentes/${usado}`);
    expect(r.status).toBe(409);
  });

  test('CNPJ de comprador é único', () => {
    const existente = get<Array<{ cnpj: string }>>('/compradores').data[0];
    const r = send<{ message: string }>('post', '/compradores', {
      nome: 'Outro',
      cnpj: existente.cnpj,
      celular: '11900000000',
      email: 'outro@exemplo.com',
    });
    expect(r.status).toBe(409);
  });

  test('rota desconhecida devolve 404', () => {
    expect(get('/nao-existe').status).toBe(404);
  });
});
