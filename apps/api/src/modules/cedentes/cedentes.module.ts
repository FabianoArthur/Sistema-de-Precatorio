import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CedentesController } from './cedentes.controller';
import { CedentesService } from './cedentes.service';

@Module({
  imports: [AuditLogModule],
  controllers: [CedentesController],
  providers: [CedentesService],
  exports: [CedentesService],
})
export class CedentesModule {}
