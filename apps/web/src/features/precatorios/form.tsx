import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CedentePicker } from '@/features/cedentes/cedente-picker';
import { useParceiros } from '@/features/parceiros/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  NaturezaPrecatorio,
  type PrecatorioCreateInput,
  TIPO_LABELS,
  TipoPrecatorio,
  UF_BRASIL,
  precatorioCreateSchema,
} from '@preca/shared';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCreatePrecatorio, usePrecatorio, useUpdatePrecatorio } from './hooks';

const TIPO_OPTIONS = [
  TipoPrecatorio.HONORARIOS,
  TipoPrecatorio.ALIMENTAR,
  TipoPrecatorio.COMUM,
  TipoPrecatorio.DESAPROPRIACAO,
  TipoPrecatorio.ANISTIA_POLITICA,
];

const NATUREZA_OPTIONS = [
  NaturezaPrecatorio.FEDERAL,
  NaturezaPrecatorio.ESTADUAL,
  NaturezaPrecatorio.MUNICIPAL,
];

export function PrecatorioFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id && id !== 'novo';
  const navigate = useNavigate();

  const { data: precatorio, isLoading } = usePrecatorio(isEdit ? id : undefined);
  const { data: parceiros } = useParceiros();
  const create = useCreatePrecatorio();
  const update = useUpdatePrecatorio(id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PrecatorioCreateInput>({
    resolver: zodResolver(precatorioCreateSchema),
    defaultValues: {
      cedenteId: '',
      devedorTipo: NaturezaPrecatorio.FEDERAL,
      tipo: TipoPrecatorio.COMUM,
      valorOriginal: 0,
    },
  });

  const devedorTipo = watch('devedorTipo');

  useEffect(() => {
    if (precatorio) {
      reset({
        numeroPrecatorio: precatorio.numeroPrecatorio ?? '',
        numeroProcesso: precatorio.numeroProcesso ?? '',
        cedenteId: precatorio.cedenteId,
        escritorioAdvogado: precatorio.escritorioAdvogado ?? '',
        devedorTipo: precatorio.devedorTipo,
        devedorUf: (precatorio.devedorUf as PrecatorioCreateInput['devedorUf']) ?? undefined,
        devedorMunicipio: precatorio.devedorMunicipio ?? '',
        tipo: precatorio.tipo,
        valorOriginal: Number(precatorio.valorOriginal),
        valorAtualizado: precatorio.valorAtualizado
          ? Number(precatorio.valorAtualizado)
          : undefined,
        desagio: precatorio.desagio ? Number(precatorio.desagio) : undefined,
        valorLiquido: precatorio.valorLiquido ? Number(precatorio.valorLiquido) : undefined,
        tribunal: precatorio.tribunal ?? '',
        vara: precatorio.vara ?? '',
        dataExpedicao: precatorio.dataExpedicao ? new Date(precatorio.dataExpedicao) : undefined,
        dataRequisicao: precatorio.dataRequisicao ? new Date(precatorio.dataRequisicao) : undefined,
        prazoEstimado: precatorio.prazoEstimado ? new Date(precatorio.prazoEstimado) : undefined,
        parceiroId: precatorio.parceiroId ?? undefined,
      });
    }
  }, [precatorio, reset]);

  async function onSubmit(data: PrecatorioCreateInput) {
    try {
      let result: { id: string };
      if (isEdit) {
        result = await update.mutateAsync(data);
      } else {
        result = await create.mutateAsync(data);
      }
      navigate(`/precatorios/${result.id}`);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao salvar');
    }
  }

  if (isEdit && isLoading) {
    return <div className="p-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="icon" variant="ghost">
          <Link to="/precatorios">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEdit ? 'Editar precatório' : 'Novo precatório'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="numeroPrecatorio">Nº do precatório</Label>
                <Input id="numeroPrecatorio" {...register('numeroPrecatorio')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numeroProcesso">Nº do processo</Label>
                <Input id="numeroProcesso" {...register('numeroProcesso')} />
              </div>
            </div>

            <Controller
              control={control}
              name="cedenteId"
              render={({ field }) => (
                <CedentePicker
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.cedenteId?.message}
                />
              )}
            />

            <div className="space-y-1.5">
              <Label htmlFor="escritorioAdvogado">Escritório / Advogado (opcional)</Label>
              <Input id="escritorioAdvogado" {...register('escritorioAdvogado')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="devedorTipo">Natureza *</Label>
                <Select
                  id="devedorTipo"
                  {...register('devedorTipo', {
                    onChange: (e) => {
                      if (e.target.value === NaturezaPrecatorio.FEDERAL) {
                        setValue('devedorUf', null);
                        setValue('devedorMunicipio', null);
                      } else if (e.target.value === NaturezaPrecatorio.ESTADUAL) {
                        setValue('devedorMunicipio', null);
                      }
                    },
                  })}
                >
                  {NATUREZA_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
                {errors.devedorTipo && (
                  <p className="text-xs text-destructive">{errors.devedorTipo.message}</p>
                )}
              </div>

              {devedorTipo !== NaturezaPrecatorio.FEDERAL && (
                <div className="space-y-1.5">
                  <Label htmlFor="devedorUf">UF *</Label>
                  <Select id="devedorUf" {...register('devedorUf')}>
                    <option value="">Selecione...</option>
                    {UF_BRASIL.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </Select>
                  {errors.devedorUf && (
                    <p className="text-xs text-destructive">{errors.devedorUf.message}</p>
                  )}
                </div>
              )}

              {devedorTipo === NaturezaPrecatorio.MUNICIPAL && (
                <div className="space-y-1.5">
                  <Label htmlFor="devedorMunicipio">Município *</Label>
                  <Input id="devedorMunicipio" {...register('devedorMunicipio')} />
                  {errors.devedorMunicipio && (
                    <p className="text-xs text-destructive">{errors.devedorMunicipio.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo & valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select id="tipo" {...register('tipo')}>
                {TIPO_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_LABELS[t]}
                  </option>
                ))}
              </Select>
              {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="valorOriginal">Valor original (R$) *</Label>
                <Input
                  id="valorOriginal"
                  type="number"
                  step="0.01"
                  {...register('valorOriginal', { valueAsNumber: true })}
                />
                {errors.valorOriginal && (
                  <p className="text-xs text-destructive">{errors.valorOriginal.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorAtualizado">Valor atualizado (R$)</Label>
                <Input
                  id="valorAtualizado"
                  type="number"
                  step="0.01"
                  {...register('valorAtualizado', {
                    valueAsNumber: true,
                    setValueAs: (v) => (v === '' || Number.isNaN(v) ? null : Number(v)),
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desagio">Deságio (R$)</Label>
                <Input
                  id="desagio"
                  type="number"
                  step="0.01"
                  {...register('desagio', {
                    setValueAs: (v) => (v === '' || Number.isNaN(Number(v)) ? null : Number(v)),
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorLiquido">Valor líquido (R$)</Label>
                <Input
                  id="valorLiquido"
                  type="number"
                  step="0.01"
                  {...register('valorLiquido', {
                    setValueAs: (v) => (v === '' || Number.isNaN(Number(v)) ? null : Number(v)),
                  })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Score é calculado automaticamente a partir do valor atualizado (ou original se
              atualizado vazio).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processual (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tribunal">Tribunal</Label>
                <Input id="tribunal" {...register('tribunal')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vara">Vara</Label>
                <Input id="vara" {...register('vara')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataExpedicao">Data de expedição</Label>
                <Input
                  id="dataExpedicao"
                  type="date"
                  {...register('dataExpedicao', { setValueAs: (v) => (v ? new Date(v) : null) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataRequisicao">Data de requisição</Label>
                <Input
                  id="dataRequisicao"
                  type="date"
                  {...register('dataRequisicao', { setValueAs: (v) => (v ? new Date(v) : null) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prazoEstimado">Prazo estimado</Label>
                <Input
                  id="prazoEstimado"
                  type="date"
                  {...register('prazoEstimado', { setValueAs: (v) => (v ? new Date(v) : null) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parceiro (opcional, comissão será preenchida pós-cotação)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="parceiroId">Parceiro</Label>
              <Select id="parceiroId" {...register('parceiroId', { setValueAs: (v) => v || null })}>
                <option value="">Nenhum</option>
                {parceiros?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/precatorios">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
