import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type NegociacaoCreateInput,
  OrigemNegociacao,
  negociacaoCreateSchema,
} from '@preca/shared';
import { useForm } from 'react-hook-form';
import { useCreateNegociacao } from './hooks';

interface NovaPropostaDialogProps {
  open: boolean;
  onClose: () => void;
  precatorioId: string;
}

export function NovaPropostaDialog({ open, onClose, precatorioId }: NovaPropostaDialogProps) {
  const create = useCreateNegociacao(precatorioId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NegociacaoCreateInput>({
    resolver: zodResolver(negociacaoCreateSchema),
    defaultValues: { origem: OrigemNegociacao.NOSSA, valor: 0, observacao: '' },
  });

  async function onSubmit(data: NegociacaoCreateInput) {
    try {
      await create.mutateAsync(data);
      reset({ origem: OrigemNegociacao.NOSSA, valor: 0, observacao: '' });
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao registrar negociação');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nova proposta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="origem">Origem *</Label>
          <Select id="origem" {...register('origem')}>
            <option value={OrigemNegociacao.NOSSA}>Nossa proposta</option>
            <option value={OrigemNegociacao.CEDENTE}>Contraproposta do cedente</option>
          </Select>
          {errors.origem && <p className="text-xs text-destructive">{errors.origem.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            {...register('valor', { valueAsNumber: true })}
          />
          {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
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
            {isSubmitting ? 'Salvando...' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
