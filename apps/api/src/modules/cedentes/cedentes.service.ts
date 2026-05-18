import { Injectable, NotFoundException } from '@nestjs/common';
import { AcaoAudit, type CedenteCreateInput, type CedenteUpdateInput } from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CedentesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.cedente.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const cedente = await this.prisma.cedente.findUnique({ where: { id } });
    if (!cedente) throw new NotFoundException('Cedente não encontrado');
    return cedente;
  }

  create(data: CedenteCreateInput, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cedente = await tx.cedente.create({ data });
      await tx.auditLog.create({
        data: {
          entidade: 'cedente',
          entidadeId: cedente.id,
          acao: AcaoAudit.CREATE,
          depois: cedente as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
      return cedente;
    });
  }

  async update(id: string, data: CedenteUpdateInput, userId: string) {
    const antes = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.cedente.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          entidade: 'cedente',
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
      await tx.cedente.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          entidade: 'cedente',
          entidadeId: id,
          acao: AcaoAudit.DELETE,
          antes: antes as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
    });
  }
}
