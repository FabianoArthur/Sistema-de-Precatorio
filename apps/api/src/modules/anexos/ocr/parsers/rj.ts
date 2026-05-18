import type { DadosExtraidos } from '@preca/shared';
import { firstMatch, parseDataBR, parseValorBR } from './utils';

export function detectaRJ(texto: string): boolean {
  return /\bTJRJ\b|Tribunal de Justi[çc]a do (?:Estado do )?Rio de Janeiro/i.test(texto);
}

export function parseRJ(texto: string): DadosExtraidos {
  const numeroPrecatorio = firstMatch(texto, /Precat[óo]rio\s+(?:n[ºo°.]?\s*)?([\d.\-\/]{8,})/i);

  const numeroProcesso = firstMatch(texto, /(?:Processo|Autos?)\s+(?:n[ºo°.]?\s*)?([\d.\-]{15,})/i);

  const valorOriginal = parseValorBR(
    firstMatch(texto, /Valor (?:original|principal|requisitado|nominal)[:\s]+R\$\s*([\d.,]+)/i) ??
      '',
  );

  const valorAtualizado = parseValorBR(
    firstMatch(texto, /Valor (?:atualizado|corrigido)[:\s]+R\$\s*([\d.,]+)/i) ?? '',
  );

  const entePublico = firstMatch(
    texto,
    /(?:executad[oa]|devedor[a]?)[:\s]+(Munic[íi]pio do Rio de Janeiro|Estado do Rio de Janeiro|Munic[íi]pio de [A-ZÁÉÍÓÚÂÊÔÃÕÇ][^\n.,]{2,40})/i,
  );

  const isEstadual = /Estado do Rio de Janeiro|Fazenda do Estado do Rio/i.test(texto);

  const vara = firstMatch(texto, /(\d{1,2}[ªa°]?\s*Vara[^.\n]{0,40})/i);

  const dataExpedicao = parseDataBR(
    firstMatch(
      texto,
      /(?:expedi[çc][ãa]o|emiss[ãa]o)[:\s]+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    ) ?? '',
  );

  return {
    numeroPrecatorio,
    numeroProcesso,
    valorOriginal,
    valorAtualizado,
    devedor: entePublico ?? (isEstadual ? 'Estado do Rio de Janeiro' : null),
    tribunal: 'TJRJ',
    vara,
    dataExpedicao,
    parsedBy: 'rj',
  };
}
