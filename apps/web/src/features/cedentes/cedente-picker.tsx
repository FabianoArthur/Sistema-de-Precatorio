import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CedenteCreateInput, cedenteCreateSchema } from '@preca/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCedentes, useCreateCedente } from './hooks';

interface CedentePickerProps {
  value: string | null | undefined;
  onChange: (cedenteId: string) => void;
  error?: string;
}

export function CedentePicker({ value, onChange, error }: CedentePickerProps) {
  const { data: cedentes, isLoading } = useCedentes();
  const create = useCreateCedente();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CedenteCreateInput>({
    resolver: zodResolver(cedenteCreateSchema),
    defaultValues: { nome: '', documento: '', contato: '' },
  });

  async function onSubmit(data: CedenteCreateInput) {
    try {
      const novo = await create.mutateAsync(data);
      onChange(novo.id);
      reset();
      setOpen(false);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Falha ao criar cedente');
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="cedenteId">Cedente *</Label>
      <div className="flex gap-2">
        <Select
          id="cedenteId"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Selecione um cedente...</option>
          {cedentes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
              {c.documento ? ` (${c.documento})` : ''}
            </option>
          ))}
        </Select>
        <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)}>
          <Plus size={16} />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog open={open} onClose={() => setOpen(false)} title="Novo cedente">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cedente-nome">Nome *</Label>
            <Input id="cedente-nome" {...register('nome')} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cedente-documento">Documento (CPF/CNPJ)</Label>
            <Input id="cedente-documento" {...register('documento')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cedente-contato">Contato</Label>
            <Input id="cedente-contato" {...register('contato')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
