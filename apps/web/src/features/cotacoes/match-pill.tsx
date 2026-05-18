import { cn } from '@/lib/utils';
import {
  type BloqueioTipo,
  type MotivoBloqueio,
  type MotivoMatch,
  type MotivoTipo,
} from '@preca/shared';
import { Check, X } from 'lucide-react';

const MATCH_TONE: Record<MotivoTipo, 'strong' | 'soft'> = {
  SCORE_ACEITO: 'strong',
  SCORE_QUALQUER: 'soft',
  FEDERAL_OK: 'strong',
  UF_ACEITA: 'strong',
  UF_QUALQUER: 'soft',
  MUNICIPIO_ACEITO: 'strong',
  MUNICIPIO_QUALQUER: 'soft',
};

export function MatchPill({ motivo }: { motivo: MotivoMatch }) {
  const strong = MATCH_TONE[motivo.tipo] === 'strong';
  return (
    <span
      title={motivo.detalhe}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ring-1 transition-colors',
        strong
          ? 'bg-success-soft text-success ring-success/20'
          : 'bg-muted text-muted-foreground ring-border',
      )}
    >
      <Check size={11} className="shrink-0" />
      {motivo.label}
    </span>
  );
}

const BLOQUEIO_LABEL_CURTO: Record<BloqueioTipo, string> = {
  SCORE_NAO_ACEITO: 'Score',
  FEDERAL_NAO_ACEITO: 'Federal',
  UF_NAO_ACEITA: 'UF',
  MUNICIPIO_NAO_ACEITO: 'Município',
};

export function BloqueioPill({ bloqueio }: { bloqueio: MotivoBloqueio }) {
  return (
    <span
      title={`${bloqueio.label}${bloqueio.detalhe ? ` — ${bloqueio.detalhe}` : ''}`}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ring-1 bg-destructive-soft text-destructive ring-destructive/20"
    >
      <X size={11} className="shrink-0" />
      {BLOQUEIO_LABEL_CURTO[bloqueio.tipo]}
    </span>
  );
}
