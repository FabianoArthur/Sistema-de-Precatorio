import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CotacaoResponderInput, cotacaoResponderSchema } from '@preca/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useResponderCotacao } from './hooks';
import type { CotacaoSummary } from './types';

interface ResponderDialogProps {
  open: boolean;
  onClose: () => void;
  precatorioId: string;
  cotacao: CotacaoSummary | null;
}

export function ResponderCotacaoDialog({
  open,
  onClose,
  precatorioId,
  cotacao,
}: ResponderDialogProps) {
  const responder = useResponderCotacao(precatorioId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CotacaoResponderInput>({
    resolver: zodResolver(cotacaoResponderSchema),
    defaultValues: { valorBruto: 0, comissao: 0, observacao: '' },
  });

  useEffect(() => {
    if (cotacao && open) {
      reset({
        valorBruto: cotacao.valorBruto ? Number(cotacao.valorBruto) : 0,
        comissao: cotacao.comissao ? Number(cotacao.comissao) : 0,
        observacao: cotacao.observacao ?? '',
      });
    }
  }, [cotacao, open, reset]);

  async function onSubmit(data: CotacaoResponderInput) {
    if (!cotacao) return;
    try {
      await responder.mutateAsync({ id: cotacao.id, data });
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Falha ao responder cotação');
    }
  }

  if (!cotacao) return null;

  return (
    <Dialog open={open} onClose={onClose} title={`Resposta de ${cotacao.comprador.nome}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="valorBruto">Valor bruto (R$) *</Label>
          <Input
            id="valorBruto"
            type="number"
            step="0.01"
            {...register('valorBruto', { valueAsNumber: true })}
          />
          {errors.valorBruto && (
            <p className="text-xs text-destructive">{errors.valorBruto.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comissao">Comissão do comprador (R$)</Label>
          <Input
            id="comissao"
            type="number"
            step="0.01"
            {...register('comissao', { valueAsNumber: true })}
          />
          {errors.comissao && <p className="text-xs text-destructive">{errors.comissao.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="observacao">Observação (opcional)</Label>
          <Textarea id="observacao" rows={3} {...register('observacao')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar resposta'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
