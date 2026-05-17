import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParceirosService } from './parceiros.service';

@ApiTags('parceiros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parceiros')
export class ParceirosController {
  constructor(private readonly parceirosService: ParceirosService) {}
}
