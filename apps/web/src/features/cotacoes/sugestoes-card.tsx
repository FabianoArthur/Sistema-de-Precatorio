import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useCompradoresSugeridos, useEnviarCotacoes } from './hooks';
import { MatchPill } from './match-pill';
import type { CompradorSugerido } from './types';

interface SugestoesCardProps {
  precatorioId: string;
  onOpenEnviarDialog: () => void;
}

const TOP_LIMIT = 4;

export function SugestoesCard({ precatorioId, onOpenEnviarDialog }: SugestoesCardProps) {
  const { data, isLoading } = useCompradoresSugeridos(precatorioId);
  const enviar = useEnviarCotacoes(precatorioId);
  const [expandido, setExpandido] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  if (isLoading || !data) return null;
  if (data.sugeridos.length === 0) return null;

  const total = data.sugeridos.length;
  const visiveis = expandido ? data.sugeridos : data.sugeridos.slice(0, TOP_LIMIT);
  const sobrando = total - visiveis.length;

  async function enviarIndividual(compradorId: string) {
    setEnviandoId(compradorId);
    try {
      await enviar.mutateAsync({ compradorIds: [compradorId] });
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao solicitar cotação');
    } finally {
      setEnviandoId(null);
    }
  }

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary-soft/30 via-card to-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
              <Sparkles size={16} />
            </span>
            <div>
              <CardTitle className="flex items-center gap-2">
                Compradores sugeridos
                <span className="inline-flex items-center rounded-full bg-primary-soft text-primary-strong px-2 py-0.5 text-2xs font-semibold">
                  {total}
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Estes compradores aceitam a natureza, score e localização deste precatório.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onOpenEnviarDialog}>
            Solicitar em lote
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {visiveis.map((s) => (
          <SugestaoLinha
            key={s.comprador.id}
            sugerido={s}
            enviando={enviandoId === s.comprador.id}
            disabled={enviar.isPending && enviandoId !== s.comprador.id}
            onEnviar={() => enviarIndividual(s.comprador.id)}
          />
        ))}

        {sobrando > 0 && (
          <button
            type="button"
            onClick={() => setExpandido(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown size={14} />
            Mostrar mais {sobrando} sugerido(s)
          </button>
        )}
        {expandido && total > TOP_LIMIT && (
          <button
            type="button"
            onClick={() => setExpandido(false)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp size={14} />
            Mostrar menos
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function SugestaoLinha({
  sugerido,
  enviando,
  disabled,
  onEnviar,
}: {
  sugerido: CompradorSugerido;
  enviando: boolean;
  disabled: boolean;
  onEnviar: () => void;
}) {
  const { comprador, motivos, pontuacao } = sugerido;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-shadow',
        'hover:shadow-soft',
      )}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{comprador.nome}</span>
          <span className="text-2xs font-mono text-muted-foreground">{comprador.cnpj}</span>
          <PontuacaoBadge pontuacao={pontuacao} />
        </div>
        <div className="flex flex-wrap gap-1">
          {motivos.map((m) => (
            <MatchPill key={`${comprador.id}-${m.tipo}-${m.label}`} motivo={m} />
          ))}
        </div>
      </div>
      <Button size="sm" onClick={onEnviar} disabled={disabled || enviando}>
        <Send size={13} />
        {enviando ? 'Enviando...' : 'Cotar'}
      </Button>
    </div>
  );
}

function PontuacaoBadge({ pontuacao }: { pontuacao: number }) {
  const max = 120;
  const pct = Math.min(100, Math.round((pontuacao / max) * 100));
  const tone =
    pct >= 75
      ? 'bg-success-soft text-success ring-success/20'
      : pct >= 50
        ? 'bg-primary-soft text-primary-strong ring-primary/20'
        : 'bg-muted text-muted-foreground ring-border';
  return (
    <span
      title={`Especificidade do match: ${pct}%`}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ring-1',
        tone,
      )}
    >
      {pct}% match
    </span>
  );
}
