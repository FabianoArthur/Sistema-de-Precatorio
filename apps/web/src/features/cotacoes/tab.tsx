import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { confirmAction } from '@/components/ui/confirm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBRL, formatDateTime } from '@/lib/format';
import { formatCnpj } from '@/lib/format-cnpj';
import { cn } from '@/lib/utils';
import { type StatusCotacao } from '@preca/shared';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EnviarCotacoesDialog } from './enviar-dialog';
import { useDeleteCotacao } from './hooks';
import { RecusarCotacaoDialog } from './recusar-dialog';
import { ResponderCotacaoDialog } from './responder-dialog';
import { SugestoesCard } from './sugestoes-card';
import type { CotacaoSummary } from './types';

const STATUS_STYLES: Record<StatusCotacao, string> = {
  PENDENTE: 'bg-warning-soft text-warning ring-warning/20',
  RECEBIDA: 'bg-success-soft text-success ring-success/20',
  RECUSADA: 'bg-destructive-soft text-destructive ring-destructive/20',
};

const STATUS_LABELS: Record<StatusCotacao, string> = {
  PENDENTE: 'Pendente',
  RECEBIDA: 'Recebida',
  RECUSADA: 'Recusada',
};

interface CotacoesTabProps {
  precatorioId: string;
  cotacoes: CotacaoSummary[];
}

export function CotacoesTab({ precatorioId, cotacoes }: CotacoesTabProps) {
  const [enviarOpen, setEnviarOpen] = useState(false);
  const [responder, setResponder] = useState<CotacaoSummary | null>(null);
  const [recusar, setRecusar] = useState<CotacaoSummary | null>(null);
  const deleteCotacao = useDeleteCotacao(precatorioId);

  function onDelete(c: CotacaoSummary) {
    confirmAction({
      title: `Excluir cotação de "${c.comprador.nome}"?`,
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        try {
          await deleteCotacao.mutateAsync(c.id);
        } catch (e) {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? 'Falha ao excluir');
        }
      },
    });
  }

  return (
    <div className="space-y-5">
      <SugestoesCard precatorioId={precatorioId} onOpenEnviarDialog={() => setEnviarOpen(true)} />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Cotações solicitadas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cotacoes.length === 0
                  ? 'Nenhuma cotação ainda — comece pelos sugeridos acima.'
                  : `${cotacoes.length} cotação(ões) · ordenadas por maior valor bruto`}
              </p>
            </div>
            <Button size="sm" onClick={() => setEnviarOpen(true)}>
              <Plus size={14} />
              Solicitar cotações
            </Button>
          </div>

          {cotacoes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor bruto</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Data resposta</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotacoes.map((c) => (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <div className="font-medium">{c.comprador.nome}</div>
                      <div className="text-2xs text-muted-foreground font-mono">
                        {formatCnpj(c.comprador.cnpj)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ring-1',
                          STATUS_STYLES[c.status],
                        )}
                      >
                        {STATUS_LABELS[c.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatBRL(c.valorBruto)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(c.comissao)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.dataResposta ? formatDateTime(c.dataResposta) : '—'}
                    </TableCell>
                    <TableCell className="flex gap-0.5 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Registrar resposta"
                        onClick={() => setResponder(c)}
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Marcar como recusada"
                        onClick={() => setRecusar(c)}
                      >
                        <X size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Excluir"
                        onClick={() => onDelete(c)}
                        disabled={deleteCotacao.isPending}
                        className="hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EnviarCotacoesDialog
        open={enviarOpen}
        onClose={() => setEnviarOpen(false)}
        precatorioId={precatorioId}
      />
      <ResponderCotacaoDialog
        open={responder !== null}
        onClose={() => setResponder(null)}
        precatorioId={precatorioId}
        cotacao={responder}
      />
      <RecusarCotacaoDialog
        open={recusar !== null}
        onClose={() => setRecusar(null)}
        precatorioId={precatorioId}
        cotacao={recusar}
      />
    </div>
  );
}
