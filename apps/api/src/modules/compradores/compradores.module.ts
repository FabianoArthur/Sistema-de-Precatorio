import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CompradoresController } from './compradores.controller';
import { CompradoresService } from './compradores.service';

@Module({
  imports: [AuditLogModule],
  controllers: [CompradoresController],
  providers: [CompradoresService],
  exports: [CompradoresService],
})
export class CompradoresModule {}
