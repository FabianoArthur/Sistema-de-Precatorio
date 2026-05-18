import { promises as fs, createReadStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AcaoAudit,
  type AplicarValorInput,
  type CampoAplicavel,
  type DadosExtraidos,
  OcrStatus,
  TipoNotificacao,
} from '@preca/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { processarPdf } from './ocr';

const UPLOADS_ROOT = resolve(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function resolveUploadPath(relPath: string): string {
  const abs = resolve(UPLOADS_ROOT, relPath);
  if (!abs.startsWith(`${UPLOADS_ROOT}/`) && abs !== UPLOADS_ROOT) {
    throw new NotFoundException('Caminho de arquivo inválido');
  }
  return abs;
}

@Injectable()
export class AnexosService {
  private readonly logger = new Logger(AnexosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async listByPrecatorio(precatorioId: string) {
    return this.prisma.anexo.findMany({
      where: { precatorioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const anexo = await this.prisma.anexo.findUnique({ where: { id } });
    if (!anexo) throw new NotFoundException('Anexo não encontrado');
    return anexo;
  }

  async upload(precatorioId: string, file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Arquivo excede 20MB');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Apenas PDFs são aceitos');
    }

    const precatorio = await this.prisma.precatorio.findUnique({
      where: { id: precatorioId },
      select: { id: true, devedorTipo: true },
    });
    if (!precatorio) throw new NotFoundException('Precatório não encontrado');

    const anexo = await this.prisma.$transaction(async (tx) => {
      const created = await tx.anexo.create({
        data: {
          precatorioId,
          nome: file.originalname,
          url: '',
          contentType: file.mimetype,
          tamanho: file.size,
          createdById: userId,
        },
      });

      const relPath = `${precatorioId}/${created.id}.pdf`;
      const absPath = resolveUploadPath(relPath);
      await fs.mkdir(dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, file.buffer);

      const updated = await tx.anexo.update({
        where: { id: created.id },
        data: { url: relPath },
      });

      await tx.auditLog.create({
        data: {
          entidade: 'anexo',
          entidadeId: created.id,
          acao: AcaoAudit.CREATE,
          depois: updated as unknown as Prisma.InputJsonValue,
          userId,
        },
      });

      return updated;
    });

    this.enqueueOcr(anexo.id, precatorio.devedorTipo);
    return anexo;
  }

  async remove(id: string, userId: string) {
    const anexo = await this.findOne(id);
    const absPath = resolveUploadPath(anexo.url);
    await this.prisma.$transaction(async (tx) => {
      await tx.anexo.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          entidade: 'anexo',
          entidadeId: id,
          acao: AcaoAudit.DELETE,
          antes: anexo as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
    });
    await fs.unlink(absPath).catch((err) => {
      this.logger.warn(`Falha ao apagar arquivo ${absPath}: ${(err as Error).message}`);
    });
  }

  async download(id: string) {
    const anexo = await this.findOne(id);
    const absPath = resolveUploadPath(anexo.url);
    try {
      await fs.access(absPath);
    } catch {
      throw new NotFoundException('Arquivo físico não encontrado');
    }
    return { stream: createReadStream(absPath), anexo };
  }

  async reprocessar(id: string, userId: string) {
    const anexo = await this.findOne(id);
    const precatorio = await this.prisma.precatorio.findUnique({
      where: { id: anexo.precatorioId },
      select: { devedorTipo: true },
    });
    await this.prisma.anexo.update({
      where: { id },
      data: {
        ocrStatus: OcrStatus.NAO_PROCESSADO,
        dadosExtraidos: Prisma.JsonNull,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        entidade: 'anexo',
        entidadeId: id,
        acao: AcaoAudit.UPDATE,
        antes: { ocrStatus: anexo.ocrStatus } as Prisma.InputJsonValue,
        depois: {
          ocrStatus: OcrStatus.NAO_PROCESSADO,
          reprocessado: true,
        } as Prisma.InputJsonValue,
        userId,
      },
    });
    this.enqueueOcr(id, precatorio?.devedorTipo);
  }

  async aplicarValor(id: string, body: AplicarValorInput, userId: string) {
    const anexo = await this.findOne(id);
    const dados = anexo.dadosExtraidos as DadosExtraidos | null;
    if (!dados) throw new BadRequestException('OCR ainda não processado');

    const valor = dados[body.campo as keyof DadosExtraidos];
    if (valor === undefined || valor === null) {
      throw new BadRequestException(`Campo "${body.campo}" não foi extraído do OCR`);
    }

    const precatorio = await this.prisma.precatorio.findUnique({
      where: { id: anexo.precatorioId },
    });
    if (!precatorio) throw new NotFoundException('Precatório não encontrado');

    const updateData = this.buildUpdatePayload(body.campo, valor);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.precatorio.update({
        where: { id: anexo.precatorioId },
        data: updateData,
        include: { cedente: true, parceiro: true },
      });
      await tx.auditLog.create({
        data: {
          entidade: 'precatorio',
          entidadeId: anexo.precatorioId,
          acao: AcaoAudit.UPDATE,
          antes: precatorio as unknown as Prisma.InputJsonValue,
          depois: updated as unknown as Prisma.InputJsonValue,
          userId,
        },
      });
      return updated;
    });
  }

  private buildUpdatePayload(campo: CampoAplicavel, valor: unknown): Prisma.PrecatorioUpdateInput {
    switch (campo) {
      case 'valorOriginal':
        return { valorOriginal: new Prisma.Decimal(valor as number) };
      case 'valorAtualizado':
        return { valorAtualizado: new Prisma.Decimal(valor as number) };
      case 'numeroPrecatorio':
        return { numeroPrecatorio: String(valor) };
      case 'numeroProcesso':
        return { numeroProcesso: String(valor) };
      case 'tribunal':
        return { tribunal: String(valor) };
      case 'vara':
        return { vara: String(valor) };
      case 'dataExpedicao':
        return { dataExpedicao: new Date(String(valor)) };
      default: {
        const _exhaustive: never = campo;
        throw new BadRequestException(`Campo não suportado: ${_exhaustive}`);
      }
    }
  }

  private enqueueOcr(anexoId: string, hint?: string | null) {
    setImmediate(() => {
      this.processarAnexo(anexoId, hint as 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | undefined).catch(
        (err) => {
          this.logger.error(`OCR job falhou para anexo ${anexoId}: ${(err as Error).message}`);
        },
      );
    });
  }

  private async processarAnexo(anexoId: string, hint?: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL') {
    const anexo = await this.prisma.anexo.findUnique({ where: { id: anexoId } });
    if (!anexo) return;

    this.logger.log(`OCR iniciado para anexo ${anexoId} (hint=${hint ?? 'nenhum'})`);

    await this.prisma.anexo.update({
      where: { id: anexoId },
      data: { ocrStatus: OcrStatus.PROCESSANDO },
    });

    try {
      const absPath = resolveUploadPath(anexo.url);
      const buffer = await fs.readFile(absPath);
      const dados = await processarPdf(buffer, hint);
      const status = dados.erro || !dados.parsedBy ? OcrStatus.FALHOU : OcrStatus.EXTRAIDO;
      await this.prisma.anexo.update({
        where: { id: anexoId },
        data: {
          ocrStatus: status,
          dadosExtraidos: dados as unknown as Prisma.InputJsonValue,
        },
      });
      this.logger.log(`OCR ${status} para anexo ${anexoId} (parser=${dados.parsedBy ?? 'nenhum'})`);

      await this.prisma.auditLog.create({
        data: {
          entidade: 'anexo',
          entidadeId: anexoId,
          acao: AcaoAudit.UPDATE,
          antes: { ocrStatus: OcrStatus.PROCESSANDO } as Prisma.InputJsonValue,
          depois: {
            ocrStatus: status,
            parsedBy: dados.parsedBy,
          } as Prisma.InputJsonValue,
          userId: anexo.createdById,
        },
      });

      const tipo =
        status === OcrStatus.EXTRAIDO
          ? TipoNotificacao.ANEXO_OCR_EXTRAIDO
          : TipoNotificacao.ANEXO_OCR_FALHOU;
      const msg =
        status === OcrStatus.EXTRAIDO
          ? `OCR extraído de "${anexo.nome}" (${dados.parsedBy?.toUpperCase()}).`
          : `OCR falhou em "${anexo.nome}": ${dados.erro ?? 'parser não identificado'}.`;
      await this.notificacoes.criarParaTodos({
        tipo,
        mensagem: msg,
        link: `/precatorios/${anexo.precatorioId}`,
        excetoUserId: anexo.createdById,
      });
    } catch (err) {
      this.logger.error(`OCR falhou para anexo ${anexoId}: ${(err as Error).message}`);
      await this.prisma.anexo.update({
        where: { id: anexoId },
        data: {
          ocrStatus: OcrStatus.FALHOU,
          dadosExtraidos: {
            erro: (err as Error).message,
          } as unknown as Prisma.InputJsonValue,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          entidade: 'anexo',
          entidadeId: anexoId,
          acao: AcaoAudit.UPDATE,
          antes: { ocrStatus: OcrStatus.PROCESSANDO } as Prisma.InputJsonValue,
          depois: {
            ocrStatus: OcrStatus.FALHOU,
            erro: (err as Error).message,
          } as Prisma.InputJsonValue,
          userId: anexo.createdById,
        },
      });
      await this.notificacoes.criarParaTodos({
        tipo: TipoNotificacao.ANEXO_OCR_FALHOU,
        mensagem: `OCR falhou em "${anexo.nome}": ${(err as Error).message}`,
        link: `/precatorios/${anexo.precatorioId}`,
        excetoUserId: anexo.createdById,
      });
    }
  }
}
