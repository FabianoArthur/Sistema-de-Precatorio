import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AcaoAudit,
  type CotacaoRecusarInput,
  type CotacaoResponderInput,
  EstagioPrecatorio,
  type MotivoBloqueio,
  type MotivoMatch,
  StatusCotacao,
  TipoNotificacao,
  avaliarMatch,
} from '@preca/shared';
import type { Comprador } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

const ESTAGIOS_ANTES_COTACAO: EstagioPrecatorio[] = [
  EstagioPrecatorio.NOVOS_RECEBIMENTOS,
  EstagioPrecatorio.TRIAGEM,
];

@Injectable()
export class CotacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async sugeridos(precatorioId: string) {
    const precatorio = await this.prisma.precatorio.findUnique({
      where: { id: precatorioId },
      select: {
        id: true,
        devedorTipo: true,
        devedorUf: true,
        devedorMunicipio: true,
        score: true,
      },
    });
    if (!precatorio) throw new NotFoundException('Precatório não encontrado');

    const [compradores, cotacoesExistentes] = await Promise.all([
      this.prisma.comprador.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
      this.prisma.cotacao.findMany({
        where: { precatorioId },
        select: { compradorId: true },
      }),
    ]);

    const jaCotados = new Set(cotacoesExistentes.map((c) => c.compradorId));
    const disponiveis = compradores.filter((c) => !jaCotados.has(c.id));

    const sugeridos: Array<{
      comprador: Comprador;
      pontuacao: number;
      motivos: MotivoMatch[];
    }> = [];
    const outros: Array<{ comprador: Comprador; bloqueios: MotivoBloqueio[] }> = [];

    for (const c of disponiveis) {
      const r = avaliarMatch(c, precatorio);
      if (r.ok) {
        sugeridos.push({ comprador: c, pontuacao: r.pontuacao, motivos: r.motivos });
      } else {
        outros.push({ comprador: c, bloqueios: r.bloqueios });
      }
    }

    sugeridos.sort((a, b) => b.pontuacao - a.pontuacao);

    return { sugeridos, outros };
  }

  async enviar(precatorioId: string, compradorIds: string[], userId: string) {
    if (compradorIds.length === 0) {
      throw new BadRequestException('Selecione ao menos um comprador');
    }

    return this.prisma.$transaction(async (tx) => {
      const precatorio = await tx.precatorio.findUnique({ where: { id: precatorioId } });
      if (!precatorio) throw new NotFoundException('Precatório não encontrado');

      const compradores = await tx.comprador.findMany({
        where: { id: { in: compradorIds } },
        select: { id: true },
      });
      if (compradores.length !== compradorIds.length) {
        throw new BadRequestException('Um ou mais compradores não existem');
      }

      const cotacoesCriadas: Awaited<ReturnType<typeof tx.cotacao.create>>[] = [];
      for (const compradorId of compradorIds) {
        try {
          const c = await tx.cotacao.create({
            data: { precatorioId, compradorId },
            include: { comprador: true },
          });
          cotacoesCriadas.push(c);
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            continue;
          }
          throw err;
        }
      }

      for (const c of cotacoesCriadas) {
        await tx.auditLog.create({
          data: {
            entidade: 'cotacao',
            entidadeId: c.id,
            acao: AcaoAudit.CREATE,
            depois: c as unknown as Prisma.InputJsonValue,
            userId,
          },
        });
      }

      if (
        cotacoesCriadas.length > 0 &&
        ESTAGIOS_ANTES_COTACAO.includes(precatorio.estagioAtual as EstagioPrecatorio)
      ) {
        const estagioAnterior = precatorio.estagioAtual;
        await tx.precatorio.update({
          where: { id: precatorioId },
          data: {
            estagioAtual: EstagioPrecatorio.ENVIADO_COTACAO,
            estagioDesde: new Date(),
          },
        });
        await tx.historicoEstagio.create({
          data: {
            precatorioId,
            estagioAnterior,
            estagioNovo: EstagioPrecatorio.ENVIADO_COTACAO,
            observacao: 'Avanço automático ao solicitar cotações',
            userId,
          },
        });
        await tx.auditLog.create({
          data: {
            entidade: 'precatorio',
            entidadeId: precatorioId,
            acao: AcaoAudit.MUDANCA_ESTAGIO,
            antes: { estagioAtual: estagioAnterior } as Prisma.InputJsonValue,
            depois: {
              estagioAtual: EstagioPrecatorio.ENVIADO_COTACAO,
              observacao: 'Avanço automático ao solicitar cotações',
            } as Prisma.InputJsonValue,
            userId,
          },
        });
      }

      return {
        criadas: cotacoesCriadas.length,
        duplicadas: compradorIds.length - cotacoesCriadas.length,
        cotacoes: cotacoesCriadas,
      };
    });
  }

  async responder(id: string, data: CotacaoResponderInput, userId: string) {
    const antes = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.cotacao.update({
        where: { id },
        data: {
          status: StatusCotacao.RECEBIDA,
          valorBruto: new Prisma.Decimal(data.valorBruto),
          comissao: new Prisma.Decimal(data.comissao),
          observacao: data.observacao ?? null,
          dataResposta: new Date(),
        },
        include: { comprador: true },
      });
      await tx.auditLog.create({
        data: {
          entidade: 'cotacao',
          entidadeId: id,
          acao: AcaoAudit.UPDATE,
          antes: antes as unknown as Prisma.InputJsonValue,
          depois: depois as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
      await this.notificacoes.criarParaTodos({
        tipo: TipoNotificacao.COTACAO_RESPONDIDA,
        mensagem: `${depois.comprador.nome} respondeu R$ ${data.valorBruto.toLocaleString('pt-BR')}.`,
        link: `/precatorios/${depois.precatorioId}`,
        excetoUserId: userId,
        tx,
      });
      return depois;
    });
  }

  async recusar(id: string, data: CotacaoRecusarInput, userId: string) {
    const antes = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.cotacao.update({
        where: { id },
        data: {
          status: StatusCotacao.RECUSADA,
          observacao: data.observacao ?? null,
          dataResposta: new Date(),
        },
        include: { comprador: true },
      });
      await tx.auditLog.create({
        data: {
          entidade: 'cotacao',
          entidadeId: id,
          acao: AcaoAudit.UPDATE,
          antes: antes as unknown as Prisma.InputJsonValue,
          depois: depois as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
      await this.notificacoes.criarParaTodos({
        tipo: TipoNotificacao.COTACAO_RECUSADA,
        mensagem: `${depois.comprador.nome} recusou cotação.`,
        link: `/precatorios/${depois.precatorioId}`,
        excetoUserId: userId,
        tx,
      });
      return depois;
    });
  }

  async remove(id: string, userId: string) {
    const antes = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.cotacao.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          entidade: 'cotacao',
          entidadeId: id,
          acao: AcaoAudit.DELETE,
          antes: antes as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
    });
  }

  private async findOne(id: string) {
    const cotacao = await this.prisma.cotacao.findUnique({
      where: { id },
      include: { comprador: true },
    });
    if (!cotacao) throw new NotFoundException('Cotação não encontrada');
    return cotacao;
  }
}
