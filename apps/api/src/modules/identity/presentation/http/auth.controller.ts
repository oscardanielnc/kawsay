import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LoginRequest, RefreshRequest, type TokenResponse } from '@kawsay/contracts/auth';
import { ZodValidationPipe } from '../../../../shared/presentation/http/zod-validation.pipe';
import { UserRepository } from '../../application/ports/auth-ports';
import type { IssuedTokens } from '../../application/services/session-issuer';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { UnauthenticatedError } from '../../domain/errors';
import type { User } from '../../domain/user';
import { AccessTokenGuard, CurrentUserId } from './access-token.guard';

const present = (tokens: IssuedTokens, user: User): TokenResponse => ({
  accessToken: tokens.accessToken,
  tokenType: 'Bearer',
  expiresIn: tokens.expiresInSeconds,
  refreshToken: tokens.refreshToken,
  user: { id: user.id, email: user.email },
});

/** Sign-in for the phone: both tokens travel in the body; the app keeps the refresh token in secure storage. */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshSessionUseCase,
    private readonly logout: LogoutUseCase,
    private readonly users: UserRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async signIn(@Body(new ZodValidationPipe(LoginRequest)) body: LoginRequest) {
    const result = await this.login.execute(body);
    return present(result, result.user);
  }

  /** Rotates the refresh token and returns a new pair. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async rotate(@Body(new ZodValidationPipe(RefreshRequest)) body: RefreshRequest) {
    const result = await this.refresh.execute(body.refreshToken);
    return present(result, result.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(@Body(new ZodValidationPipe(RefreshRequest)) body: RefreshRequest) {
    await this.logout.execute(body.refreshToken);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@CurrentUserId() userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthenticatedError();
    return { id: user.id, email: user.email };
  }
}
