import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompradoresService } from './compradores.service';

@ApiTags('compradores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compradores')
export class CompradoresController {
  constructor(private readonly compradoresService: CompradoresService) {}
}
