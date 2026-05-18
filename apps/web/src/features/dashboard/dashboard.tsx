import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBRL, formatDate } from '@/lib/format';
import { ESTAGIO_DOT } from '@/lib/precatorio-styles';
import { cn } from '@/lib/utils';
import { ESTAGIO_LABELS } from '@preca/shared';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  FileWarning,
  type LucideIcon,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from './hooks';

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl">
        <SkeletonDashboard />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl">
        <div className="rounded-xl border border-destructive/30 bg-destructive-soft p-6 text-sm text-destructive">
          Falha ao carregar dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl animate-fade-in">
      <header className="space-y-1">
        <p className="text-2xs font-semibold uppercase tracking-wider text-primary">Visão geral</p>
        <h1 className="text-3xl font-semibold tracking-tight font-display">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline em tempo real, alertas e indicadores principais.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          tone="primary"
          label="Pipeline ativo"
          valor={formatBRL(data.kpis.pipelineTotal.valor)}
          sub={`${data.kpis.pipelineTotal.quantidade} precatório(s) em andamento`}
        />
        <KpiCard
          icon={CheckCircle2}
          tone="success"
          label="Concluídos no mês"
          valor={formatBRL(data.kpis.concluidosMesAtual.valor)}
          sub={`${data.kpis.concluidosMesAtual.quantidade} fechamento(s)`}
        />
        <KpiCard
          icon={FileText}
          tone="warning"
          label="Cotações pendentes"
          valor={String(data.kpis.cotacoesPendentes)}
          sub="aguardando resposta"
        />
        <KpiCard
          icon={FileWarning}
          tone="neutral"
          label="OCR pendente"
          valor={String(data.kpis.anexosOcrPendentes)}
          sub={`Perdidos no mês: ${data.kpis.perdidosMesAtual.quantidade}`}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between">
            <CardTitle>Pipeline por estágio</CardTitle>
            <span className="text-xs text-muted-foreground">clique em um estágio para filtrar</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.cards.map((c) => (
              <Link
                key={c.estagio}
                to={`/precatorios?estagioAtual=${c.estagio}`}
                className="group relative rounded-lg border border-border bg-card-muted/50 p-4 transition-all hover:border-primary/40 hover:bg-card hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn('size-2 rounded-full shrink-0', ESTAGIO_DOT[c.estagio])}
                      aria-hidden
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {ESTAGIO_LABELS[c.estagio]}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="text-muted-foreground/0 group-hover:text-primary transition-colors shrink-0"
                  />
                </div>
                <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight font-display">
                  {c.quantidade}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {formatBRL(c.valorTotal)}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-warning-soft text-warning">
                <AlertTriangle size={14} />
              </span>
              <CardTitle>
                Alertas SLA
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  parados há mais de {data.slaConfigurado} dia(s)
                </span>
              </CardTitle>
            </div>
            {data.alertasSla.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-warning-soft text-warning px-2 py-0.5 text-2xs font-semibold uppercase">
                {data.alertasSla.length} alerta(s)
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {data.alertasSla.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-soft">
                <CheckCircle2 size={18} className="text-success" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum precatório fora do SLA. Tudo em dia.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Precatório</TableHead>
                  <TableHead>Cedente</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.alertasSla.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link
                        to={`/precatorios/${a.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {a.numeroPrecatorio ?? a.numeroProcesso ?? '(sem nº)'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.cedenteNome}</TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn('size-1.5 rounded-full', ESTAGIO_DOT[a.estagioAtual])}
                          aria-hidden
                        />
                        {ESTAGIO_LABELS[a.estagioAtual]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold',
                          a.diasParado > data.slaConfigurado * 2
                            ? 'bg-destructive-soft text-destructive'
                            : 'bg-warning-soft text-warning',
                        )}
                      >
                        {a.diasParado}d
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatBRL(a.valorEfetivo)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(a.estagioDesde)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type KpiTone = 'primary' | 'success' | 'warning' | 'neutral';
const TONE_STYLES: Record<KpiTone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  neutral: 'bg-muted text-muted-foreground',
};

function KpiCard({
  icon: Icon,
  tone,
  label,
  valor,
  sub,
}: {
  icon: LucideIcon;
  tone: KpiTone;
  label: string;
  valor: string;
  sub: string;
}) {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg',
            TONE_STYLES[tone],
          )}
          aria-hidden
        >
          <Icon size={15} />
        </span>
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums font-display">
          {valor}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </div>
    </Card>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-3 w-72 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['kpi-1', 'kpi-2', 'kpi-3', 'kpi-4'].map((k) => (
          <div key={k} className="h-28 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border bg-card" />
    </div>
  );
}
