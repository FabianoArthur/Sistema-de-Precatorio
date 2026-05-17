import { Injectable, NotFoundException } from '@nestjs/common';
import { AcaoAudit, type CedenteCreateInput, type CedenteUpdateInput } from '@preca/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class CedentesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  list() {
    return this.prisma.cedente.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const cedente = await this.prisma.cedente.findUnique({ where: { id } });
    if (!cedente) throw new NotFoundException('Cedente não encontrado');
    return cedente;
  }

  async create(data: CedenteCreateInput, userId: string) {
    const cedente = await this.prisma.cedente.create({ data });
    await this.auditLog.registrar({
      entidade: 'cedente',
      entidadeId: cedente.id,
      acao: AcaoAudit.CREATE,
      depois: cedente,
      userId,
    });
    return cedente;
  }

  async update(id: string, data: CedenteUpdateInput, userId: string) {
    const antes = await this.findOne(id);
    const depois = await this.prisma.cedente.update({ where: { id }, data });
    await this.auditLog.registrar({
      entidade: 'cedente',
      entidadeId: id,
      acao: AcaoAudit.UPDATE,
      antes,
      depois,
      userId,
    });
    return depois;
  }

  async remove(id: string, userId: string) {
    const antes = await this.findOne(id);
    await this.prisma.cedente.delete({ where: { id } });
    await this.auditLog.registrar({
      entidade: 'cedente',
      entidadeId: id,
      acao: AcaoAudit.DELETE,
      antes,
      userId,
    });
  }
}
