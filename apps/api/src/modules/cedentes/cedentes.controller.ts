import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CedentesService } from './cedentes.service';

@ApiTags('cedentes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cedentes')
export class CedentesController {
  constructor(private readonly cedentesService: CedentesService) {}
}
