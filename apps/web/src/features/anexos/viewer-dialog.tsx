import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { formatBRL, formatDate } from '@/lib/format';
import type { DadosExtraidos } from '@preca/shared';
import { useEffect, useState } from 'react';
import { anexosApi } from './api';
import type { AnexoSummary } from './types';

interface ViewerDialogProps {
  anexo: AnexoSummary | null;
  onClose: () => void;
}

export function ViewerDialog({ anexo, onClose }: ViewerDialogProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!anexo) {
      setBlobUrl(null);
      return;
    }
    let cancelled = false;
    let urlAtual: string | null = null;
    setLoading(true);
    anexosApi
      .downloadBlobUrl(anexo.id)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        urlAtual = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (urlAtual) URL.revokeObjectURL(urlAtual);
    };
  }, [anexo]);

  if (!anexo) return null;
  const dados = anexo.dadosExtraidos;

  return (
    <Dialog open onClose={onClose} title={anexo.nome} className="max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[70vh]">
        <div className="border rounded overflow-hidden bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Carregando PDF...
            </div>
          ) : blobUrl ? (
            <iframe src={blobUrl} title={anexo.nome} className="w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Não foi possível carregar o PDF.
            </div>
          )}
        </div>
        <div className="overflow-y-auto space-y-3">
          <h3 className="font-medium text-sm">Dados extraídos</h3>
          {!dados ? (
            <p className="text-sm text-muted-foreground">OCR ainda não processado.</p>
          ) : dados.erro ? (
            <div className="text-sm text-destructive">
              <strong>Falhou:</strong> {dados.erro}
            </div>
          ) : (
            <DadosCard dados={dados} />
          )}
          {dados?.textoBruto && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Texto bruto (primeiros 2000 chars)</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono">{dados.textoBruto}</pre>
            </details>
          )}
        </div>
      </div>
      <div className="flex justify-end pt-4 mt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Dialog>
  );
}

function DadosCard({ dados }: { dados: DadosExtraidos }) {
  return (
    <dl className="grid grid-cols-1 gap-2 text-sm">
      <Linha label="Parser" value={dados.parsedBy?.toUpperCase()} />
      <Linha label="Nº precatório" value={dados.numeroPrecatorio} />
      <Linha label="Nº processo" value={dados.numeroProcesso} />
      <Linha label="Tribunal" value={dados.tribunal} />
      <Linha label="Vara" value={dados.vara} />
      <Linha label="Devedor" value={dados.devedor} />
      <Linha label="Data de expedição" value={formatDate(dados.dataExpedicao)} />
      <Linha label="Valor original" value={formatBRL(dados.valorOriginal)} />
      <Linha label="Valor atualizado" value={formatBRL(dados.valorAtualizado)} />
    </dl>
  );
}

function Linha({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border/40 py-1">
      <dt className="text-muted-foreground text-xs uppercase">{label}</dt>
      <dd className="col-span-2">
        {value !== null && value !== undefined && value !== '' && value !== '—' ? (
          value
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </dd>
    </div>
  );
}
