import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrecatoriosService } from './precatorios.service';

@ApiTags('precatorios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('precatorios')
export class PrecatoriosController {
  constructor(private readonly precatoriosService: PrecatoriosService) {}
}
