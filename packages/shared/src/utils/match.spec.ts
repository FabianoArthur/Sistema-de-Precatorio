import { describe, expect, test } from 'vitest';
import { NaturezaPrecatorio, ScorePrecatorio } from '../enums';
import { type CompradorCriterios, type PrecatorioLocalizacao, avaliarMatch } from './match';

function makeComprador(o: Partial<CompradorCriterios> = {}): CompradorCriterios {
  return {
    aceitaFederal: false,
    ufsAceitas: [],
    municipiosAceitos: [],
    scoresAceitos: [],
    ...o,
  };
}

function makePrecatorio(o: Partial<PrecatorioLocalizacao> = {}): PrecatorioLocalizacao {
  return {
    devedorTipo: NaturezaPrecatorio.FEDERAL,
    devedorUf: null,
    devedorMunicipio: null,
    score: ScorePrecatorio.AAA,
    ...o,
  };
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
