import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type DashboardAlertaSla,
  type DashboardData,
  type DashboardEstagioCard,
  type DashboardKpis,
  ESTAGIOS_TERMINAIS,
  EstagioPrecatorio,
  StatusCotacao,
} from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const TODOS_ESTAGIOS = Object.values(EstagioPrecatorio) as EstagioPrecatorio[];
const NAO_TERMINAIS = TODOS_ESTAGIOS.filter((e) => !ESTAGIOS_TERMINAIS.includes(e));

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private slaConfigurado(): number {
    return Number(this.config.get('SLA_PARADO_DIAS', 7));
  }

  async getDashboard(): Promise<DashboardData> {
    const [cards, alertasSla, kpis] = await Promise.all([
      this.getCards(),
      this.getAlertasSla(),
      this.getKpis(),
    ]);
    return { cards, alertasSla, kpis, slaConfigurado: this.slaConfigurado() };
  }

  async getCards(): Promise<DashboardEstagioCard[]> {
    const grouped = await this.prisma.precatorio.groupBy({
      by: ['estagioAtual'],
      _count: { _all: true },
      _sum: { valorOriginal: true, valorAtualizado: true },
    });

    const byEstagio = new Map(grouped.map((g) => [g.estagioAtual as EstagioPrecatorio, g]));

    return TODOS_ESTAGIOS.map((estagio) => {
      const g = byEstagio.get(estagio);
      const valorEfetivo = this.somaEfetiva(g?._sum.valorAtualizado, g?._sum.valorOriginal);
      return {
        estagio,
        quantidade: g?._count._all ?? 0,
        valorTotal: valorEfetivo,
      };
    });
  }

  async getAlertasSla(): Promise<DashboardAlertaSla[]> {
    const sla = this.slaConfigurado();
    const corte = new Date();
    corte.setDate(corte.getDate() - sla);

    const precatorios = await this.prisma.precatorio.findMany({
      where: {
        estagioAtual: { in: NAO_TERMINAIS },
        estagioDesde: { lte: corte },
      },
      include: { cedente: { select: { nome: true } } },
      orderBy: { estagioDesde: 'asc' },
      take: 50,
    });

    const hoje = Date.now();
    return precatorios.map((p) => ({
      id: p.id,
      numeroPrecatorio: p.numeroPrecatorio,
      numeroProcesso: p.numeroProcesso,
      cedenteNome: p.cedente.nome,
      estagioAtual: p.estagioAtual as EstagioPrecatorio,
      estagioDesde: p.estagioDesde.toISOString(),
      diasParado: Math.floor((hoje - p.estagioDesde.getTime()) / (1000 * 60 * 60 * 24)),
      valorEfetivo: Number(p.valorAtualizado ?? p.valorOriginal),
    }));
  }

  async getKpis(): Promise<DashboardKpis> {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [pipelineAgg, concluidosAgg, perdidosAgg, cotacoesPend, anexosOcrPend] =
      await Promise.all([
        this.prisma.precatorio.aggregate({
          where: { estagioAtual: { in: NAO_TERMINAIS } },
          _count: { _all: true },
          _sum: { valorOriginal: true, valorAtualizado: true },
        }),
        this.prisma.precatorio.aggregate({
          where: {
            estagioAtual: EstagioPrecatorio.CONCLUIDO,
            updatedAt: { gte: inicioMes },
          },
          _count: { _all: true },
          _sum: { valorOriginal: true, valorAtualizado: true },
        }),
        this.prisma.precatorio.aggregate({
          where: {
            estagioAtual: EstagioPrecatorio.PERDIDOS_ARQUIVADOS,
            updatedAt: { gte: inicioMes },
          },
          _count: { _all: true },
        }),
        this.prisma.cotacao.count({ where: { status: StatusCotacao.PENDENTE } }),
        this.prisma.anexo.count({
          where: { ocrStatus: { in: ['PROCESSANDO', 'NAO_PROCESSADO'] } },
        }),
      ]);

    return {
      pipelineTotal: {
        quantidade: pipelineAgg._count._all,
        valor: this.somaEfetiva(pipelineAgg._sum.valorAtualizado, pipelineAgg._sum.valorOriginal),
      },
      concluidosMesAtual: {
        quantidade: concluidosAgg._count._all,
        valor: this.somaEfetiva(
          concluidosAgg._sum.valorAtualizado,
          concluidosAgg._sum.valorOriginal,
        ),
      },
      perdidosMesAtual: { quantidade: perdidosAgg._count._all },
      cotacoesPendentes: cotacoesPend,
      anexosOcrPendentes: anexosOcrPend,
    };
  }

  private somaEfetiva(atualizado?: Prisma.Decimal | null, original?: Prisma.Decimal | null) {
    return Number(atualizado ?? original ?? 0);
  }
}
