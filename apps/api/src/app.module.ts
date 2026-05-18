import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { AnexosModule } from './modules/anexos/anexos.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { CedentesModule } from './modules/cedentes/cedentes.module';
import { CompradoresModule } from './modules/compradores/compradores.module';
import { CotacoesModule } from './modules/cotacoes/cotacoes.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NegociacoesModule } from './modules/negociacoes/negociacoes.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { ParceirosModule } from './modules/parceiros/parceiros.module';
import { PrecatoriosModule } from './modules/precatorios/precatorios.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 20 },
      { name: 'medium', ttl: 60_000, limit: 300 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CedentesModule,
    ParceirosModule,
    CompradoresModule,
    PrecatoriosModule,
    AnexosModule,
    CotacoesModule,
    NegociacoesModule,
    AuditLogModule,
    NotificacoesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
