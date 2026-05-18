import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type NotificacoesFiltros, type TipoNotificacao } from '@preca/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface PayloadNotificacao {
  tipo: TipoNotificacao;
  mensagem: string;
  link?: string | null;
  excetoUserId?: string;
  tx?: Prisma.TransactionClient;
}

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async criarParaTodos(payload: PayloadNotificacao): Promise<void> {
    const client = payload.tx ?? this.prisma;
    const usuarios = await client.user.findMany({
      where: payload.excetoUserId ? { id: { not: payload.excetoUserId } } : undefined,
      select: { id: true },
    });

    if (usuarios.length === 0) return;

    await client.notificacao.createMany({
      data: usuarios.map((u) => ({
        tipo: payload.tipo,
        mensagem: payload.mensagem,
        link: payload.link ?? null,
        userId: u.id,
      })),
    });
  }

  async list(userId: string, filtros: NotificacoesFiltros) {
    const where: Prisma.NotificacaoWhereInput = { userId };
    if (filtros.apenasNaoLidas) where.lida = false;
    return this.prisma.notificacao.findMany({
      where,
      orderBy: [{ lida: 'asc' }, { createdAt: 'desc' }],
      take: filtros.limit ?? 20,
    });
  }

  async contarNaoLidas(userId: string) {
    return this.prisma.notificacao.count({ where: { userId, lida: false } });
  }

  async marcarLida(id: string, userId: string) {
    const notif = await this.prisma.notificacao.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      throw new NotFoundException('Notificação não encontrada');
    }
    return this.prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  async marcarTodasLidas(userId: string) {
    const res = await this.prisma.notificacao.updateMany({
      where: { userId, lida: false },
      data: { lida: true },
    });
    return { atualizadas: res.count };
  }

  async remove(id: string, userId: string) {
    const notif = await this.prisma.notificacao.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      throw new NotFoundException('Notificação não encontrada');
    }
    await this.prisma.notificacao.delete({ where: { id } });
  }
}
