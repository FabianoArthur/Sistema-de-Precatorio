import { Injectable } from '@nestjs/common';
import { type AcaoAudit } from '@preca/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  registrar(params: {
    entidade: string;
    entidadeId: string;
    acao: AcaoAudit;
    antes?: unknown;
    depois?: unknown;
    userId: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        acao: params.acao,
        antes: params.antes as never,
        depois: params.depois as never,
        userId: params.userId,
      },
    });
  }
}
