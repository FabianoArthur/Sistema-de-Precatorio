import { Global, Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';
import { SlaJob } from './sla.job';

@Global()
@Module({
  controllers: [NotificacoesController],
  providers: [NotificacoesService, SlaJob],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
