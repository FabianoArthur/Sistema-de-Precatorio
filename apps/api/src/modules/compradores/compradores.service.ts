import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AcaoAudit, type CompradorCreateInput, type CompradorUpdateInput } from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompradoresService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.comprador.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const comprador = await this.prisma.comprador.findUnique({ where: { id } });
    if (!comprador) throw new NotFoundException('Comprador não encontrado');
    return comprador;
  }

  async create(data: CompradorCreateInput, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const comprador = await tx.comprador.create({ data });
        await tx.auditLog.create({
          data: {
            entidade: 'comprador',
            entidadeId: comprador.id,
            acao: AcaoAudit.CREATE,
            depois: comprador as unknown as Prisma.InputJsonValue,
            userId,
          },
        });
        return comprador;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('CNPJ já cadastrado');
      }
      throw e;
    }
  }

  async update(id: string, data: CompradorUpdateInput, userId: string) {
    const antes = await this.findOne(id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const depois = await tx.comprador.update({ where: { id }, data });
        await tx.auditLog.create({
          data: {
            entidade: 'comprador',
            entidadeId: id,
            acao: AcaoAudit.UPDATE,
            antes: antes as unknown as Prisma.InputJsonValue,
            depois: depois as unknown as Prisma.InputJsonValue,
            userId,
          },
        });
        return depois;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('CNPJ já cadastrado');
      }
      throw e;
    }
  }

  async remove(id: string, userId: string) {
    const antes = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.comprador.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          entidade: 'comprador',
          entidadeId: id,
          acao: AcaoAudit.DELETE,
          antes: antes as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
    });
  }
}
