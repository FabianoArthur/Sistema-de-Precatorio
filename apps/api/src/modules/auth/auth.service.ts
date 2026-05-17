import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { LoginInput, LoginResponse } from '@preca/shared';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, senha }: LoginInput): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(senha, user.senhaHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      nome: user.nome,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, nome: user.nome },
    };
  }
}
