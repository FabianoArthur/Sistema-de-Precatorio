import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AcaoAudit,
  type MudarEstagioInput,
  type PrecatorioCreateInput,
  type PrecatorioFilters,
  type PrecatorioUpdateInput,
  type ScorePrecatorio,
  calcularScore,
} from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrecatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  list(filters: PrecatorioFilters = {}) {
    const where: Prisma.PrecatorioWhereInput = {};
    if (filters.estagioAtual) where.estagioAtual = filters.estagioAtual;
    if (filters.devedorTipo) where.devedorTipo = filters.devedorTipo;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.score) where.score = filters.score;
    if (filters.search) {
      where.OR = [
        { numeroPrecatorio: { contains: filters.search, mode: 'insensitive' } },
        { numeroProcesso: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.precatorio.findMany({
      where,
      include: { cedente: true, parceiro: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const precatorio = await this.prisma.precatorio.findUnique({
      where: { id },
      include: {
        cedente: true,
        parceiro: true,
        anexos: { orderBy: { createdAt: 'desc' } },
        cotacoes: { include: { comprador: true }, orderBy: { valorBruto: 'desc' } },
        negociacoes: { orderBy: { createdAt: 'desc' } },
        historico: {
          include: { user: { select: { id: true, nome: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!precatorio) throw new NotFoundException('Precatório não encontrado');
    return precatorio;
  }

  private toDecimal(v: number | undefined | null): Prisma.Decimal | undefined {
    if (v === undefined || v === null) return undefined;
    return new Prisma.Decimal(v);
  }

  async create(data: PrecatorioCreateInput, userId: string) {
    const valorParaScore = data.valorAtualizado ?? data.valorOriginal;
    const score = calcularScore(valorParaScore);

    return this.prisma.$transaction(async (tx) => {
      const precatorio = await tx.precatorio.create({
        data: {
          numeroPrecatorio: data.numeroPrecatorio ?? null,
          numeroProcesso: data.numeroProcesso ?? null,
          cedenteId: data.cedenteId,
          escritorioAdvogado: data.escritorioAdvogado ?? null,
          devedorTipo: data.devedorTipo,
          devedorUf: data.devedorUf ?? null,
          devedorMunicipio: data.devedorMunicipio ?? null,
          tipo: data.tipo,
          valorOriginal: this.toDecimal(data.valorOriginal)!,
          valorAtualizado: this.toDecimal(data.valorAtualizado ?? null),
          desagio: this.toDecimal(data.desagio ?? null),
          valorLiquido: this.toDecimal(data.valorLiquido ?? null),
          score,
          tribunal: data.tribunal ?? null,
          vara: data.vara ?? null,
          dataExpedicao: data.dataExpedicao ?? null,
          dataRequisicao: data.dataRequisicao ?? null,
          prazoEstimado: data.prazoEstimado ?? null,
          parceiroId: data.parceiroId ?? null,
        },
        include: { cedente: true, parceiro: true },
      });

      await tx.historicoEstagio.create({
        data: {
          precatorioId: precatorio.id,
          estagioAnterior: null,
          estagioNovo: precatorio.estagioAtual,
          userId,
        },
      });

      await tx.auditLog.create({
        data: {
          entidade: 'precatorio',
          entidadeId: precatorio.id,
          acao: AcaoAudit.CREATE,
          depois: precatorio as unknown as Prisma.InputJsonValue,
          userId,
        },
      });

      return precatorio;
    });
  }

  async update(id: string, data: PrecatorioUpdateInput, userId: string) {
    const antes = await this.findOneBasic(id);

    let score: ScorePrecatorio | undefined;
    if (data.valorOriginal !== undefined || data.valorAtualizado !== undefined) {
      const valor =
        data.valorAtualizado ??
        data.valorOriginal ??
        Number(antes.valorAtualizado ?? antes.valorOriginal);
      score = calcularScore(valor);
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.precatorio.update({
        where: { id },
        data: {
          ...(data.numeroPrecatorio !== undefined && { numeroPrecatorio: data.numeroPrecatorio }),
          ...(data.numeroProcesso !== undefined && { numeroProcesso: data.numeroProcesso }),
          ...(data.cedenteId !== undefined && { cedenteId: data.cedenteId }),
          ...(data.escritorioAdvogado !== undefined && {
            escritorioAdvogado: data.escritorioAdvogado,
          }),
          ...(data.devedorTipo !== undefined && { devedorTipo: data.devedorTipo }),
          ...(data.devedorUf !== undefined && { devedorUf: data.devedorUf }),
          ...(data.devedorMunicipio !== undefined && { devedorMunicipio: data.devedorMunicipio }),
          ...(data.tipo !== undefined && { tipo: data.tipo }),
          ...(data.valorOriginal !== undefined && {
            valorOriginal: this.toDecimal(data.valorOriginal),
          }),
          ...(data.valorAtualizado !== undefined && {
            valorAtualizado: this.toDecimal(data.valorAtualizado),
          }),
          ...(data.desagio !== undefined && { desagio: this.toDecimal(data.desagio) }),
          ...(data.valorLiquido !== undefined && {
            valorLiquido: this.toDecimal(data.valorLiquido),
          }),
          ...(score && { score }),
          ...(data.tribunal !== undefined && { tribunal: data.tribunal }),
          ...(data.vara !== undefined && { vara: data.vara }),
          ...(data.dataExpedicao !== undefined && { dataExpedicao: data.dataExpedicao }),
          ...(data.dataRequisicao !== undefined && { dataRequisicao: data.dataRequisicao }),
          ...(data.prazoEstimado !== undefined && { prazoEstimado: data.prazoEstimado }),
          ...(data.parceiroId !== undefined && { parceiroId: data.parceiroId }),
          ...(data.comissaoTotal !== undefined && {
            comissaoTotal: this.toDecimal(data.comissaoTotal),
          }),
          ...(data.comissaoParceiro !== undefined && {
            comissaoParceiro: this.toDecimal(data.comissaoParceiro),
          }),
        },
        include: { cedente: true, parceiro: true },
      });

      await tx.auditLog.create({
        data: {
          entidade: 'precatorio',
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

  async mudarEstagio(id: string, body: MudarEstagioInput, userId: string) {
    const precatorio = await this.findOneBasic(id);
    if (precatorio.estagioAtual === body.novoEstagio) return precatorio;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.precatorio.update({
        where: { id },
        data: { estagioAtual: body.novoEstagio, estagioDesde: new Date() },
        include: { cedente: true, parceiro: true },
      });

      await tx.historicoEstagio.create({
        data: {
          precatorioId: id,
          estagioAnterior: precatorio.estagioAtual,
          estagioNovo: body.novoEstagio,
          observacao: body.observacao ?? null,
          userId,
        },
      });

      await tx.auditLog.create({
        data: {
          entidade: 'precatorio',
          entidadeId: id,
          acao: AcaoAudit.MUDANCA_ESTAGIO,
          antes: { estagioAtual: precatorio.estagioAtual } as Prisma.InputJsonValue,
          depois: {
            estagioAtual: body.novoEstagio,
            observacao: body.observacao,
          } as Prisma.InputJsonValue,
          userId,
        },
      });

      return updated;
    });
  }

  async remove(id: string, userId: string) {
    const antes = await this.findOneBasic(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.precatorio.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          entidade: 'precatorio',
          entidadeId: id,
          acao: AcaoAudit.DELETE,
          antes: antes as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
    });
  }

  private async findOneBasic(id: string) {
    const p = await this.prisma.precatorio.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Precatório não encontrado');
    return p;
  }
}
