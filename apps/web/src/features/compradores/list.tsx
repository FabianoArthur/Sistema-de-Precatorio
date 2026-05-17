import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SCORE_LABELS } from '@preca/shared';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompradores, useDeleteComprador } from './hooks';

export function CompradoresListPage() {
  const { data: compradores, isLoading } = useCompradores();
  const remove = useDeleteComprador();

  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Excluir comprador "${nome}"?`)) return;
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
        <h1 className="text-2xl font-semibold">Compradores</h1>
        <Button asChild>
          <Link to="/compradores/novo">
            <Plus size={16} />
            Novo comprador
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !compradores || compradores.length === 0 ? (
        <p className="text-muted-foreground">Nenhum comprador cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Aceita</TableHead>
              <TableHead>Scores</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {compradores.map((c) => {
              const aceita: string[] = [];
              if (c.aceitaFederal) aceita.push('Federal');
              if (c.ufsAceitas.length) aceita.push(`Est: ${c.ufsAceitas.join(', ')}`);
              if (c.municipiosAceitos.length) aceita.push(`${c.municipiosAceitos.length} municípios`);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="font-mono text-xs">{c.cnpj}</TableCell>
                  <TableCell className="text-xs">{aceita.join(' · ') || '—'}</TableCell>
                  <TableCell className="text-xs">
                    {c.scoresAceitos.map((s) => SCORE_LABELS[s]).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button asChild size="icon" variant="ghost">
                      <Link to={`/compradores/${c.id}`}>
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
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
