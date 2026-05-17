import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ParceirosController } from './parceiros.controller';
import { ParceirosService } from './parceiros.service';

@Module({
  imports: [AuditLogModule],
  controllers: [ParceirosController],
  providers: [ParceirosService],
  exports: [ParceirosService],
})
export class ParceirosModule {}
