import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { confirmAction } from '@/components/ui/confirm';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { daysSince, formatBRL } from '@/lib/format';
import { ESTAGIO_DOT, SCORE_STYLES } from '@/lib/precatorio-styles';
import { cn } from '@/lib/utils';
import {
  ESTAGIO_LABELS,
  EstagioPrecatorio,
  NATUREZA_LABELS,
  NaturezaPrecatorio,
  type PrecatorioFilters,
  SCORE_LABELS,
  ScorePrecatorio,
  TIPO_LABELS,
  TipoPrecatorio,
} from '@preca/shared';
import { Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useDeletePrecatorio, usePrecatorios } from './hooks';

export function PrecatoriosListPage() {
  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      estagioAtual: parseAsStringEnum(Object.values(EstagioPrecatorio)).withDefault(
        '' as EstagioPrecatorio,
      ),
      devedorTipo: parseAsStringEnum(Object.values(NaturezaPrecatorio)).withDefault(
        '' as NaturezaPrecatorio,
      ),
      tipo: parseAsStringEnum(Object.values(TipoPrecatorio)).withDefault('' as TipoPrecatorio),
      score: parseAsStringEnum(Object.values(ScorePrecatorio)).withDefault('' as ScorePrecatorio),
    },
    { history: 'replace' },
  );

  const apiFilters: PrecatorioFilters = {
    ...(filters.search && { search: filters.search }),
    ...(filters.estagioAtual && { estagioAtual: filters.estagioAtual }),
    ...(filters.devedorTipo && { devedorTipo: filters.devedorTipo }),
    ...(filters.tipo && { tipo: filters.tipo }),
    ...(filters.score && { score: filters.score }),
  };

  const { data: precatorios, isLoading } = usePrecatorios(apiFilters);
  const remove = useDeletePrecatorio();

  const hasFilters = Object.values(filters).some((v) => v && v !== '');

  function onDelete(id: string, label: string) {
    confirmAction({
      title: `Excluir precatório "${label}"?`,
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        try {
          await remove.mutateAsync(id);
        } catch (e) {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
          toast.error(msg ?? 'Falha ao excluir');
        }
      },
    });
  }

  function clearFilters() {
    setFilters({
      search: '',
      estagioAtual: '' as EstagioPrecatorio,
      devedorTipo: '' as NaturezaPrecatorio,
      tipo: '' as TipoPrecatorio,
      score: '' as ScorePrecatorio,
    });
  }

  return (
    <div className="p-8 lg:p-10 max-w-[1400px] space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary">Pipeline</p>
          <h1 className="text-3xl font-semibold tracking-tight font-display">Precatórios</h1>
          <p className="text-sm text-muted-foreground">
            {precatorios?.length ?? 0} resultado(s){hasFilters && ' · filtros aplicados'}
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/precatorios/novo">
            <Plus size={16} />
            Novo precatório
          </Link>
        </Button>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Buscar por nº de precatório ou processo..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.estagioAtual}
            onChange={(e) => setFilters({ estagioAtual: e.target.value as EstagioPrecatorio })}
          >
            <option value="">Todos estágios</option>
            {Object.values(EstagioPrecatorio).map((s) => (
              <option key={s} value={s}>
                {ESTAGIO_LABELS[s]}
              </option>
            ))}
          </Select>
          <Select
            value={filters.devedorTipo}
            onChange={(e) => setFilters({ devedorTipo: e.target.value as NaturezaPrecatorio })}
          >
            <option value="">Todas naturezas</option>
            {Object.values(NaturezaPrecatorio).map((n) => (
              <option key={n} value={n}>
                {NATUREZA_LABELS[n]}
              </option>
            ))}
          </Select>
          <Select
            value={filters.tipo}
            onChange={(e) => setFilters({ tipo: e.target.value as TipoPrecatorio })}
          >
            <option value="">Todos tipos</option>
            {Object.values(TipoPrecatorio).map((t) => (
              <option key={t} value={t}>
                {TIPO_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select
            value={filters.score}
            onChange={(e) => setFilters({ score: e.target.value as ScorePrecatorio })}
          >
            <option value="">Todos scores</option>
            {Object.values(ScorePrecatorio).map((s) => (
              <option key={s} value={s}>
                {SCORE_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <div className="flex justify-end mt-3 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} />
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>

      {isLoading ? (
        <Card className="p-10 text-center text-muted-foreground animate-pulse">Carregando...</Card>
      ) : !precatorios || precatorios.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? 'Nenhum precatório encontrado para os filtros aplicados.'
              : 'Nenhum precatório cadastrado ainda.'}
          </p>
          {!hasFilters && (
            <Button asChild className="mt-4" size="sm">
              <Link to="/precatorios/novo">
                <Plus size={14} />
                Criar primeiro precatório
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cedente</TableHead>
                <TableHead>Devedor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead className="text-right">Dias</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {precatorios.map((p) => {
                const valor = p.valorAtualizado ?? p.valorOriginal;
                const devedor =
                  p.devedorTipo === 'FEDERAL'
                    ? 'União'
                    : p.devedorTipo === 'ESTADUAL'
                      ? (p.devedorUf ?? '—')
                      : `${p.devedorMunicipio}/${p.devedorUf}`;
                const label = p.numeroPrecatorio ?? p.numeroProcesso ?? p.id.slice(0, 8);
                const dias = daysSince(p.estagioDesde);
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      <Link
                        className="font-medium text-foreground hover:text-primary transition-colors"
                        to={`/precatorios/${p.id}`}
                      >
                        {label}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{p.cedente.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{devedor}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatBRL(valor)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ring-1',
                          SCORE_STYLES[p.score],
                        )}
                      >
                        {SCORE_LABELS[p.score]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn('size-1.5 rounded-full', ESTAGIO_DOT[p.estagioAtual])}
                          aria-hidden
                        />
                        {ESTAGIO_LABELS[p.estagioAtual]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {dias}d
                    </TableCell>
                    <TableCell className="flex gap-0.5 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button asChild size="icon" variant="ghost" title="Ver">
                        <Link to={`/precatorios/${p.id}`}>
                          <Eye size={14} />
                        </Link>
                      </Button>
                      <Button asChild size="icon" variant="ghost" title="Editar">
                        <Link to={`/precatorios/${p.id}/editar`}>
                          <Pencil size={14} />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Excluir"
                        onClick={() => onDelete(p.id, label)}
                        disabled={remove.isPending}
                        className="hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
