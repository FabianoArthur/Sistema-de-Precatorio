import { describe, expect, test } from 'vitest';
import { ScorePrecatorio } from '../enums';
import { calcularScore } from './score';

describe('calcularScore', () => {
  test.each([
    [50_000, ScorePrecatorio.MEDIO],
    [100_000, ScorePrecatorio.MEDIO],
    [100_000.01, ScorePrecatorio.AA],
    [1_000_000, ScorePrecatorio.AA],
    [1_000_000.01, ScorePrecatorio.AAA],
    [5_000_000, ScorePrecatorio.AAA],
    [5_000_000.01, ScorePrecatorio.URGENTE],
  ])('valor %d → %s (limites são exclusivos)', (valor, esperado) => {
    expect(calcularScore(valor)).toBe(esperado);
  });
});
