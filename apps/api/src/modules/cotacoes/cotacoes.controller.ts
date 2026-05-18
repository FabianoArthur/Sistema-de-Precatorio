import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CotacaoEnviarInput,
  type CotacaoRecusarInput,
  type CotacaoResponderInput,
  cotacaoEnviarSchema,
  cotacaoRecusarSchema,
  cotacaoResponderSchema,
} from '@preca/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CotacoesService } from './cotacoes.service';

@ApiTags('cotacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CotacoesController {
  constructor(private readonly cotacoesService: CotacoesService) {}

  @Get('precatorios/:precatorioId/cotacoes/sugeridos')
  sugeridos(@Param('precatorioId', ParseUUIDPipe) precatorioId: string) {
    return this.cotacoesService.sugeridos(precatorioId);
  }

  @Post('precatorios/:precatorioId/cotacoes')
  enviar(
    @Param('precatorioId', ParseUUIDPipe) precatorioId: string,
    @Body(new ZodValidationPipe(cotacaoEnviarSchema)) body: CotacaoEnviarInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.cotacoesService.enviar(precatorioId, body.compradorIds, user.id);
  }

  @Patch('cotacoes/:id/responder')
  responder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(cotacaoResponderSchema)) body: CotacaoResponderInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.cotacoesService.responder(id, body, user.id);
  }

  @Patch('cotacoes/:id/recusar')
  recusar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(cotacaoRecusarSchema)) body: CotacaoRecusarInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.cotacoesService.recusar(id, body, user.id);
  }

  @Delete('cotacoes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.cotacoesService.remove(id, user.id);
  }
}
