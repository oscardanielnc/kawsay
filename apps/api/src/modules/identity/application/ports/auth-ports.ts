import type { RefreshTokenRecord, SessionRecord } from '../../domain/refresh-token';
import type { User } from '../../domain/user';

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}

export abstract class SessionRepository {
  abstract createSession(session: SessionRecord): Promise<void>;
  abstract findSession(id: string): Promise<SessionRecord | null>;
  abstract revokeSession(id: string, reason: string, at: Date): Promise<void>;
  /** Ends every open session of the user, e.g. after a password change. */
  abstract revokeAllSessions(userId: string, reason: string, at: Date): Promise<void>;
  abstract saveRefreshToken(token: RefreshTokenRecord): Promise<void>;
  abstract findRefreshToken(id: string): Promise<RefreshTokenRecord | null>;
  /**
   * Atomically marks the token as used (`UPDATE … WHERE used_at IS NULL`).
   * Returns false if it was already used: someone presented it twice.
   */
  abstract markRefreshTokenUsed(id: string, at: Date): Promise<boolean>;
}

/** Slow, salted hashing for human passwords (argon2id, ADR 0005). */
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract verify(passwordHash: string, password: string): Promise<boolean>;
}

/** Random secrets and fast hashing for high-entropy tokens (refresh tokens). */
export abstract class OpaqueTokenSecrets {
  abstract generateSecret(): string;
  abstract hash(secret: string): string;
  abstract matches(secret: string, secretHash: string): boolean;
}

/** Short-lived signed tokens (JWT) that carry who is calling. */
export abstract class AccessTokens {
  abstract issue(userId: string): Promise<{ token: string; expiresInSeconds: number }>;
  /** The user id; throws if the signature, expiry or shape is wrong. */
  abstract verify(token: string): Promise<string>;
}

/** Lifetimes from configuration. */
export abstract class AuthSettings {
  abstract readonly refreshTokenTtlDays: number;
}
