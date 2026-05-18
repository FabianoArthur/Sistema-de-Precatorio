import type { DadosExtraidos } from '@preca/shared';
import { firstMatch, parseDataBR, parseValorBR } from './utils';

export function detectaSP(texto: string): boolean {
  return /\bTJSP\b|Tribunal de Justi[çc]a de S[ãa]o Paulo|DEPRE/i.test(texto);
}

export function parseSP(texto: string): DadosExtraidos {
  const numeroPrecatorio =
    firstMatch(texto, /Precat[óo]rio\s+(?:n[ºo°.]?\s*)?([\d.\-\/]{8,})/i) ??
    firstMatch(texto, /Ofício\s+Requisit[óo]rio\s+n[ºo°.]?\s*([\d.\-\/]{6,})/i);

  const numeroProcesso = firstMatch(texto, /(?:Processo|Autos?)\s+(?:n[ºo°.]?\s*)?([\d.\-]{15,})/i);

  const valorOriginal = parseValorBR(
    firstMatch(texto, /Valor (?:original|principal|requisitado|de face)[:\s]+R\$\s*([\d.,]+)/i) ??
      '',
  );

  const valorAtualizado = parseValorBR(
    firstMatch(texto, /Valor (?:atualizado|corrigido|atualizado em)[:\s]+R\$\s*([\d.,]+)/i) ?? '',
  );

  const entePublico =
    firstMatch(
      texto,
      /(?:executad[oa]|devedor[a]?|fazenda\s+p[úu]blica)[:\s]+(Munic[íi]pio de [A-ZÁÉÍÓÚÂÊÔÃÕÇ][^\n.,]{2,40}|Estado de S[ãa]o Paulo|Prefeitura[^\n.,]{0,40})/i,
    ) ?? null;

  const isEstadual = /Estado de S[ãa]o Paulo|Fazenda do Estado/i.test(texto);

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
    devedor: entePublico ?? (isEstadual ? 'Estado de São Paulo' : null),
    tribunal: 'TJSP',
    vara,
    dataExpedicao,
    parsedBy: 'sp',
  };
}
