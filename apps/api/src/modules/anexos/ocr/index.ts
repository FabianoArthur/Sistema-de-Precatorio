import { Logger } from '@nestjs/common';
import type { DadosExtraidos, NaturezaPrecatorio } from '@preca/shared';
import { detectaFederal, parseFederal } from './parsers/federal';
import { detectaRJ, parseRJ } from './parsers/rj';
import { detectaSP, parseSP } from './parsers/sp';
import { normalizarTexto } from './parsers/utils';

const logger = new Logger('OCR');

const MIN_TEXTO_VALIDO = Number(process.env.OCR_MIN_TEXTO_VALIDO ?? 100);
const TESSERACT_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS ?? 60_000);
const TESSERACT_MAX_PAGES = Number(process.env.OCR_MAX_PAGES ?? 3);

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolveP, rejectP) => {
    const t = setTimeout(() => rejectP(new Error(`${label} timeout após ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolveP(v);
      },
      (err) => {
        clearTimeout(t);
        rejectP(err);
      },
    );
  });
}

export async function extrairTexto(buffer: Buffer): Promise<{ texto: string; usouOcr: boolean }> {
  const pdfParseMod = await import('pdf-parse');
  const pdfParse = (pdfParseMod.default ?? pdfParseMod) as unknown as (
    b: Buffer,
  ) => Promise<{ text: string }>;
  let texto = '';
  try {
    const res = await pdfParse(buffer);
    texto = normalizarTexto(res.text ?? '');
  } catch (err) {
    logger.warn(`pdf-parse falhou: ${(err as Error).message}`);
  }

  if (texto.length >= MIN_TEXTO_VALIDO) {
    return { texto, usouOcr: false };
  }

  logger.log(`Texto embutido insuficiente (${texto.length} chars), tentando Tesseract...`);
  const tesseractTexto = await rodarTesseract(buffer);
  return { texto: tesseractTexto, usouOcr: true };
}

async function rodarTesseract(buffer: Buffer): Promise<string> {
  const pdfImgConvert = await import('pdf-img-convert');
  const tesseract = await import('tesseract.js');

  const pages = (await pdfImgConvert.convert(buffer, { scale: 2 })) as Array<Uint8Array | string>;
  if (pages.length === 0) return '';

  const maxPages = Math.min(pages.length, TESSERACT_MAX_PAGES);
  let texto = '';
  for (let i = 0; i < maxPages; i++) {
    const page = pages[i];
    const imgBuffer = typeof page === 'string' ? Buffer.from(page, 'base64') : Buffer.from(page);
    try {
      const result = await withTimeout(
        tesseract.recognize(imgBuffer, 'por'),
        TESSERACT_TIMEOUT_MS,
        `Tesseract página ${i + 1}`,
      );
      texto += `${result.data.text}\n\n`;
    } catch (err) {
      logger.warn(`Tesseract falhou na página ${i + 1}: ${(err as Error).message}`);
      break;
    }
  }
  return normalizarTexto(texto);
}

export function escolherParser(
  texto: string,
  hint?: NaturezaPrecatorio,
): { parse: (t: string) => DadosExtraidos; nome: 'federal' | 'sp' | 'rj' } | null {
  if (hint === 'FEDERAL' && detectaFederal(texto)) return { parse: parseFederal, nome: 'federal' };
  if (detectaSP(texto)) return { parse: parseSP, nome: 'sp' };
  if (detectaRJ(texto)) return { parse: parseRJ, nome: 'rj' };
  if (detectaFederal(texto)) return { parse: parseFederal, nome: 'federal' };
  return null;
}

export async function processarPdf(
  buffer: Buffer,
  hint?: NaturezaPrecatorio,
): Promise<DadosExtraidos> {
  const { texto, usouOcr } = await extrairTexto(buffer);
  if (!texto || texto.length < 20) {
    return {
      erro: 'Não foi possível extrair texto do PDF (nem com OCR).',
      textoBruto: null,
      parsedBy: null,
    };
  }

  const parser = escolherParser(texto, hint);
  if (!parser) {
    return {
      erro: 'PDF não reconhecido como TRF, TJSP ou TJRJ.',
      textoBruto: texto.slice(0, 2000),
      parsedBy: null,
    };
  }

  logger.log(`Parser selecionado: ${parser.nome} (OCR=${usouOcr})`);
  const dados = parser.parse(texto);
  return { ...dados, textoBruto: texto.slice(0, 2000) };
}
