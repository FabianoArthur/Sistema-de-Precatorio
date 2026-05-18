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
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type OcrStatus } from '@preca/shared';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAnexos, useDeleteAnexo, useReprocessarAnexo } from './hooks';
import type { AnexoSummary } from './types';
import { UploadZone } from './upload-zone';
import { ViewerDialog } from './viewer-dialog';

const STATUS_LABELS: Record<OcrStatus, string> = {
  NAO_PROCESSADO: 'Aguardando',
  PROCESSANDO: 'Processando...',
  EXTRAIDO: 'Extraído',
  FALHOU: 'Falhou',
};

const STATUS_COLORS: Record<OcrStatus, string> = {
  NAO_PROCESSADO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PROCESSANDO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 animate-pulse',
  EXTRAIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  FALHOU: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface AnexosTabProps {
  precatorioId: string;
}

export function AnexosTab({ precatorioId }: AnexosTabProps) {
  const [viewer, setViewer] = useState<AnexoSummary | null>(null);
  const deleteAnexo = useDeleteAnexo(precatorioId);
  const reprocessar = useReprocessarAnexo(precatorioId);

  const { data: anexos } = useAnexos(precatorioId);
  const lista = anexos ?? [];

  function onDelete(a: AnexoSummary) {
    confirmAction({
      title: `Excluir "${a.nome}"?`,
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        try {
          await deleteAnexo.mutateAsync(a.id);
        } catch (e) {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? 'Falha ao excluir');
        }
      },
    });
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <UploadZone precatorioId={precatorioId} />

        {lista.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Status OCR</TableHead>
                <TableHead>Parser</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="max-w-[300px] truncate font-medium">{a.nome}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded px-2 py-0.5 text-xs font-medium',
                        STATUS_COLORS[a.ocrStatus],
                      )}
                    >
                      {STATUS_LABELS[a.ocrStatus]}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs uppercase">
                    {a.dadosExtraidos?.parsedBy ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {formatarTamanho(a.tamanho)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(a.createdAt)}
                  </TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Visualizar"
                      onClick={() => setViewer(a)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Reprocessar OCR"
                      disabled={reprocessar.isPending || a.ocrStatus === 'PROCESSANDO'}
                      onClick={() => reprocessar.mutate(a.id)}
                    >
                      <RotateCcw size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Excluir"
                      onClick={() => onDelete(a)}
                      disabled={deleteAnexo.isPending}
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

      <ViewerDialog anexo={viewer} onClose={() => setViewer(null)} />
    </Card>
  );
}
