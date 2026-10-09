import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticateAccessTokenUseCase } from '../../application/use-cases/authenticate-access-token.use-case';
import { UnauthenticatedError } from '../../domain/errors';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

/** `Authorization: Bearer <access token>` → the caller's user id on the request. */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly accessTokens: AuthenticateAccessTokenUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthenticatedError();
    request.userId = await this.accessTokens.execute(token);
    return true;
  }
}

/** Id of the signed-in caller. Only valid behind `AccessTokenGuard`. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const userId = context.switchToHttp().getRequest<AuthenticatedRequest>().userId;
    if (!userId) throw new UnauthenticatedError();
    return userId;
  },
);
