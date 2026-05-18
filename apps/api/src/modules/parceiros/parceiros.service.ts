import { Injectable, NotFoundException } from '@nestjs/common';
import { AcaoAudit, type ParceiroCreateInput, type ParceiroUpdateInput } from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParceirosService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.parceiro.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const parceiro = await this.prisma.parceiro.findUnique({ where: { id } });
    if (!parceiro) throw new NotFoundException('Parceiro não encontrado');
    return parceiro;
  }

  create(data: ParceiroCreateInput, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const parceiro = await tx.parceiro.create({ data });
      await tx.auditLog.create({
        data: {
          entidade: 'parceiro',
          entidadeId: parceiro.id,
          acao: AcaoAudit.CREATE,
          depois: parceiro as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
      return parceiro;
    });
  }

  async update(id: string, data: ParceiroUpdateInput, userId: string) {
    const antes = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.parceiro.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          entidade: 'parceiro',
          entidadeId: id,
          acao: AcaoAudit.UPDATE,
          antes: antes as unknown as Prisma.InputJsonValue,
          depois: depois as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
      return depois;
    });
  }

  async remove(id: string, userId: string) {
    const antes = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.parceiro.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          entidade: 'parceiro',
          entidadeId: id,
          acao: AcaoAudit.DELETE,
          antes: antes as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
    });
  }
}
