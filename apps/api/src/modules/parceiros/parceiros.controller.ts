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
  type ParceiroCreateInput,
  parceiroCreateSchema,
  type ParceiroUpdateInput,
  parceiroUpdateSchema,
} from '@preca/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ParceirosService } from './parceiros.service';

@ApiTags('parceiros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parceiros')
export class ParceirosController {
  constructor(private readonly parceirosService: ParceirosService) {}

  @Get()
  list() {
    return this.parceirosService.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.parceirosService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(parceiroCreateSchema))
  create(@Body() body: ParceiroCreateInput, @CurrentUser() user: CurrentUserPayload) {
    return this.parceirosService.create(body, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(parceiroUpdateSchema)) body: ParceiroUpdateInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.parceirosService.update(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.parceirosService.remove(id, user.id);
  }
}
