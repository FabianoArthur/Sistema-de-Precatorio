import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ESTAGIOS_TERMINAIS,
  ESTAGIO_LABELS,
  EstagioPrecatorio,
  TipoNotificacao,
} from '@preca/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacoesService } from './notificacoes.service';

const TODOS_ESTAGIOS = Object.values(EstagioPrecatorio) as EstagioPrecatorio[];
const NAO_TERMINAIS = TODOS_ESTAGIOS.filter((e) => !ESTAGIOS_TERMINAIS.includes(e));

@Injectable()
export class SlaJob {
  private readonly logger = new Logger(SlaJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async verificarSla() {
    const sla = Number(this.config.get('SLA_PARADO_DIAS', 7));
    const corte = new Date();
    corte.setDate(corte.getDate() - sla);

    const precatorios = await this.prisma.precatorio.findMany({
      where: {
        estagioAtual: { in: NAO_TERMINAIS },
        estagioDesde: { lte: corte },
      },
      include: { cedente: { select: { nome: true } } },
      take: 200,
    });

    this.logger.log(`SLA job: ${precatorios.length} precatórios estouraram SLA de ${sla} dias.`);

    for (const p of precatorios) {
      const diasParado = Math.floor(
        (Date.now() - p.estagioDesde.getTime()) / (1000 * 60 * 60 * 24),
      );
      const numero = p.numeroPrecatorio ?? p.numeroProcesso ?? '(sem nº)';
      const mensagem = `Precatório ${numero} (${p.cedente.nome}) está há ${diasParado} dia(s) em ${ESTAGIO_LABELS[p.estagioAtual as EstagioPrecatorio]}.`;
      await this.notificacoes.criarParaTodos({
        tipo: TipoNotificacao.SLA_ESTOURADO,
        mensagem,
        link: `/precatorios/${p.id}`,
      });
    }
  }
}
