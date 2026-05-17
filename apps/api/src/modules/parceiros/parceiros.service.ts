import { Injectable, NotFoundException } from '@nestjs/common';
import { AcaoAudit, type ParceiroCreateInput, type ParceiroUpdateInput } from '@preca/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ParceirosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  list() {
    return this.prisma.parceiro.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const parceiro = await this.prisma.parceiro.findUnique({ where: { id } });
    if (!parceiro) throw new NotFoundException('Parceiro não encontrado');
    return parceiro;
  }

  async create(data: ParceiroCreateInput, userId: string) {
    const parceiro = await this.prisma.parceiro.create({ data });
    await this.auditLog.registrar({
      entidade: 'parceiro',
      entidadeId: parceiro.id,
      acao: AcaoAudit.CREATE,
      depois: parceiro,
      userId,
    });
    return parceiro;
  }

  async update(id: string, data: ParceiroUpdateInput, userId: string) {
    const antes = await this.findOne(id);
    const depois = await this.prisma.parceiro.update({ where: { id }, data });
    await this.auditLog.registrar({
      entidade: 'parceiro',
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
    await this.prisma.parceiro.delete({ where: { id } });
    await this.auditLog.registrar({
      entidade: 'parceiro',
      entidadeId: id,
      acao: AcaoAudit.DELETE,
      antes,
      userId,
    });
  }
}
