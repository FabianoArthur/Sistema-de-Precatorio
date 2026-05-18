import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { type DragEvent, useId, useState } from 'react';
import { useUploadAnexo } from './hooks';

interface UploadZoneProps {
  precatorioId: string;
}

export function UploadZone({ precatorioId }: UploadZoneProps) {
  const upload = useUploadAnexo(precatorioId);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        window.alert(`"${file.name}" não é PDF — ignorado.`);
        continue;
      }
      try {
        await upload.mutateAsync(file);
      } catch (e) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        window.alert(`Falha ao enviar "${file.name}": ${msg ?? 'erro desconhecido'}`);
      }
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <Upload size={24} className="mx-auto text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">
        Arraste PDFs aqui ou{' '}
        <label htmlFor={inputId} className="text-primary underline cursor-pointer">
          selecione do computador
        </label>
        .
      </p>
      <p className="text-xs text-muted-foreground mt-1">Máx 20MB por arquivo · só PDF</p>
      <input
        id={inputId}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {upload.isPending && (
        <Button disabled className="mt-3" size="sm">
          Enviando...
        </Button>
      )}
    </div>
  );
}
