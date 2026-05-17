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
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CedenteCreateInput,
  cedenteCreateSchema,
  type CedenteUpdateInput,
  cedenteUpdateSchema,
} from '@preca/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CedentesService } from './cedentes.service';

@ApiTags('cedentes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cedentes')
export class CedentesController {
  constructor(private readonly cedentesService: CedentesService) {}

  @Get()
  list() {
    return this.cedentesService.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cedentesService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(cedenteCreateSchema))
  create(@Body() body: CedenteCreateInput, @CurrentUser() user: CurrentUserPayload) {
    return this.cedentesService.create(body, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(cedenteUpdateSchema)) body: CedenteUpdateInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.cedentesService.update(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.cedentesService.remove(id, user.id);
  }
}
