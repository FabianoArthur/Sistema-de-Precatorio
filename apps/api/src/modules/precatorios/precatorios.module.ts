import { Module } from '@nestjs/common';
import { PrecatoriosController } from './precatorios.controller';
import { PrecatoriosService } from './precatorios.service';

@Module({
  controllers: [PrecatoriosController],
  providers: [PrecatoriosService],
  exports: [PrecatoriosService],
})
export class PrecatoriosModule {}
