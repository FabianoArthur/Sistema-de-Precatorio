import type { DadosExtraidos } from '@preca/shared';
import type { PrecatorioDetail } from '../precatorios/types';

export interface Divergencia {
  campo: keyof DadosExtraidos;
  label: string;
  valorAtual: string | number | null;
  valorExtraido: string | number | null;
  podeAplicar: boolean;
}

const CAMPOS: Array<{
  key: keyof DadosExtraidos;
  label: string;
  precKey: keyof PrecatorioDetail;
  aplicavel?: boolean;
}> = [
  { key: 'numeroPrecatorio', label: 'Nº precatório', precKey: 'numeroPrecatorio', aplicavel: true },
  { key: 'numeroProcesso', label: 'Nº processo', precKey: 'numeroProcesso', aplicavel: true },
  { key: 'valorOriginal', label: 'Valor original', precKey: 'valorOriginal', aplicavel: true },
  {
    key: 'valorAtualizado',
    label: 'Valor atualizado',
    precKey: 'valorAtualizado',
    aplicavel: true,
  },
  { key: 'tribunal', label: 'Tribunal', precKey: 'tribunal', aplicavel: true },
  { key: 'vara', label: 'Vara', precKey: 'vara', aplicavel: true },
  { key: 'dataExpedicao', label: 'Data de expedição', precKey: 'dataExpedicao', aplicavel: true },
];

function normalizar(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    return v.trim().toLowerCase();
  }
  return String(v);
}

export function computarDivergencias(
  precatorio: PrecatorioDetail,
  dados: DadosExtraidos | null,
): Divergencia[] {
  if (!dados) return [];
  const out: Divergencia[] = [];
  for (const c of CAMPOS) {
    const atual = precatorio[c.precKey];
    const extraido = dados[c.key];
    if (extraido === undefined || extraido === null || extraido === '') continue;

    const atualNorm = normalizar(atual);
    const extraidoNorm = normalizar(extraido);
    if (atualNorm === extraidoNorm) continue;

    out.push({
      campo: c.key,
      label: c.label,
      valorAtual: atual as string | number | null,
      valorExtraido: extraido as string | number | null,
      podeAplicar: c.aplicavel ?? false,
    });
  }
  return out;
}
