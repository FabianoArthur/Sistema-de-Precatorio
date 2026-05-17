import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NegociacoesService } from './negociacoes.service';

@ApiTags('negociacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('negociacoes')
export class NegociacoesController {
  constructor(private readonly negociacoesService: NegociacoesService) {}
}
