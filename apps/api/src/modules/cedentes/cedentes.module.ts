import { Module } from '@nestjs/common';
import { CedentesController } from './cedentes.controller';
import { CedentesService } from './cedentes.service';

@Module({
  controllers: [CedentesController],
  providers: [CedentesService],
  exports: [CedentesService],
})
export class CedentesModule {}
