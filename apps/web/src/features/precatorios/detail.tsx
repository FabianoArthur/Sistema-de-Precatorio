import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DiffBanner } from '@/features/anexos/diff-banner';
import { useAnexos } from '@/features/anexos/hooks';
import { AnexosTab } from '@/features/anexos/tab';
import { CotacoesTab } from '@/features/cotacoes/tab';
import { NegociacoesTab } from '@/features/negociacoes/tab';
import { daysSince, formatBRL, formatDate, formatDateTime } from '@/lib/format';
import { SCORE_STYLES } from '@/lib/precatorio-styles';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ESTAGIO_LABELS,
  EstagioPrecatorio,
  type MudarEstagioInput,
  NATUREZA_LABELS,
  SCORE_LABELS,
  TIPO_LABELS,
  mudarEstagioSchema,
} from '@preca/shared';
import { ArrowLeft, Clock, Pencil, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { useMudarEstagio, usePrecatorio } from './hooks';

const TABS = ['dados', 'cotacoes', 'negociacoes', 'anexos', 'historico'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  dados: 'Dados',
  cotacoes: 'Cotações',
  negociacoes: 'Negociações',
  anexos: 'Anexos',
  historico: 'Histórico',
};

export function PrecatorioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: p, isLoading } = usePrecatorio(id);
  const { data: anexos } = useAnexos(id ?? '');
  const [tab, setTab] = useState<Tab>('dados');
  const [stageDialog, setStageDialog] = useState(false);

  if (isLoading)
    return <div className="p-10 text-muted-foreground animate-pulse">Carregando...</div>;
  if (!p) return <div className="p-10 text-muted-foreground">Precatório não encontrado.</div>;

  const valorEfetivo = p.valorAtualizado ?? p.valorOriginal;
  const diasNoEstagio = daysSince(p.estagioDesde);
  const devedor =
    p.devedorTipo === 'FEDERAL'
      ? 'União'
      : p.devedorTipo === 'ESTADUAL'
        ? `Estado · ${p.devedorUf}`
        : `Município · ${p.devedorMunicipio}/${p.devedorUf}`;

  return (
    <div className="p-8 lg:p-10 max-w-6xl space-y-6 animate-fade-in">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link to="/precatorios">
          <ArrowLeft size={14} />
          Voltar para Precatórios
        </Link>
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-gradient-to-br from-card via-card to-primary-soft/40 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-semibold uppercase tracking-wider text-primary">
                  Precatório
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ring-1',
                    SCORE_STYLES[p.score],
                  )}
                >
                  {SCORE_LABELS[p.score]}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight font-display tabular-nums">
                {p.numeroPrecatorio ?? p.numeroProcesso ?? '(sem nº)'}
              </h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{p.cedente.nome}</span>
                <span className="mx-1.5">·</span>
                {devedor}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={`/precatorios/${p.id}/editar`}>
                <Pencil size={14} />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="grid grid-cols-2 gap-6 px-6 py-5 md:grid-cols-4 pt-5">
          <SummaryItem
            label="Valor efetivo"
            value={formatBRL(valorEfetivo)}
            valueClass="text-2xl font-semibold tracking-tight tabular-nums font-display"
          />
          <SummaryItem
            label="Natureza"
            value={NATUREZA_LABELS[p.devedorTipo]}
            valueClass="text-base font-medium"
          />
          <SummaryItem
            label="Estágio atual"
            valueNode={
              <div className="space-y-0.5">
                <div className="text-base font-medium leading-tight">
                  {ESTAGIO_LABELS[p.estagioAtual]}
                </div>
                <div className="text-2xs text-muted-foreground inline-flex items-center gap-1">
                  <Clock size={11} />
                  há {diasNoEstagio} dia(s)
                </div>
              </div>
            }
          />
          <div className="flex items-end">
            <Button onClick={() => setStageDialog(true)} className="w-full">
              <ShieldCheck size={14} />
              Mudar estágio
            </Button>
          </div>
        </CardContent>
      </Card>

      {anexos && anexos.length > 0 && <DiffBanner precatorio={p} anexos={anexos} />}

      {/* Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const count =
            t === 'cotacoes'
              ? p.cotacoes.length
              : t === 'negociacoes'
                ? p.negociacoes.length
                : t === 'anexos'
                  ? (anexos?.length ?? 0)
                  : null;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                tab === t ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {TAB_LABELS[t]}
              {count !== null && count > 0 && (
                <span
                  className={cn(
                    'ml-1.5 inline-flex items-center justify-center min-w-[18px] rounded-full px-1.5 py-0.5 text-2xs font-semibold',
                    tab === t
                      ? 'bg-primary-soft text-primary-strong'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
              {tab === t && (
                <span
                  className="absolute -bottom-px left-2 right-2 h-0.5 rounded-t-full bg-primary"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {tab === 'dados' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Section title="Identificação">
            <Field label="Nº precatório" value={p.numeroPrecatorio} />
            <Field label="Nº processo" value={p.numeroProcesso} />
            <Field label="Cedente" value={p.cedente.nome} />
            <Field label="Documento cedente" value={p.cedente.documento} />
            <Field label="Escritório/advogado" value={p.escritorioAdvogado} colSpan={2} />
          </Section>

          <Section title="Devedor & tipo">
            <Field label="Natureza" value={NATUREZA_LABELS[p.devedorTipo]} />
            <Field label="Tipo" value={TIPO_LABELS[p.tipo]} />
            <Field label="Devedor" value={devedor} colSpan={2} />
          </Section>

          <Section title="Valores">
            <Field label="Valor original" value={formatBRL(p.valorOriginal)} mono />
            <Field label="Valor atualizado" value={formatBRL(p.valorAtualizado)} mono />
            <Field label="Deságio" value={formatBRL(p.desagio)} mono />
            <Field label="Valor líquido" value={formatBRL(p.valorLiquido)} mono />
          </Section>

          <Section title="Processual">
            <Field label="Tribunal" value={p.tribunal} />
            <Field label="Vara" value={p.vara} />
            <Field label="Data de expedição" value={formatDate(p.dataExpedicao)} />
            <Field label="Data de requisição" value={formatDate(p.dataRequisicao)} />
            <Field label="Prazo estimado" value={formatDate(p.prazoEstimado)} colSpan={2} />
          </Section>

          <Section title="Parceiro & comissão" className="lg:col-span-2">
            <Field label="Parceiro" value={p.parceiro?.nome} />
            <Field label="Chave PIX parceiro" value={p.parceiro?.chavePix} />
            <Field label="Comissão total" value={formatBRL(p.comissaoTotal)} mono />
            <Field label="Comissão parceiro" value={formatBRL(p.comissaoParceiro)} mono />
          </Section>
        </div>
      )}

      {tab === 'cotacoes' && <CotacoesTab precatorioId={p.id} cotacoes={p.cotacoes} />}
      {tab === 'negociacoes' && <NegociacoesTab precatorioId={p.id} negociacoes={p.negociacoes} />}
      {tab === 'anexos' && <AnexosTab precatorioId={p.id} />}

      {tab === 'historico' && (
        <Card>
          <CardContent className="pt-5">
            {p.historico.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma movimentação registrada.</p>
            ) : (
              <ol className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                {p.historico.map((h) => (
                  <li key={h.id} className="relative pl-7">
                    <span
                      className="absolute left-0 top-1.5 size-3.5 rounded-full bg-card border-2 border-primary"
                      aria-hidden
                    />
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {h.estagioAnterior ? `${ESTAGIO_LABELS[h.estagioAnterior]} ` : 'Criado em '}
                      </span>
                      {h.estagioAnterior && <span className="text-muted-foreground">→ </span>}
                      <span className="font-medium text-foreground">
                        {ESTAGIO_LABELS[h.estagioNovo]}
                      </span>
                    </div>
                    <div className="text-2xs text-muted-foreground mt-0.5 tabular-nums">
                      {formatDateTime(h.createdAt)} · {h.user.nome}
                    </div>
                    {h.observacao && (
                      <div className="text-xs mt-1 text-foreground/80 italic">{h.observacao}</div>
                    )}
                  </li>
                ))}
              </ol>
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

function Section({
  title,
  children,
  className,
}: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  valueNode,
  mono,
  colSpan,
}: {
  label: string;
  value?: string | null;
  valueNode?: React.ReactNode;
  mono?: boolean;
  colSpan?: 2;
}) {
  return (
    <div className={cn(colSpan === 2 && 'col-span-2')}>
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className={cn('text-foreground', mono && 'tabular-nums')}>
        {valueNode ??
          (value && value !== '—' ? value : <span className="text-muted-foreground">—</span>)}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  valueNode,
  valueClass,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </div>
      {valueNode ?? <div className={valueClass}>{value}</div>}
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
    <Dialog
      open={open}
      onClose={onClose}
      title="Mudar estágio"
      description="Avança ou volta o precatório no fluxo. A mudança fica registrada no histórico."
    >
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
          <Textarea
            id="observacao"
            rows={3}
            placeholder="Motivo, contexto ou próximos passos…"
            {...register('observacao')}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
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
