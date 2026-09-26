import { escolherParser } from '../index';
import { detectaFederal, parseFederal } from './federal';
import { detectaRJ, parseRJ } from './rj';
import { detectaSP, parseSP } from './sp';
import { firstMatch, normalizarTexto, parseDataBR, parseValorBR } from './utils';

// Todos os textos abaixo são fictícios. Os números de processo usam a unidade de origem
// 0000 e dígito verificador 00, que não existem no padrão CNJ: nenhum colide com caso real.

const OFICIO_FEDERAL = `
PODER JUDICIÁRIO — JUSTIÇA FEDERAL
TRIBUNAL REGIONAL FEDERAL DA 3ª REGIÃO
Precatório nº 2024.03.00.000001-0
Processo nº 0000123-00.2019.4.03.0000
2ª Vara Federal Cível
Valor original: R$ 250.000,00
Valor atualizado: R$ 312.450,75
Data de expedição: 15/03/2024
`;

const OFICIO_SP = `
TRIBUNAL DE JUSTIÇA DE SÃO PAULO — DEPRE
Ofício Requisitório nº 000003/2023
Autos nº 0000456-00.2020.8.26.0000
Executado: Município de Campinas
Valor de face: R$ 1.234.567,89
Valor atualizado em: R$ 1.400.000,00
3ª Vara da Fazenda Pública
Emissão: 2/9/23
`;

const OFICIO_RJ = `
TJRJ — Tribunal de Justiça do Estado do Rio de Janeiro
Precatório nº 2022/000002-0
Processo nº 0000789-00.2018.8.19.0000
Devedor: Estado do Rio de Janeiro
Valor nominal: R$ 88.000,50
11ª Vara de Fazenda Pública
Expedição: 01-12-2022
`;

describe('OCR utils', () => {
  test('parseValorBR converte formato brasileiro com milhar e centavos', () => {
    expect(parseValorBR('1.234.567,89')).toBe(1234567.89);
    expect(parseValorBR('R$ 250.000,00')).toBe(250000);
    expect(parseValorBR('88.000,50')).toBe(88000.5);
  });

  test('parseValorBR devolve null para vazio, zero ou lixo', () => {
    expect(parseValorBR('')).toBeNull();
    expect(parseValorBR('0,00')).toBeNull();
    expect(parseValorBR('abc')).toBeNull();
  });

  test('parseDataBR normaliza separadores e ano de 2 dígitos para ISO', () => {
    expect(parseDataBR('15/03/2024')).toBe('2024-03-15');
    expect(parseDataBR('2/9/23')).toBe('2023-09-02');
    expect(parseDataBR('01-12-2022')).toBe('2022-12-01');
    expect(parseDataBR('01.12.2022')).toBe('2022-12-01');
  });

  test('parseDataBR rejeita texto sem data ou data impossível', () => {
    expect(parseDataBR('sem data')).toBeNull();
    expect(parseDataBR('45/13/2024')).toBeNull();
  });

  test('normalizarTexto colapsa espaços e quebras excessivas', () => {
    expect(normalizarTexto('  a\t\tb\r\n\n\n\nc  ')).toBe('a b\n\nc');
  });

  test('firstMatch devolve o primeiro grupo aparado ou null', () => {
    expect(firstMatch('Vara: 2ª  ', /Vara:\s*(.+)/)).toBe('2ª');
    expect(firstMatch('nada aqui', /Vara:\s*(.+)/)).toBeNull();
  });
});

describe('parser Federal', () => {
  test('detecta ofício de TRF', () => {
    expect(detectaFederal(OFICIO_FEDERAL)).toBe(true);
    expect(detectaFederal(OFICIO_SP)).toBe(false);
  });

  test('extrai número, processo, valores, tribunal, vara e data', () => {
    const d = parseFederal(OFICIO_FEDERAL);
    expect(d).toMatchObject({
      numeroPrecatorio: '2024.03.00.000001-0',
      numeroProcesso: '0000123-00.2019.4.03.0000',
      valorOriginal: 250000,
      valorAtualizado: 312450.75,
      devedor: 'União Federal',
      vara: '2ª Vara Federal Cível',
      dataExpedicao: '2024-03-15',
      parsedBy: 'federal',
    });
    expect(d.tribunal).toMatch(/TRIBUNAL REGIONAL FEDERAL/i);
  });
});

describe('parser TJSP', () => {
  test('detecta ofício do TJSP', () => {
    expect(detectaSP(OFICIO_SP)).toBe(true);
    expect(detectaSP(OFICIO_RJ)).toBe(false);
  });

  test('usa o ofício requisitório como número e identifica o município devedor', () => {
    const d = parseSP(OFICIO_SP);
    expect(d).toMatchObject({
      numeroPrecatorio: '000003/2023',
      numeroProcesso: '0000456-00.2020.8.26.0000',
      valorOriginal: 1234567.89,
      valorAtualizado: 1400000,
      devedor: 'Município de Campinas',
      tribunal: 'TJSP',
      dataExpedicao: '2023-09-02',
      parsedBy: 'sp',
    });
    expect(d.vara).toMatch(/^3ª Vara da Fazenda/);
  });

  test('cai no Estado de São Paulo quando só a Fazenda estadual aparece', () => {
    const d = parseSP('TJSP\nFazenda do Estado de São Paulo\nValor principal: R$ 10.000,00');
    expect(d.devedor).toBe('Estado de São Paulo');
    expect(d.valorOriginal).toBe(10000);
    expect(d.valorAtualizado).toBeNull();
  });
});

describe('parser TJRJ', () => {
  test('detecta ofício do TJRJ', () => {
    expect(detectaRJ(OFICIO_RJ)).toBe(true);
    expect(detectaRJ(OFICIO_FEDERAL)).toBe(false);
  });

  test('extrai campos e o ente devedor estadual', () => {
    const d = parseRJ(OFICIO_RJ);
    expect(d).toMatchObject({
      numeroPrecatorio: '2022/000002-0',
      numeroProcesso: '0000789-00.2018.8.19.0000',
      valorOriginal: 88000.5,
      devedor: 'Estado do Rio de Janeiro',
      tribunal: 'TJRJ',
      dataExpedicao: '2022-12-01',
      parsedBy: 'rj',
    });
  });
});

describe('escolherParser', () => {
  test('roteia cada ofício para o parser do seu tribunal', () => {
    expect(escolherParser(OFICIO_FEDERAL)?.nome).toBe('federal');
    expect(escolherParser(OFICIO_SP)?.nome).toBe('sp');
    expect(escolherParser(OFICIO_RJ)?.nome).toBe('rj');
  });

  test('devolve null para texto de tribunal desconhecido', () => {
    expect(escolherParser('Tribunal de Justiça de Minas Gerais — ofício qualquer')).toBeNull();
  });
});
