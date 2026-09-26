#!/usr/bin/env node
// Gera docs/assets/architecture{,.pt-BR}-{light,dark}.svg — o diagrama animado do README.
// Sem dependências: `node scripts/build-diagram.mjs`. Animação só com CSS (@keyframes +
// offset-path), sem JS nem fonte externa, e desligada por prefers-reduced-motion.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets');
const W = 920;
const H = 540;
const CICLO_S = 12;

const TEMAS = {
  light: {
    bg: '#ffffff', borda: '#d0d7de', card: '#f6f8fa', cardBorda: '#d0d7de', texto: '#1f2328',
    mudo: '#59636e', mono: '#6639ba', seta: '#8c959f', destaque: '#4f46e5', ponto: '#f97316',
    zona: '#eef2ff', zonaBorda: '#c7d2fe', zonaTexto: '#4338ca', num: '#ffffff',
  },
  dark: {
    bg: '#0d1117', borda: '#30363d', card: '#161b22', cardBorda: '#3d444d', texto: '#e6edf3',
    mudo: '#9198a1', mono: '#d2a8ff', seta: '#6e7681', destaque: '#818cf8', ponto: '#fb923c',
    zona: '#1b2040', zonaBorda: '#3a4386', zonaTexto: '#aab2ff', num: '#0d1117',
  },
};

const TXT = {
  en: {
    lang: 'en',
    titulo: 'Architecture of the court-debt (precatório) pipeline',
    desc:
      'The React web app calls the NestJS API over REST with a JWT (1). The API writes each change and its audit-log entry to PostgreSQL in the same transaction (2). An uploaded court PDF goes to the OCR pipeline: pdf-parse first, Tesseract as fallback, then a parser for the federal court, TJSP or TJRJ (3). The extracted fields are stored next to the case (4). A scheduled SLA job finds cases stalled in a stage and creates notifications (5). The API answers the web app, which shows divergences between OCR and the record and the notification bell (6). Validation schemas and the scoring and buyer-matching rules live in a shared package used by both sides. In demo mode the web app swaps HTTP for an in-memory backend with fictitious data, which is what runs on GitHub Pages.',
    web: ['Web app', 'React · Vite · TanStack Query', 'apps/web'],
    demo: ['Demo mode', 'in-memory backend,', 'fictitious data · Pages'],
    shared: ['packages/shared', 'Zod schemas · score · buyer match'],
    api: ['API', 'NestJS · Prisma · JWT', 'apps/api'],
    db: ['PostgreSQL', 'cases · stage history', 'audit log, same transaction'],
    ocr: ['OCR pipeline', 'pdf-parse → Tesseract', 'TRF · TJSP · TJRJ parsers'],
    sla: ['SLA job', 'daily cron', 'stalled cases → alerts'],
    rotulos: {
      reusa: 'same rules on both sides',
      troca: 'swaps HTTP for',
    },
    legenda: [
      'request',
      'write + audit log',
      'court PDF → OCR',
      'extracted fields',
      'SLA scan',
      'answer, diff, bell',
    ],
  },
  pt: {
    lang: 'pt-BR',
    titulo: 'Arquitetura do pipeline de precatórios',
    desc:
      'O app web em React chama a API NestJS por REST com JWT (1). A API grava cada mudança e a entrada do audit log no PostgreSQL na mesma transação (2). O PDF do ofício enviado vai para o pipeline de OCR: pdf-parse primeiro, Tesseract como reserva, depois o parser do TRF, TJSP ou TJRJ (3). Os campos extraídos ficam salvos junto do precatório (4). Um job agendado de SLA acha precatórios parados num estágio e cria notificações (5). A API responde ao app web, que mostra as divergências entre OCR e cadastro e o sino de notificações (6). Os schemas de validação e as regras de score e de match de compradores ficam num pacote compartilhado usado pelos dois lados. No modo demo o app troca o HTTP por um backend em memória com dados fictícios; é o que roda no GitHub Pages.',
    web: ['App web', 'React · Vite · TanStack Query', 'apps/web'],
    demo: ['Modo demo', 'backend em memória,', 'dados fictícios · Pages'],
    shared: ['packages/shared', 'schemas Zod · score · match'],
    api: ['API', 'NestJS · Prisma · JWT', 'apps/api'],
    db: ['PostgreSQL', 'precatórios · histórico', 'audit log, mesma transação'],
    ocr: ['Pipeline de OCR', 'pdf-parse → Tesseract', 'parsers TRF · TJSP · TJRJ'],
    sla: ['Job de SLA', 'cron diário', 'parados → alertas'],
    rotulos: {
      reusa: 'mesmas regras nos dois lados',
      troca: 'troca o HTTP por',
    },
    legenda: [
      'requisição',
      'grava + audit log',
      'ofício PDF → OCR',
      'campos extraídos',
      'varredura de SLA',
      'resposta, diff, sino',
    ],
  },
};

// Caixas: x, y, largura, altura
const B = {
  web: [30, 150, 230, 110],
  demo: [30, 340, 230, 96],
  shared: [345, 22, 230, 78],
  api: [345, 150, 230, 110],
  db: [660, 150, 230, 110],
  ocr: [345, 340, 230, 96],
  sla: [660, 340, 230, 96],
};

// Fluxo animado, na ordem real: [path, posição do número]
const FLUXO = [
  ['M260,188 H345', [302, 176]],
  ['M575,188 H660', [617, 176]],
  ['M430,260 V340', [418, 300]],
  ['M575,372 H617 V236 H660', [605, 300]],
  ['M775,340 V260', [787, 300]],
  ['M345,226 H260', [302, 242]],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function caixa([x, y, w, h], [titulo, sub1, sub2], { tracejada = false, mono2 = false } = {}) {
  const cx = x + w / 2;
  const linhas = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="${tracejada ? 'zona' : 'card'}"/>`,
    `<text x="${cx}" y="${y + 32}" class="b" text-anchor="middle">${esc(titulo)}</text>`,
    `<text x="${cx}" y="${y + 56}" class="m" text-anchor="middle">${esc(sub1)}</text>`,
  ];
  if (sub2) {
    linhas.push(
      `<text x="${cx}" y="${y + 78}" class="${mono2 ? 'code' : 'm'}" text-anchor="middle">${esc(sub2)}</text>`,
    );
  }
  return linhas.join('\n');
}

function keyframes(i, total) {
  // Cada seta tem uma janela no ciclo; o ponto aparece, percorre e some.
  const fatia = 90 / total;
  const ini = 4 + i * fatia;
  const fim = ini + fatia * 0.8;
  const f = (n) => `${n.toFixed(2)}%`;
  return `@keyframes p${i}{0%,${f(ini)}{offset-distance:0%;opacity:0}${f(ini + 1.5)}{opacity:1}${f(fim)}{offset-distance:100%;opacity:1}${f(fim + 2)},100%{offset-distance:100%;opacity:0}}
@keyframes h${i}{0%,${f(ini)}{opacity:0}${f(ini + 1.5)},${f(fim)}{opacity:.9}${f(fim + 4)},100%{opacity:0}}`;
}

function svg(tema, t) {
  const c = TEMAS[tema];
  const estilos = `
text{font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;fill:${c.texto}}
.b{font-size:15px;font-weight:600}
.m{font-size:12.5px;fill:${c.mudo}}
.code{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;fill:${c.mono}}
.lbl{font-size:12px;fill:${c.mudo};font-style:italic}
.lg{font-size:12.5px;fill:${c.mudo}}
.bg{fill:${c.bg};stroke:${c.borda}}
.card{fill:${c.card};stroke:${c.cardBorda}}
.zona{fill:${c.zona};stroke:${c.zonaBorda};stroke-dasharray:6 4}
.zona+text{fill:${c.zonaTexto}}
.e{fill:none;stroke:${c.seta};stroke-width:1.6;stroke-linejoin:round}
.tr{fill:none;stroke:${c.seta};stroke-width:1.3;stroke-dasharray:4 4}
.hl{fill:none;stroke:${c.ponto};stroke-width:2.4;stroke-linejoin:round;opacity:0}
.nb{fill:${c.destaque}}
.nt{font-size:11px;font-weight:700;fill:${c.num}}
.dot{fill:${c.ponto};offset-rotate:0deg;opacity:0}
.halo{fill:${c.ponto};opacity:.25}
${FLUXO.map(([p], i) => `.p${i}{offset-path:path('${p}');animation:p${i} ${CICLO_S}s linear infinite}\n.h${i}{animation:h${i} ${CICLO_S}s linear infinite}`).join('\n')}
${FLUXO.map((_, i) => keyframes(i, FLUXO.length)).join('\n')}
@media (prefers-reduced-motion:reduce){.hl{display:none}g.dot{animation:none;opacity:1;offset-distance:0%}}`;

  const numero = ([x, y], n) =>
    `<circle cx="${x}" cy="${y}" r="9" class="nb"/><text x="${x}" y="${y + 4}" class="nt" text-anchor="middle">${n}</text>`;

  const legendaY = 478;
  const colW = (W - 60) / 3;
  const legenda = t.legenda
    .map((l, i) => {
      const x = 30 + (i % 3) * colW;
      const y = legendaY + Math.floor(i / 3) * 26;
      return `${numero([x + 9, y - 4], i + 1)}<text x="${x + 26}" y="${y}" class="lg">${esc(l)}</text>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc" lang="${t.lang}">
<title id="title">${esc(t.titulo)}</title>
<desc id="desc">${esc(t.desc)}</desc>
<style>${estilos}</style>
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="${c.seta}"/></marker></defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" class="bg"/>
${caixa(B.shared, t.shared)}
${caixa(B.web, t.web, { mono2: true })}
${caixa(B.api, t.api, { mono2: true })}
${caixa(B.db, t.db)}
${caixa(B.ocr, t.ocr)}
${caixa(B.sla, t.sla)}
${caixa(B.demo, t.demo, { tracejada: true })}
<path d="M345,61 H145 V150" class="tr"/>
<path d="M460,100 V150" class="tr"/>
<text x="232" y="53" class="lbl" text-anchor="middle">${esc(t.rotulos.reusa)}</text>
<path d="M145,260 V340" class="tr" marker-end="url(#ah)"/>
<text x="155" y="304" class="lbl">${esc(t.rotulos.troca)}</text>
${FLUXO.map(([p]) => `<path d="${p}" class="e" marker-end="url(#ah)"/>`).join('\n')}
${FLUXO.map(([p], i) => `<path d="${p}" class="hl h${i}"/>`).join('\n')}
${FLUXO.map(([, pos], i) => numero(pos, i + 1)).join('\n')}
${FLUXO.map((_, i) => `<g class="dot p${i}"><circle r="9" class="halo"/><circle r="4.5"/></g>`).join('\n')}
${legenda}
</svg>
`;
}

for (const [idioma, sufixo] of [
  ['en', ''],
  ['pt', '.pt-BR'],
]) {
  for (const tema of ['light', 'dark']) {
    const arquivo = join(OUT, `architecture${sufixo}-${tema}.svg`);
    writeFileSync(arquivo, svg(tema, TXT[idioma]));
    console.log(`✓ ${arquivo}`);
  }
}
