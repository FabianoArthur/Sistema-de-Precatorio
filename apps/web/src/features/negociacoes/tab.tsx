import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { confirmAction } from '@/components/ui/confirm';
import { formatBRL, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type OrigemNegociacao } from '@preca/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteNegociacao } from './hooks';
import { NovaPropostaDialog } from './nova-proposta-dialog';
import type { NegociacaoSummary } from './types';

const ORIGEM_LABELS: Record<OrigemNegociacao, string> = {
  NOSSA: 'Nossa proposta',
  CEDENTE: 'Contraproposta do cedente',
};

const ORIGEM_COLORS: Record<OrigemNegociacao, string> = {
  NOSSA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300',
  CEDENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300',
};

interface NegociacoesTabProps {
  precatorioId: string;
  negociacoes: NegociacaoSummary[];
}

export function NegociacoesTab({ precatorioId, negociacoes }: NegociacoesTabProps) {
  const [novaOpen, setNovaOpen] = useState(false);
  const deleteNeg = useDeleteNegociacao(precatorioId);

  function onDelete(n: NegociacaoSummary) {
    confirmAction({
      title: `Excluir proposta de ${formatBRL(n.valor)}?`,
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        try {
          await deleteNeg.mutateAsync(n.id);
        } catch (e) {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? 'Falha ao excluir');
        }
      },
    });
  }

  const ordenadas = [...negociacoes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {negociacoes.length === 0
              ? 'Nenhuma proposta registrada.'
              : `${negociacoes.length} entrada(s) na thread.`}
          </p>
          <Button size="sm" onClick={() => setNovaOpen(true)}>
            <Plus size={14} />
            Nova proposta
          </Button>
        </div>

        {ordenadas.length > 0 && (
          <ol className="space-y-3">
            {ordenadas.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'rounded-lg border p-3 flex items-start justify-between gap-3',
                  ORIGEM_COLORS[n.origem],
                )}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {ORIGEM_LABELS[n.origem]}
                    </span>
                    <span className="text-base font-semibold tabular-nums">
                      {formatBRL(n.valor)}
                    </span>
                  </div>
                  {n.observacao && (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{n.observacao}</p>
                  )}
                  <div className="text-xs text-foreground/60">
                    {formatDateTime(n.createdAt)} · {n.createdBy.nome}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(n)}
                  disabled={deleteNeg.isPending}
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </CardContent>

      <NovaPropostaDialog
        open={novaOpen}
        onClose={() => setNovaOpen(false)}
        precatorioId={precatorioId}
      />
    </Card>
  );
}
