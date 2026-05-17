import { Module } from '@nestjs/common';
import { NegociacoesController } from './negociacoes.controller';
import { NegociacoesService } from './negociacoes.service';

@Module({
  controllers: [NegociacoesController],
  providers: [NegociacoesService],
  exports: [NegociacoesService],
})
export class NegociacoesModule {}
