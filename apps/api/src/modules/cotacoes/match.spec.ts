import { ScorePrecatorio } from '@preca/shared';
import type { Comprador, Precatorio } from '@prisma/client';
import { avaliarMatch } from './match';

type CompradorOverrides = Partial<
  Pick<Comprador, 'aceitaFederal' | 'ufsAceitas' | 'municipiosAceitos' | 'scoresAceitos' | 'ativo'>
>;

function makeComprador(o: CompradorOverrides = {}): Comprador {
  return {
    id: 'cmp-1',
    nome: 'Comprador Teste',
    cnpj: '00000000000000',
    celular: '11999999999',
    email: 'teste@example.com',
    aceitaFederal: false,
    ufsAceitas: [],
    municipiosAceitos: [],
    scoresAceitos: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...o,
  } as Comprador;
}

type PrecatorioOverrides = Partial<
  Pick<Precatorio, 'devedorTipo' | 'devedorUf' | 'devedorMunicipio' | 'score'>
>;

function makePrecatorio(
  o: PrecatorioOverrides = {},
): Pick<Precatorio, 'id' | 'devedorTipo' | 'devedorUf' | 'devedorMunicipio' | 'score'> {
  return {
    id: 'pct-1',
    devedorTipo: 'FEDERAL',
    devedorUf: null,
    devedorMunicipio: null,
    score: ScorePrecatorio.AAA,
    ...o,
  } as Pick<Precatorio, 'id' | 'devedorTipo' | 'devedorUf' | 'devedorMunicipio' | 'score'>;
}

describe('avaliarMatch', () => {
  test('Federal: aplica bônus quando comprador aceita federal', () => {
    const c = makeComprador({ aceitaFederal: true });
    const p = makePrecatorio({ devedorTipo: 'FEDERAL' });
    const r = avaliarMatch(c, p);

    expect(r.ok).toBe(true);
    if (r.ok) {
      // SCORE_QUALQUER (10) + PONTOS_ESPECIFICO (30) + BONUS_FEDERAL (10) = 50
      expect(r.pontuacao).toBe(50);
      expect(r.motivos.some((m) => m.label.includes('Federal'))).toBe(true);
    }
  });

  test('Federal: bloqueia quando comprador não aceita', () => {
    const c = makeComprador({ aceitaFederal: false });
    const p = makePrecatorio({ devedorTipo: 'FEDERAL' });
    const r = avaliarMatch(c, p);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.bloqueios).toHaveLength(1);
      expect(r.bloqueios[0].label).toContain('Federal');
    }
  });

  test('Municipal: UF bloqueada não gera bloqueio redundante de município', () => {
    const c = makeComprador({ ufsAceitas: ['RJ'], municipiosAceitos: ['Niterói'] });
    const p = makePrecatorio({
      devedorTipo: 'MUNICIPAL',
      devedorUf: 'SP',
      devedorMunicipio: 'São Paulo',
    });
    const r = avaliarMatch(c, p);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      // Apenas 1 bloqueio (UF) — município não deve duplicar
      expect(r.bloqueios).toHaveLength(1);
      expect(r.bloqueios[0].label).toContain('UF');
    }
  });

  test('Score não aceito gera bloqueio', () => {
    const c = makeComprador({ scoresAceitos: [ScorePrecatorio.AAA], aceitaFederal: true });
    const p = makePrecatorio({ devedorTipo: 'FEDERAL', score: ScorePrecatorio.MEDIO });
    const r = avaliarMatch(c, p);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.bloqueios.some((b) => b.label.includes('score'))).toBe(true);
    }
  });

  test('Municipal: aceita qualquer UF e qualquer município gera dois bônus de "qualquer"', () => {
    const c = makeComprador({ ufsAceitas: [], municipiosAceitos: [] });
    const p = makePrecatorio({
      devedorTipo: 'MUNICIPAL',
      devedorUf: 'BA',
      devedorMunicipio: 'Salvador',
    });
    const r = avaliarMatch(c, p);

    expect(r.ok).toBe(true);
    if (r.ok) {
      // SCORE_QUALQUER (10) + UF_QUALQUER (10) + MUNICIPIO_QUALQUER (10) = 30
      expect(r.pontuacao).toBe(30);
    }
  });
});
