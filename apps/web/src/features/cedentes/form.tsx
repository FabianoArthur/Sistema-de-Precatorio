import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { type CedenteCreateInput, cedenteCreateSchema } from '@preca/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCedente, useCreateCedente, useUpdateCedente } from './hooks';

export function CedenteFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id && id !== 'novo';
  const navigate = useNavigate();

  const { data: cedente, isLoading } = useCedente(isEdit ? id : undefined);
  const create = useCreateCedente();
  const update = useUpdateCedente(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CedenteCreateInput>({
    resolver: zodResolver(cedenteCreateSchema),
    defaultValues: { nome: '', documento: '', contato: '' },
  });

  useEffect(() => {
    if (cedente) {
      reset({
        nome: cedente.nome,
        documento: cedente.documento ?? '',
        contato: cedente.contato ?? '',
      });
    }
  }, [cedente, reset]);

  async function onSubmit(data: CedenteCreateInput) {
    try {
      if (isEdit) {
        await update.mutateAsync(data);
      } else {
        await create.mutateAsync(data);
      }
      navigate('/cedentes');
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao salvar');
    }
  }

  if (isEdit && isLoading) {
    return <div className="p-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="icon" variant="ghost">
          <Link to="/cedentes">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? 'Editar cedente' : 'Novo cedente'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do cedente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="documento">Documento (CPF/CNPJ)</Label>
              <Input id="documento" {...register('documento')} />
              {errors.documento && (
                <p className="text-xs text-destructive">{errors.documento.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contato">Contato (telefone / e-mail)</Label>
              <Input id="contato" {...register('contato')} />
              {errors.contato && (
                <p className="text-xs text-destructive">{errors.contato.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button asChild type="button" variant="outline">
                <Link to="/cedentes">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
