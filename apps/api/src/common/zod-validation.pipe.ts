import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

export type ZodValidationTarget = 'body' | 'query' | 'param';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private targetType: ZodValidationTarget = 'body',
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== this.targetType) return value;
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          message: 'Erro de validação',
          errors: err.errors,
        });
      }
      throw err;
    }
  }
}
