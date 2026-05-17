import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCedentes, useDeleteCedente } from './hooks';

export function CedentesListPage() {
  const { data: cedentes, isLoading } = useCedentes();
  const remove = useDeleteCedente();

  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Excluir cedente "${nome}"?`)) return;
    try {
      await remove.mutateAsync(id);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      window.alert(msg ?? 'Falha ao excluir');
    }
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cedentes</h1>
        <Button asChild>
          <Link to="/cedentes/novo">
            <Plus size={16} />
            Novo cedente
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !cedentes || cedentes.length === 0 ? (
        <p className="text-muted-foreground">Nenhum cedente cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cedentes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.documento ?? '—'}</TableCell>
                <TableCell>{c.contato ?? '—'}</TableCell>
                <TableCell className="flex gap-1 justify-end">
                  <Button asChild size="icon" variant="ghost">
                    <Link to={`/cedentes/${c.id}`}>
                      <Pencil size={14} />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(c.id, c.nome)}
                    disabled={remove.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
