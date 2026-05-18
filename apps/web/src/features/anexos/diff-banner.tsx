import { Button } from '@/components/ui/button';
import { formatBRL, formatDate } from '@/lib/format';
import type { CampoAplicavel } from '@preca/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { PrecatorioDetail } from '../precatorios/types';
import { type Divergencia, computarDivergencias } from './diff';
import { useAplicarValor } from './hooks';
import type { AnexoSummary } from './types';

interface DiffBannerProps {
  precatorio: PrecatorioDetail;
  anexos: AnexoSummary[];
}

const CAMPOS_VALOR: Array<Divergencia['campo']> = ['valorOriginal', 'valorAtualizado'];
const CAMPOS_DATA: Array<Divergencia['campo']> = ['dataExpedicao'];

function formatar(campo: Divergencia['campo'], v: unknown) {
  if (v === null || v === undefined || v === '') return '—';
  if (CAMPOS_VALOR.includes(campo)) return formatBRL(v as string | number);
  if (CAMPOS_DATA.includes(campo)) return formatDate(v as string);
  return String(v);
}

export function DiffBanner({ precatorio, anexos }: DiffBannerProps) {
  const aplicar = useAplicarValor(precatorio.id);

  const anexosExtraidos = anexos.filter((a) => a.ocrStatus === 'EXTRAIDO' && a.dadosExtraidos);
  if (anexosExtraidos.length === 0) return null;

  const anexo = anexosExtraidos[0];
  const divergencias = computarDivergencias(precatorio, anexo.dadosExtraidos);
  if (divergencias.length === 0) return null;

  async function onAplicar(d: Divergencia) {
    if (!d.podeAplicar) return;
    try {
      await aplicar.mutateAsync({
        id: anexo.id,
        data: { campo: d.campo as CampoAplicavel },
      });
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Falha ao aplicar valor');
    }
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-medium text-sm">
              {divergencias.length} diverg{divergencias.length === 1 ? 'ência' : 'ências'} entre OCR
              e cadastro
            </h3>
            <p className="text-xs text-muted-foreground">
              Anexo "{anexo.nome}" extraiu dados diferentes do cadastrado.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm">
            {divergencias.map((d) => (
              <li
                key={d.campo}
                className="flex flex-wrap items-center gap-2 rounded border border-amber-200 dark:border-amber-800 bg-background px-2 py-1.5"
              >
                <span className="text-xs uppercase text-muted-foreground min-w-[110px]">
                  {d.label}
                </span>
                <span className="text-xs">
                  atual: <strong>{formatar(d.campo, d.valorAtual)}</strong>
                </span>
                <span className="text-xs">→</span>
                <span className="text-xs">
                  OCR: <strong>{formatar(d.campo, d.valorExtraido)}</strong>
                </span>
                {d.podeAplicar && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => onAplicar(d)}
                    disabled={aplicar.isPending}
                  >
                    Aplicar OCR
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
