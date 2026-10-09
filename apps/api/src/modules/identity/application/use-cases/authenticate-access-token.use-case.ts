import { Injectable } from '@nestjs/common';
import { UnauthenticatedError } from '../../domain/errors';
import { AccessTokens } from '../ports/auth-ports';

/**
 * Stateless check of an access token (signature + expiry); returns the user id. Revocation is handled by keeping
 * access tokens short (15 min) and refusing to refresh a revoked session.
 */
@Injectable()
export class AuthenticateAccessTokenUseCase {
  constructor(private readonly accessTokens: AccessTokens) {}

  async execute(token: string): Promise<string> {
    try {
      return await this.accessTokens.verify(token);
    } catch {
      throw new UnauthenticatedError();
    }
  }
}
