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
import { useDeleteParceiro, useParceiros } from './hooks';

export function ParceirosListPage() {
  const { data: parceiros, isLoading } = useParceiros();
  const remove = useDeleteParceiro();

  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Excluir parceiro "${nome}"?`)) return;
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
        <h1 className="text-2xl font-semibold">Parceiros</h1>
        <Button asChild>
          <Link to="/parceiros/novo">
            <Plus size={16} />
            Novo parceiro
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !parceiros || parceiros.length === 0 ? (
        <p className="text-muted-foreground">Nenhum parceiro cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Chave PIX</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {parceiros.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="font-mono text-xs">{p.chavePix}</TableCell>
                <TableCell className="flex gap-1 justify-end">
                  <Button asChild size="icon" variant="ghost">
                    <Link to={`/parceiros/${p.id}`}>
                      <Pencil size={14} />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(p.id, p.nome)}
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
