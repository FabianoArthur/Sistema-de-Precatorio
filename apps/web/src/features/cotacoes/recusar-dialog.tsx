import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CotacaoRecusarInput, cotacaoRecusarSchema } from '@preca/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRecusarCotacao } from './hooks';
import type { CotacaoSummary } from './types';

interface RecusarDialogProps {
  open: boolean;
  onClose: () => void;
  precatorioId: string;
  cotacao: CotacaoSummary | null;
}

export function RecusarCotacaoDialog({ open, onClose, precatorioId, cotacao }: RecusarDialogProps) {
  const recusar = useRecusarCotacao(precatorioId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CotacaoRecusarInput>({
    resolver: zodResolver(cotacaoRecusarSchema),
    defaultValues: { observacao: '' },
  });

  useEffect(() => {
    if (cotacao && open) {
      reset({ observacao: cotacao.observacao ?? '' });
    }
  }, [cotacao, open, reset]);

  async function onSubmit(data: CotacaoRecusarInput) {
    if (!cotacao) return;
    try {
      await recusar.mutateAsync({ id: cotacao.id, data });
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Falha ao recusar cotação');
    }
  }

  if (!cotacao) return null;

  return (
    <Dialog open={open} onClose={onClose} title={`Recusa de ${cotacao.comprador.nome}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="observacao">Motivo (opcional)</Label>
          <Textarea
            id="observacao"
            rows={3}
            placeholder="Comprador não aceitou, valor abaixo do mínimo etc."
            {...register('observacao')}
          />
          {errors.observacao && (
            <p className="text-xs text-destructive">{errors.observacao.message}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Confirmar recusa'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
