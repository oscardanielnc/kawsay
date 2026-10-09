import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from '../../config/app-config';
import {
  AccessTokens,
  AuthSettings,
  OpaqueTokenSecrets,
  PasswordHasher,
  SessionRepository,
  UserRepository,
} from './application/ports/auth-ports';
import { SessionIssuer } from './application/services/session-issuer';
import { AuthenticateAccessTokenUseCase } from './application/use-cases/authenticate-access-token.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { Argon2PasswordHasher, NodeOpaqueTokenSecrets } from './infrastructure/crypto/auth-crypto';
import { JwtAccessTokens } from './infrastructure/crypto/jwt-access-tokens';
import {
  PrismaSessionRepository,
  PrismaUserRepository,
} from './infrastructure/persistence/prisma/prisma-auth.repositories';
import { AccessTokenGuard } from './presentation/http/access-token.guard';
import { AuthController } from './presentation/http/auth.controller';

@Module({
  imports: [
    JwtModule.register({}),
    // Brute-force protection for login and refresh (applied per route with ThrottlerGuard).
    ThrottlerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => [
        { ttl: 60_000, limit: config.auth.loginRateLimitPerMinute },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Ports → adapters: the only place that knows which implementation runs.
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: OpaqueTokenSecrets, useClass: NodeOpaqueTokenSecrets },
    { provide: AccessTokens, useClass: JwtAccessTokens },
    {
      provide: AuthSettings,
      useFactory: (config: AppConfig): AuthSettings => ({
        refreshTokenTtlDays: config.auth.refreshTokenTtlDays,
      }),
      inject: [AppConfig],
    },
    SessionIssuer,
    AuthenticateAccessTokenUseCase,
    CreateUserUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    AccessTokenGuard,
  ],
  // Public API of the module: other modules guard their routes with these, never touch the repositories.
  exports: [AccessTokenGuard, AuthenticateAccessTokenUseCase, CreateUserUseCase],
})
export class IdentityModule {}
