import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AcaoAudit, type CompradorCreateInput, type CompradorUpdateInput } from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class CompradoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

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
      const comprador = await this.prisma.comprador.create({ data });
      await this.auditLog.registrar({
        entidade: 'comprador',
        entidadeId: comprador.id,
        acao: AcaoAudit.CREATE,
        depois: comprador,
        userId,
      });
      return comprador;
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
      const depois = await this.prisma.comprador.update({ where: { id }, data });
      await this.auditLog.registrar({
        entidade: 'comprador',
        entidadeId: id,
        acao: AcaoAudit.UPDATE,
        antes,
        depois,
        userId,
      });
      return depois;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('CNPJ já cadastrado');
      }
      throw e;
    }
  }

  async remove(id: string, userId: string) {
    const antes = await this.findOne(id);
    await this.prisma.comprador.delete({ where: { id } });
    await this.auditLog.registrar({
      entidade: 'comprador',
      entidadeId: id,
      acao: AcaoAudit.DELETE,
      antes,
      userId,
    });
  }
}
