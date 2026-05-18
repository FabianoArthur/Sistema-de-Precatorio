import { toast } from 'sonner';

export function confirmAction(opts: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  toast(opts.title, {
    description: opts.description,
    action: {
      label: opts.confirmLabel ?? 'Confirmar',
      onClick: () => opts.onConfirm(),
    },
    cancel: { label: 'Cancelar', onClick: () => {} },
    duration: 10_000,
  });
}
