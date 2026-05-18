import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type NegociacaoCreateInput, negociacaoCreateSchema } from '@preca/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NegociacoesService } from './negociacoes.service';

@ApiTags('negociacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class NegociacoesController {
  constructor(private readonly negociacoesService: NegociacoesService) {}

  @Post('precatorios/:precatorioId/negociacoes')
  create(
    @Param('precatorioId', ParseUUIDPipe) precatorioId: string,
    @Body(new ZodValidationPipe(negociacaoCreateSchema)) body: NegociacaoCreateInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.negociacoesService.create(precatorioId, body, user.id);
  }

  @Delete('negociacoes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.negociacoesService.remove(id, user.id);
  }
}
