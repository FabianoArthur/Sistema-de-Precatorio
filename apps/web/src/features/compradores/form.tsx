import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type CompradorCreateInput,
  SCORE_LABELS,
  ScorePrecatorio,
  UF_BRASIL,
  compradorCreateSchema,
} from '@preca/shared';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useComprador, useCreateComprador, useUpdateComprador } from './hooks';

const SCORE_OPTIONS = [
  ScorePrecatorio.MEDIO,
  ScorePrecatorio.AA,
  ScorePrecatorio.AAA,
  ScorePrecatorio.URGENTE,
] as const;

export function CompradorFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id && id !== 'novo';
  const navigate = useNavigate();

  const { data: comprador, isLoading } = useComprador(isEdit ? id : undefined);
  const create = useCreateComprador();
  const update = useUpdateComprador(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CompradorCreateInput>({
    resolver: zodResolver(compradorCreateSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      celular: '',
      email: '',
      aceitaFederal: false,
      ufsAceitas: [],
      municipiosAceitos: [],
      scoresAceitos: [],
    },
  });

  useEffect(() => {
    if (comprador) {
      reset({
        nome: comprador.nome,
        cnpj: comprador.cnpj,
        celular: comprador.celular,
        email: comprador.email,
        aceitaFederal: comprador.aceitaFederal,
        ufsAceitas: comprador.ufsAceitas as CompradorCreateInput['ufsAceitas'],
        municipiosAceitos: comprador.municipiosAceitos,
        scoresAceitos: comprador.scoresAceitos,
      });
    }
  }, [comprador, reset]);

  async function onSubmit(data: CompradorCreateInput) {
    try {
      if (isEdit) {
        await update.mutateAsync(data);
      } else {
        await create.mutateAsync(data);
      }
      navigate('/compradores');
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao salvar');
    }
  }

  if (isEdit && isLoading) {
    return <div className="p-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="icon" variant="ghost">
          <Link to="/compradores">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? 'Editar comprador' : 'Novo comprador'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" {...register('nome')} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input id="cnpj" {...register('cnpj')} placeholder="00.000.000/0000-00" />
                {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="celular">Celular *</Label>
                <Input id="celular" {...register('celular')} />
                {errors.celular && (
                  <p className="text-xs text-destructive">{errors.celular.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>O que compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <label className="flex items-center gap-2">
              <Checkbox {...register('aceitaFederal')} />
              <span className="text-sm">
                Aceita precatórios <strong>federais</strong>
              </span>
            </label>

            <Controller
              control={control}
              name="ufsAceitas"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>UFs aceitas (precatórios estaduais)</Label>
                  <div className="grid grid-cols-9 gap-2">
                    {UF_BRASIL.map((uf) => {
                      const value = field.value ?? [];
                      const checked = value.includes(uf);
                      return (
                        <label key={uf} className="flex items-center gap-1 text-xs">
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...value, uf]
                                : value.filter((v) => v !== uf);
                              field.onChange(next);
                            }}
                          />
                          {uf}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            />

            <Controller
              control={control}
              name="municipiosAceitos"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="municipiosAceitos">
                    Municípios aceitos (1 por linha — integração IBGE entra na Fase 2)
                  </Label>
                  <Textarea
                    id="municipiosAceitos"
                    rows={4}
                    value={(field.value ?? []).join('\n')}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </div>
              )}
            />

            <Controller
              control={control}
              name="scoresAceitos"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Scores que aceita</Label>
                  <div className="flex flex-wrap gap-3">
                    {SCORE_OPTIONS.map((score) => {
                      const value = field.value ?? [];
                      const checked = value.includes(score);
                      return (
                        <label key={score} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...value, score]
                                : value.filter((v) => v !== score);
                              field.onChange(next);
                            }}
                          />
                          {SCORE_LABELS[score]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/compradores">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
