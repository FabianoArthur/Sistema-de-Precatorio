import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { daysSince, formatBRL, formatDate, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ESTAGIO_LABELS,
  EstagioPrecatorio,
  type MudarEstagioInput,
  SCORE_LABELS,
  type ScorePrecatorio,
  TIPO_LABELS,
  mudarEstagioSchema,
} from '@preca/shared';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { useMudarEstagio, usePrecatorio } from './hooks';

const SCORE_COLORS: Record<ScorePrecatorio, string> = {
  MEDIO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  AA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  AAA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  URGENTE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const TABS = ['dados', 'historico'] as const;
type Tab = (typeof TABS)[number];

export function PrecatorioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: p, isLoading } = usePrecatorio(id);
  const [tab, setTab] = useState<Tab>('dados');
  const [stageDialog, setStageDialog] = useState(false);

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!p) return <div className="p-8 text-muted-foreground">Precatório não encontrado.</div>;

  const valorEfetivo = p.valorAtualizado ?? p.valorOriginal;
  const diasNoEstagio = daysSince(p.estagioDesde);
  const devedor =
    p.devedorTipo === 'FEDERAL'
      ? 'União'
      : p.devedorTipo === 'ESTADUAL'
        ? `Estado · ${p.devedorUf}`
        : `Município · ${p.devedorMunicipio}/${p.devedorUf}`;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost">
            <Link to="/precatorios">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {p.numeroPrecatorio ?? p.numeroProcesso ?? '(sem nº)'}
            </h1>
            <p className="text-sm text-muted-foreground">{p.cedente.nome}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to={`/precatorios/${p.id}/editar`}>
            <Pencil size={14} />
            Editar
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Valor</div>
            <div className="font-medium">{formatBRL(valorEfetivo)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Score</div>
            <span
              className={cn(
                'inline-flex rounded px-2 py-0.5 text-sm font-medium',
                SCORE_COLORS[p.score],
              )}
            >
              {SCORE_LABELS[p.score]}
            </span>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Estágio</div>
            <div className="font-medium">{ESTAGIO_LABELS[p.estagioAtual]}</div>
            <div className="text-xs text-muted-foreground">há {diasNoEstagio} dia(s)</div>
          </div>
          <div className="flex items-end">
            <Button onClick={() => setStageDialog(true)} className="w-full">
              Mudar estágio
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex border-b border-border gap-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-1 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'dados' ? 'Dados' : 'Histórico'}
          </button>
        ))}
      </div>

      {tab === 'dados' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Nº precatório" value={p.numeroPrecatorio} />
              <Field label="Nº processo" value={p.numeroProcesso} />
              <Field label="Cedente" value={p.cedente.nome} />
              <Field label="Documento cedente" value={p.cedente.documento} />
              <Field label="Escritório/advogado" value={p.escritorioAdvogado} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Devedor & tipo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Natureza" value={p.devedorTipo} />
              <Field label="Devedor" value={devedor} />
              <Field label="Tipo" value={TIPO_LABELS[p.tipo]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Valor original" value={formatBRL(p.valorOriginal)} />
              <Field label="Valor atualizado" value={formatBRL(p.valorAtualizado)} />
              <Field label="Deságio" value={formatBRL(p.desagio)} />
              <Field label="Valor líquido" value={formatBRL(p.valorLiquido)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processual</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Tribunal" value={p.tribunal} />
              <Field label="Vara" value={p.vara} />
              <Field label="Data de expedição" value={formatDate(p.dataExpedicao)} />
              <Field label="Data de requisição" value={formatDate(p.dataRequisicao)} />
              <Field label="Prazo estimado" value={formatDate(p.prazoEstimado)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parceiro & comissão</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Parceiro" value={p.parceiro?.nome} />
              <Field label="Chave PIX parceiro" value={p.parceiro?.chavePix} />
              <Field label="Comissão total" value={formatBRL(p.comissaoTotal)} />
              <Field label="Comissão parceiro" value={formatBRL(p.comissaoParceiro)} />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'historico' && (
        <Card>
          <CardContent className="pt-6">
            {p.historico.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma movimentação registrada.</p>
            ) : (
              <ul className="space-y-3">
                {p.historico.map((h) => (
                  <li key={h.id} className="border-l-2 border-border pl-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {h.estagioAnterior
                          ? `${ESTAGIO_LABELS[h.estagioAnterior]} → `
                          : 'Criado em '}
                      </span>
                      <span className="font-medium">{ESTAGIO_LABELS[h.estagioNovo]}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(h.createdAt)} · {h.user.nome}
                    </div>
                    {h.observacao && <div className="text-xs mt-1 italic">{h.observacao}</div>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <MudarEstagioDialog
        open={stageDialog}
        onClose={() => setStageDialog(false)}
        precatorioId={p.id}
        estagioAtual={p.estagioAtual}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div>{value && value !== '—' ? value : <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function MudarEstagioDialog({
  open,
  onClose,
  precatorioId,
  estagioAtual,
}: {
  open: boolean;
  onClose: () => void;
  precatorioId: string;
  estagioAtual: EstagioPrecatorio;
}) {
  const mudar = useMudarEstagio(precatorioId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MudarEstagioInput>({
    resolver: zodResolver(mudarEstagioSchema),
    defaultValues: { novoEstagio: estagioAtual, observacao: '' },
  });

  async function onSubmit(data: MudarEstagioInput) {
    try {
      await mudar.mutateAsync(data);
      reset();
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao mudar estágio');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Mudar estágio">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="novoEstagio">Novo estágio</Label>
          <Select id="novoEstagio" {...register('novoEstagio')}>
            {Object.values(EstagioPrecatorio).map((s) => (
              <option key={s} value={s}>
                {ESTAGIO_LABELS[s]} {s === estagioAtual ? '(atual)' : ''}
              </option>
            ))}
          </Select>
          {errors.novoEstagio && (
            <p className="text-xs text-destructive">{errors.novoEstagio.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="observacao">Observação (opcional)</Label>
          <Textarea id="observacao" rows={3} {...register('observacao')} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
