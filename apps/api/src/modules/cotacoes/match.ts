import {
  BLOQUEIO_TIPO,
  type BloqueioTipo,
  MOTIVO_TIPO,
  type MotivoBloqueio,
  type MotivoMatch,
  type MotivoTipo,
  SCORE_LABELS,
} from '@preca/shared';
import type { Comprador, Precatorio } from '@prisma/client';

type PrecatorioMatch = Pick<
  Precatorio,
  'id' | 'devedorTipo' | 'devedorUf' | 'devedorMunicipio' | 'score'
>;

export interface ResultadoMatch {
  ok: true;
  pontuacao: number;
  motivos: MotivoMatch[];
}

export interface ResultadoBloqueado {
  ok: false;
  bloqueios: MotivoBloqueio[];
}

const PONTOS_ESPECIFICO = 30;
const PONTOS_QUALQUER = 10;

function motivo(tipo: MotivoTipo, label: string, detalhe?: string): MotivoMatch {
  return { tipo, label, detalhe };
}

function bloqueio(tipo: BloqueioTipo, label: string, detalhe?: string): MotivoBloqueio {
  return { tipo, label, detalhe };
}

export function avaliarMatch(
  comprador: Comprador,
  precatorio: PrecatorioMatch,
): ResultadoMatch | ResultadoBloqueado {
  const motivos: MotivoMatch[] = [];
  const bloqueios: MotivoBloqueio[] = [];
  let pontuacao = 0;

  // --- SCORE ---
  if (comprador.scoresAceitos.length > 0) {
    if (comprador.scoresAceitos.includes(precatorio.score)) {
      motivos.push(
        motivo(
          MOTIVO_TIPO.SCORE_ACEITO,
          `Score ${SCORE_LABELS[precatorio.score]}`,
          'aceito explicitamente',
        ),
      );
      pontuacao += PONTOS_ESPECIFICO;
    } else {
      bloqueios.push(
        bloqueio(
          BLOQUEIO_TIPO.SCORE_NAO_ACEITO,
          `Não aceita score ${SCORE_LABELS[precatorio.score]}`,
          `Aceita: ${comprador.scoresAceitos.map((s) => SCORE_LABELS[s]).join(', ')}`,
        ),
      );
    }
  } else {
    motivos.push(motivo(MOTIVO_TIPO.SCORE_QUALQUER, 'Score', 'aceita qualquer'));
    pontuacao += PONTOS_QUALQUER;
  }

  // --- NATUREZA / GEO ---
  if (precatorio.devedorTipo === 'FEDERAL') {
    if (comprador.aceitaFederal) {
      motivos.push(motivo(MOTIVO_TIPO.FEDERAL_OK, 'Federal', 'aceita precatórios federais'));
      pontuacao += PONTOS_ESPECIFICO + 10;
    } else {
      bloqueios.push(bloqueio(BLOQUEIO_TIPO.FEDERAL_NAO_ACEITO, 'Não aceita Federal'));
    }
  } else if (precatorio.devedorTipo === 'ESTADUAL') {
    const uf = precatorio.devedorUf;
    if (comprador.ufsAceitas.length === 0) {
      motivos.push(motivo(MOTIVO_TIPO.UF_QUALQUER, 'Estadual', 'aceita qualquer UF'));
      pontuacao += PONTOS_QUALQUER;
    } else if (uf && comprador.ufsAceitas.includes(uf)) {
      motivos.push(motivo(MOTIVO_TIPO.UF_ACEITA, `UF ${uf}`, 'aceita explicitamente'));
      pontuacao += PONTOS_ESPECIFICO;
    } else {
      bloqueios.push(
        bloqueio(
          BLOQUEIO_TIPO.UF_NAO_ACEITA,
          `Não aceita UF ${uf ?? '?'}`,
          `Aceita: ${comprador.ufsAceitas.join(', ')}`,
        ),
      );
    }
  } else if (precatorio.devedorTipo === 'MUNICIPAL') {
    const uf = precatorio.devedorUf;
    const municipio = precatorio.devedorMunicipio;

    // UF check
    if (comprador.ufsAceitas.length === 0) {
      motivos.push(motivo(MOTIVO_TIPO.UF_QUALQUER, 'Municipal', 'aceita qualquer UF'));
      pontuacao += PONTOS_QUALQUER;
    } else if (uf && comprador.ufsAceitas.includes(uf)) {
      motivos.push(motivo(MOTIVO_TIPO.UF_ACEITA, `UF ${uf}`, 'aceita explicitamente'));
      pontuacao += PONTOS_ESPECIFICO;
    } else {
      bloqueios.push(
        bloqueio(
          BLOQUEIO_TIPO.UF_NAO_ACEITA,
          `Não aceita UF ${uf ?? '?'}`,
          `Aceita: ${comprador.ufsAceitas.join(', ')}`,
        ),
      );
    }

    // Município check (só se UF não bloqueou)
    if (comprador.municipiosAceitos.length === 0) {
      motivos.push(
        motivo(MOTIVO_TIPO.MUNICIPIO_QUALQUER, 'Município', 'aceita qualquer município'),
      );
      pontuacao += PONTOS_QUALQUER;
    } else if (municipio) {
      const alvo = municipio.toLowerCase().trim();
      const aceita = comprador.municipiosAceitos.some((m) => m.toLowerCase().trim() === alvo);
      if (aceita) {
        motivos.push(motivo(MOTIVO_TIPO.MUNICIPIO_ACEITO, `${municipio}`, 'aceita explicitamente'));
        pontuacao += PONTOS_ESPECIFICO;
      } else {
        bloqueios.push(
          bloqueio(
            BLOQUEIO_TIPO.MUNICIPIO_NAO_ACEITO,
            `Não aceita ${municipio}`,
            `Aceita: ${comprador.municipiosAceitos.slice(0, 3).join(', ')}${comprador.municipiosAceitos.length > 3 ? '…' : ''}`,
          ),
        );
      }
    }
  }

  if (bloqueios.length > 0) {
    return { ok: false, bloqueios };
  }
  return { ok: true, pontuacao, motivos };
}
