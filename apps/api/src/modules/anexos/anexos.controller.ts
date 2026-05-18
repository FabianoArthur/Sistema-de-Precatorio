import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { type AplicarValorInput, aplicarValorSchema } from '@preca/shared';
import type { Response } from 'express';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnexosService } from './anexos.service';

@ApiTags('anexos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AnexosController {
  constructor(private readonly anexosService: AnexosService) {}

  @Get('precatorios/:precatorioId/anexos')
  list(@Param('precatorioId', ParseUUIDPipe) precatorioId: string) {
    return this.anexosService.listByPrecatorio(precatorioId);
  }

  @Post('precatorios/:precatorioId/anexos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  upload(
    @Param('precatorioId', ParseUUIDPipe) precatorioId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.anexosService.upload(precatorioId, file, user.id);
  }

  @Get('anexos/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.anexosService.findOne(id);
  }

  @Get('anexos/:id/download')
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { stream, anexo } = await this.anexosService.download(id);
    res.setHeader('Content-Type', anexo.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(anexo.nome)}"`);
    stream.on('error', () => {
      throw new NotFoundException('Falha ao ler arquivo');
    });
    stream.pipe(res);
  }

  @Post('anexos/:id/reprocessar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reprocessar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.anexosService.reprocessar(id, user.id);
  }

  @Post('anexos/:id/aplicar')
  aplicar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(aplicarValorSchema)) body: AplicarValorInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.anexosService.aplicarValor(id, body, user.id);
  }

  @Delete('anexos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.anexosService.remove(id, user.id);
  }
}
