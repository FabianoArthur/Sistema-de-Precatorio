import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { type ParceiroCreateInput, parceiroCreateSchema } from '@preca/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateParceiro, useParceiro, useUpdateParceiro } from './hooks';

export function ParceiroFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id && id !== 'novo';
  const navigate = useNavigate();

  const { data: parceiro, isLoading } = useParceiro(isEdit ? id : undefined);
  const create = useCreateParceiro();
  const update = useUpdateParceiro(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ParceiroCreateInput>({
    resolver: zodResolver(parceiroCreateSchema),
    defaultValues: { nome: '', chavePix: '' },
  });

  useEffect(() => {
    if (parceiro) reset({ nome: parceiro.nome, chavePix: parceiro.chavePix });
  }, [parceiro, reset]);

  async function onSubmit(data: ParceiroCreateInput) {
    try {
      if (isEdit) {
        await update.mutateAsync(data);
      } else {
        await create.mutateAsync(data);
      }
      navigate('/parceiros');
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
          <Link to="/parceiros">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? 'Editar parceiro' : 'Novo parceiro'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do parceiro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chavePix">Chave PIX *</Label>
              <Input id="chavePix" {...register('chavePix')} />
              {errors.chavePix && (
                <p className="text-xs text-destructive">{errors.chavePix.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button asChild type="button" variant="outline">
                <Link to="/parceiros">Cancelar</Link>
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
