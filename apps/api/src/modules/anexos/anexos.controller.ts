import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnexosService } from './anexos.service';

@ApiTags('anexos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('anexos')
export class AnexosController {
  constructor(private readonly anexosService: AnexosService) {}
}
