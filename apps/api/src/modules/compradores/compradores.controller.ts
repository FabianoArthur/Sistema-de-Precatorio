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
  type CompradorCreateInput,
  compradorCreateSchema,
  type CompradorUpdateInput,
  compradorUpdateSchema,
} from '@preca/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CompradoresService } from './compradores.service';

@ApiTags('compradores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compradores')
export class CompradoresController {
  constructor(private readonly compradoresService: CompradoresService) {}

  @Get()
  list() {
    return this.compradoresService.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.compradoresService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(compradorCreateSchema))
  create(@Body() body: CompradorCreateInput, @CurrentUser() user: CurrentUserPayload) {
    return this.compradoresService.create(body, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(compradorUpdateSchema)) body: CompradorUpdateInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.compradoresService.update(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.compradoresService.remove(id, user.id);
  }
}
