import { Injectable, NotFoundException } from '@nestjs/common';
import { AcaoAudit, type NegociacaoCreateInput, TipoNotificacao } from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class NegociacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async create(precatorioId: string, data: NegociacaoCreateInput, userId: string) {
    const precatorio = await this.prisma.precatorio.findUnique({
      where: { id: precatorioId },
      select: { id: true, numeroPrecatorio: true, numeroProcesso: true },
    });
    if (!precatorio) throw new NotFoundException('Precatório não encontrado');

    return this.prisma.$transaction(async (tx) => {
      const negociacao = await tx.negociacao.create({
        data: {
          precatorioId,
          origem: data.origem,
          valor: new Prisma.Decimal(data.valor),
          observacao: data.observacao ?? null,
          createdById: userId,
        },
        include: { createdBy: { select: { id: true, nome: true } } },
      });
      await tx.auditLog.create({
        data: {
          entidade: 'negociacao',
          entidadeId: negociacao.id,
          acao: AcaoAudit.CREATE,
          depois: negociacao as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
      const numero = precatorio.numeroPrecatorio ?? precatorio.numeroProcesso ?? '(sem nº)';
      const origemLabel = data.origem === 'NOSSA' ? 'Nossa proposta' : 'Contraproposta do cedente';
      await this.notificacoes.criarParaTodos({
        tipo: TipoNotificacao.NEGOCIACAO_NOVA,
        mensagem: `${origemLabel} em ${numero}: R$ ${data.valor.toLocaleString('pt-BR')}.`,
        link: `/precatorios/${precatorioId}`,
        excetoUserId: userId,
        tx,
      });
      return negociacao;
    });
  }

  async remove(id: string, userId: string) {
    const antes = await this.prisma.negociacao.findUnique({ where: { id } });
    if (!antes) throw new NotFoundException('Negociação não encontrada');

    await this.prisma.$transaction(async (tx) => {
      await tx.negociacao.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          entidade: 'negociacao',
          entidadeId: id,
          acao: AcaoAudit.DELETE,
          antes: antes as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
    });
  }
}
