export function normalizarTexto(txt: string): string {
  return txt
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseValorBR(s: string): number | null {
  const limpo = s.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '');
  const normalizado = limpo.replace(',', '.');
  const n = Number(normalizado);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function firstMatch(texto: string, regex: RegExp): string | null {
  const m = texto.match(regex);
  return m?.[1]?.trim() || null;
}

export function parseDataBR(s: string): string | null {
  const m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return null;
  const [, d, mes, ano] = m;
  const dd = d.padStart(2, '0');
  const mm = mes.padStart(2, '0');
  const yyyy = ano.length === 2 ? `20${ano}` : ano;
  const iso = `${yyyy}-${mm}-${dd}`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}
