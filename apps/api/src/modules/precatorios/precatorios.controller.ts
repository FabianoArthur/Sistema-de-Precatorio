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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type MudarEstagioInput,
  type PrecatorioCreateInput,
  type PrecatorioFilters,
  type PrecatorioUpdateInput,
  mudarEstagioSchema,
  precatorioCreateSchema,
  precatorioFiltersSchema,
  precatorioUpdateSchema,
} from '@preca/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrecatoriosService } from './precatorios.service';

@ApiTags('precatorios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('precatorios')
export class PrecatoriosController {
  constructor(private readonly precatoriosService: PrecatoriosService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const filters: PrecatorioFilters = precatorioFiltersSchema.parse(query);
    return this.precatoriosService.list(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.precatoriosService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(precatorioCreateSchema)) body: PrecatorioCreateInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.precatoriosService.create(body, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(precatorioUpdateSchema)) body: PrecatorioUpdateInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.precatoriosService.update(id, body, user.id);
  }

  @Patch(':id/estagio')
  mudarEstagio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(mudarEstagioSchema)) body: MudarEstagioInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.precatoriosService.mudarEstagio(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.precatoriosService.remove(id, user.id);
  }
}
