import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type NotificacoesFiltros, notificacoesFiltrosSchema } from '@preca/shared';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificacoesService } from './notificacoes.service';

@ApiTags('notificacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  list(@Query() query: Record<string, string>, @CurrentUser() user: CurrentUserPayload) {
    const filtros: NotificacoesFiltros = notificacoesFiltrosSchema.parse(query);
    return this.notificacoesService.list(user.id, filtros);
  }

  @Get('nao-lidas/contar')
  contar(@CurrentUser() user: CurrentUserPayload) {
    return this.notificacoesService.contarNaoLidas(user.id).then((count) => ({ count }));
  }

  @Patch(':id/lida')
  marcarLida(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.notificacoesService.marcarLida(id, user.id);
  }

  @Post('marcar-todas-lidas')
  marcarTodasLidas(@CurrentUser() user: CurrentUserPayload) {
    return this.notificacoesService.marcarTodasLidas(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.notificacoesService.remove(id, user.id);
  }
}
