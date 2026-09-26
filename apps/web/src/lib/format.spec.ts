import { describe, expect, test } from 'vitest';
import { formatCnpj } from './format-cnpj';

describe('formatCnpj', () => {
  test('formata 14 dígitos com pontuação', () => {
    expect(formatCnpj('00000001000100')).toBe('00.000.001/0001-00');
  });

  test('aceita entrada já pontuada e devolve o original quando não tem 14 dígitos', () => {
    expect(formatCnpj('00.000.001/0001-00')).toBe('00.000.001/0001-00');
    expect(formatCnpj('123')).toBe('123');
    expect(formatCnpj(null)).toBe('—');
  });
});
