import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CotacoesService } from './cotacoes.service';

@ApiTags('cotacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cotacoes')
export class CotacoesController {
  constructor(private readonly cotacoesService: CotacoesService) {}
}
