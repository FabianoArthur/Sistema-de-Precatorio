import { describe, expect, test } from 'vitest';
import type { PrecatorioDetail } from '../precatorios/types';
import { computarDivergencias } from './diff';

const base = {
  numeroPrecatorio: '2024.00.000001-0',
  numeroProcesso: '0000101-00.2024.4.03.0000',
  valorOriginal: '250000',
  valorAtualizado: null,
  tribunal: 'TJSP',
  vara: null,
  dataExpedicao: '2024-03-15T00:00:00.000Z',
} as unknown as PrecatorioDetail;

describe('computarDivergencias', () => {
  test('sem dados extraídos não há divergência', () => {
    expect(computarDivergencias(base, null)).toEqual([]);
  });

  test('ignora campos iguais após normalizar caixa, espaços e data ISO', () => {
    const r = computarDivergencias(base, {
      numeroPrecatorio: ' 2024.00.000001-0 ',
      tribunal: 'tjsp',
      valorOriginal: 250000,
      dataExpedicao: '2024-03-15',
    });
    expect(r).toEqual([]);
  });

  test('aponta o que o OCR achou diferente ou o que falta no cadastro', () => {
    const r = computarDivergencias(base, {
      valorOriginal: 260000,
      valorAtualizado: 301000.5,
      vara: '2ª Vara',
      devedor: 'União Federal',
    });
    expect(r.map((d) => d.campo)).toEqual(['valorOriginal', 'valorAtualizado', 'vara']);
    expect(r[1]).toMatchObject({ valorAtual: null, valorExtraido: 301000.5, podeAplicar: true });
  });

  test('não conta campo extraído vazio como divergência', () => {
    expect(computarDivergencias(base, { vara: '', tribunal: null })).toEqual([]);
  });
});
