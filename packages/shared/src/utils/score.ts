import { ScorePrecatorio } from '../enums';

const CEM_MIL = 100_000;
const UM_MILHAO = 1_000_000;
const CINCO_MILHOES = 5_000_000;

export function calcularScore(valor: number): ScorePrecatorio {
  if (valor > CINCO_MILHOES) return ScorePrecatorio.URGENTE;
  if (valor > UM_MILHAO) return ScorePrecatorio.AAA;
  if (valor > CEM_MIL) return ScorePrecatorio.AA;
  return ScorePrecatorio.MEDIO;
}
