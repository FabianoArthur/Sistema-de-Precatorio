import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  email: string;
  nome: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
