import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../../../../config/app-config';
import { AccessTokens } from '../../application/ports/auth-ports';

interface AccessTokenPayload {
  sub: string;
  typ: 'access';
}

/** HS256 JWTs. The algorithm is pinned on verify, so a forged `alg: none` token is rejected. */
@Injectable()
export class JwtAccessTokens extends AccessTokens {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {
    super();
  }

  async issue(userId: string): Promise<{ token: string; expiresInSeconds: number }> {
    const expiresInSeconds = this.config.auth.accessTokenTtlSeconds;
    const payload: AccessTokenPayload = { sub: userId, typ: 'access' };
    const token = await this.jwt.signAsync(payload, {
      secret: this.config.auth.accessTokenSecret,
      algorithm: 'HS256',
      expiresIn: expiresInSeconds,
    });
    return { token, expiresInSeconds };
  }

  async verify(token: string): Promise<string> {
    const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.auth.accessTokenSecret,
      algorithms: ['HS256'],
    });
    if (payload.typ !== 'access' || !payload.sub) throw new Error('Not an access token');
    return payload.sub;
  }
}
