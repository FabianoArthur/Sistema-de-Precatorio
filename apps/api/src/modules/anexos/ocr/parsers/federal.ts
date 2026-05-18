import type { DadosExtraidos } from '@preca/shared';
import { firstMatch, parseDataBR, parseValorBR } from './utils';

const TRF_REGEX = /\b(TRF[\s\-]?\d|Tribunal Regional Federal)/i;

export function detectaFederal(texto: string): boolean {
  return TRF_REGEX.test(texto) || /justi[çc]a federal/i.test(texto);
}

export function parseFederal(texto: string): DadosExtraidos {
  const numeroPrecatorio =
    firstMatch(texto, /Precat[óo]rio\s+(?:n[ºo°.]?\s*)?([\d.\-\/]{8,})/i) ??
    firstMatch(texto, /Pct\.?\s*n[ºo°.]?\s*([\d.\-\/]{8,})/i);

  const numeroProcesso =
    firstMatch(texto, /Processo\s+(?:n[ºo°.]?\s*)?([\d.\-]{15,})/i) ??
    firstMatch(texto, /Autos?\s+(?:n[ºo°.]?\s*)?([\d.\-]{15,})/i);

  const valorOriginal = parseValorBR(
    firstMatch(texto, /Valor (?:original|principal|requisitado)[:\s]+R\$\s*([\d.,]+)/i) ?? '',
  );

  const valorAtualizado = parseValorBR(
    firstMatch(texto, /Valor (?:atualizado|corrigido)[:\s]+R\$\s*([\d.,]+)/i) ?? '',
  );

  const tribunal =
    firstMatch(texto, /(TRF[\s\-]?\d(?:[ªa]?\s*Regi[ãa]o)?)/i) ??
    firstMatch(texto, /(Tribunal Regional Federal[^.\n]{0,40})/i);

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
    devedor: 'União Federal',
    tribunal,
    vara,
    dataExpedicao,
    parsedBy: 'federal',
  };
}
