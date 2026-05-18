import { cn } from '@/lib/utils';
import { TIPO_NOTIFICACAO_LABELS } from '@preca/shared';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, BellRing, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useContarNaoLidas,
  useMarcarLida,
  useMarcarTodasLidas,
  useNotificacoes,
  useRemoverNotificacao,
} from './hooks';
import type { Notificacao } from './types';

export function NotificacoesBell() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: count } = useContarNaoLidas();
  const { data: lista } = useNotificacoes();
  const marcarLida = useMarcarLida();
  const marcarTodas = useMarcarTodasLidas();
  const remover = useRemoverNotificacao();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const naoLidas = count ?? 0;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          open
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <span className="relative inline-flex">
          {naoLidas > 0 ? <BellRing size={16} /> : <Bell size={16} />}
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </span>
        Notificações
        {naoLidas > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-destructive text-destructive-foreground text-2xs font-semibold px-1.5">
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute left-full bottom-0 ml-3 z-50 w-96 max-h-[600px] overflow-y-auto rounded-xl border border-border bg-popover shadow-overlay animate-fade-in"
        >
          <div className="sticky top-0 bg-popover/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight">Notificações</h3>
              {naoLidas > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-primary-soft text-primary-strong text-2xs font-semibold px-1.5">
                  {naoLidas}
                </span>
              )}
            </div>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={() => marcarTodas.mutate()}
                disabled={marcarTodas.isPending}
                className="text-xs text-primary hover:text-primary-strong flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={12} />
                Marcar todas
              </button>
            )}
          </div>
          {!lista || lista.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Bell size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {lista.map((n) => (
                <NotificacaoItem
                  key={n.id}
                  n={n}
                  onClick={() => {
                    if (!n.lida) marcarLida.mutate(n.id);
                    if (n.link) setOpen(false);
                  }}
                  onMarcarLida={() => marcarLida.mutate(n.id)}
                  onRemover={() => remover.mutate(n.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotificacaoItem({
  n,
  onClick,
  onMarcarLida,
  onRemover,
}: {
  n: Notificacao;
  onClick: () => void;
  onMarcarLida: () => void;
  onRemover: () => void;
}) {
  const conteudo = (
    <div className="flex-1 space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          {TIPO_NOTIFICACAO_LABELS[n.tipo]}
        </span>
      </div>
      <p className={cn('text-sm leading-snug text-foreground', !n.lida && 'font-medium')}>
        {n.mensagem}
      </p>
      <p className="text-xs text-muted-foreground pt-1">
        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  );

  return (
    <li
      className={cn(
        'px-4 py-3 hover:bg-accent/40 transition-colors flex items-start gap-3 relative',
        !n.lida && 'bg-primary-soft/40',
      )}
    >
      {!n.lida && (
        <span className="absolute left-1.5 top-4 h-2 w-2 rounded-full bg-primary" aria-hidden />
      )}
      <div className="pl-3 flex-1 flex items-start gap-2">
        {n.link ? (
          <Link to={n.link} onClick={onClick} className="flex-1">
            {conteudo}
          </Link>
        ) : (
          <div className="flex-1 cursor-default">{conteudo}</div>
        )}
        <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100">
          {!n.lida && (
            <button
              type="button"
              onClick={onMarcarLida}
              title="Marcar como lida"
              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            >
              <Check size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onRemover}
            title="Remover"
            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </li>
  );
}
