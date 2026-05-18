import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CheckCheck, Sparkles, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCompradoresSugeridos, useEnviarCotacoes } from './hooks';
import { BloqueioPill, MatchPill } from './match-pill';
import type { CompradorBloqueado, CompradorSugerido } from './types';

interface EnviarDialogProps {
  open: boolean;
  onClose: () => void;
  precatorioId: string;
}

export function EnviarCotacoesDialog({ open, onClose, precatorioId }: EnviarDialogProps) {
  const { data, isLoading } = useCompradoresSugeridos(open ? precatorioId : undefined);
  const enviar = useEnviarCotacoes(precatorioId);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [preselecionado, setPreselecionado] = useState(false);

  // Pré-seleciona os sugeridos quando o dialog abre
  useEffect(() => {
    if (open && data && !preselecionado) {
      setSelecionados(new Set(data.sugeridos.map((s) => s.comprador.id)));
      setPreselecionado(true);
    }
    if (!open) {
      setPreselecionado(false);
      setSelecionados(new Set());
    }
  }, [open, data, preselecionado]);

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selecionarTodosSugeridos() {
    if (!data) return;
    setSelecionados((prev) => {
      const next = new Set(prev);
      for (const s of data.sugeridos) next.add(s.comprador.id);
      return next;
    });
  }

  function limparSelecao() {
    setSelecionados(new Set());
  }

  async function onSubmit() {
    if (selecionados.size === 0) {
      window.alert('Selecione ao menos um comprador');
      return;
    }
    try {
      const result = await enviar.mutateAsync({ compradorIds: Array.from(selecionados) });
      onClose();
      if (result.duplicadas > 0) {
        window.alert(
          `${result.criadas} cotação(ões) criada(s). ${result.duplicadas} já existiam e foram ignoradas.`,
        );
      }
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao enviar cotações');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Solicitar cotações"
      description="Compradores sugeridos pré-selecionados conforme o perfil do precatório."
      className="max-w-2xl"
    >
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando compradores...</p>
      ) : !data ? null : data.sugeridos.length === 0 && data.outros.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Todos os compradores já têm cotação para este precatório.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">{selecionados.size}</strong> selecionado(s) de{' '}
              {data.sugeridos.length + data.outros.length}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={selecionarTodosSugeridos}>
                <CheckCheck size={13} />
                Todos sugeridos
              </Button>
              <Button size="sm" variant="ghost" onClick={limparSelecao}>
                Limpar
              </Button>
            </div>
          </div>

          <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
            {data.sugeridos.length > 0 && (
              <SecaoSugeridos
                titulo="Sugeridos"
                sugeridos={data.sugeridos}
                selecionados={selecionados}
                onToggle={toggle}
              />
            )}
            {data.outros.length > 0 && (
              <SecaoBloqueados
                titulo="Outros (fora do perfil)"
                bloqueados={data.outros}
                selecionados={selecionados}
                onToggle={toggle}
              />
            )}
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={enviar.isPending || selecionados.size === 0}>
          {enviar.isPending ? 'Enviando...' : `Enviar (${selecionados.size})`}
        </Button>
      </div>
    </Dialog>
  );
}

function SecaoSugeridos({
  titulo,
  sugeridos,
  selecionados,
  onToggle,
}: {
  titulo: string;
  sugeridos: CompradorSugerido[];
  selecionados: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <SectionHeader
        icon={<Sparkles size={12} />}
        titulo={titulo}
        count={sugeridos.length}
        tone="primary"
      />
      <ul className="space-y-1.5">
        {sugeridos.map((s) => {
          const checked = selecionados.has(s.comprador.id);
          return (
            <li
              key={s.comprador.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors cursor-pointer',
                checked
                  ? 'border-primary/40 bg-primary-soft/40'
                  : 'border-border hover:bg-card-muted/50',
              )}
            >
              <Checkbox
                id={`c-${s.comprador.id}`}
                checked={checked}
                onChange={() => onToggle(s.comprador.id)}
                className="mt-0.5"
              />
              <label
                htmlFor={`c-${s.comprador.id}`}
                className="flex-1 cursor-pointer space-y-1.5 min-w-0"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium">{s.comprador.nome}</span>
                  <span className="text-2xs font-mono text-muted-foreground">
                    {s.comprador.cnpj}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.motivos.map((m) => (
                    <MatchPill key={`${s.comprador.id}-${m.tipo}-${m.label}`} motivo={m} />
                  ))}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SecaoBloqueados({
  titulo,
  bloqueados,
  selecionados,
  onToggle,
}: {
  titulo: string;
  bloqueados: CompradorBloqueado[];
  selecionados: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <SectionHeader
        icon={<XCircle size={12} />}
        titulo={titulo}
        count={bloqueados.length}
        tone="muted"
      />
      <p className="text-2xs text-muted-foreground -mt-1">
        Estes compradores marcaram restrições que não batem com o precatório. Você ainda pode cotar
        manualmente.
      </p>
      <ul className="space-y-1.5">
        {bloqueados.map((b) => {
          const checked = selecionados.has(b.comprador.id);
          return (
            <li
              key={b.comprador.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors opacity-80 hover:opacity-100',
                checked
                  ? 'border-warning/40 bg-warning-soft/40 opacity-100'
                  : 'border-border hover:bg-card-muted/50',
              )}
            >
              <Checkbox
                id={`c-${b.comprador.id}`}
                checked={checked}
                onChange={() => onToggle(b.comprador.id)}
                className="mt-0.5"
              />
              <label
                htmlFor={`c-${b.comprador.id}`}
                className="flex-1 cursor-pointer space-y-1.5 min-w-0"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium">{b.comprador.nome}</span>
                  <span className="text-2xs font-mono text-muted-foreground">
                    {b.comprador.cnpj}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {b.bloqueios.map((blo) => (
                    <BloqueioPill
                      key={`${b.comprador.id}-${blo.tipo}-${blo.label}`}
                      bloqueio={blo}
                    />
                  ))}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SectionHeader({
  icon,
  titulo,
  count,
  tone,
}: {
  icon: React.ReactNode;
  titulo: string;
  count: number;
  tone: 'primary' | 'muted';
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded',
          tone === 'primary'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <h3 className="text-sm font-semibold tracking-tight">{titulo}</h3>
      <span className="text-2xs font-semibold text-muted-foreground">{count}</span>
    </div>
  );
}
