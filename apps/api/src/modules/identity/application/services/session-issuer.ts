import { Injectable } from '@nestjs/common';
import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { RefreshTokenValue } from '../../domain/refresh-token';
import type { User } from '../../domain/user';
import {
  AccessTokens,
  AuthSettings,
  OpaqueTokenSecrets,
  SessionRepository,
} from '../ports/auth-ports';

export interface IssuedTokens {
  accessToken: string;
  expiresInSeconds: number;
  /** The phone keeps it in secure storage (ADR 0005). */
  refreshToken: string;
}

/** Creates sessions and the token pairs inside them. Callers provide the transaction. */
@Injectable()
export class SessionIssuer {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly secrets: OpaqueTokenSecrets,
    private readonly accessTokens: AccessTokens,
    private readonly settings: AuthSettings,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async startSession(user: User): Promise<IssuedTokens> {
    const sessionId = this.ids.uuid();
    await this.sessions.createSession({
      id: sessionId,
      userId: user.id,
      createdAt: this.clock.now(),
      revokedAt: null,
    });
    return this.issueTokens(user, sessionId);
  }

  /** A new refresh token in the same session (family) plus a fresh access token. */
  async issueTokens(user: User, sessionId: string): Promise<IssuedTokens> {
    const now = this.clock.now();
    const value = RefreshTokenValue.of(this.ids.uuid(), this.secrets.generateSecret());
    await this.sessions.saveRefreshToken({
      id: value.id,
      sessionId,
      secretHash: this.secrets.hash(value.secret),
      expiresAt: new Date(now.getTime() + this.settings.refreshTokenTtlDays * 86_400_000),
      usedAt: null,
      createdAt: now,
    });
    const access = await this.accessTokens.issue(user.id);
    return {
      accessToken: access.token,
      expiresInSeconds: access.expiresInSeconds,
      refreshToken: value.toString(),
    };
  }
}
