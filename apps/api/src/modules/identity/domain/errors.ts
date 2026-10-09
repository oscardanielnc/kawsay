import { DomainError } from '../../../shared/domain/domain-error';

/** Same error for unknown email and wrong password: nobody can probe which emails exist. */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'auth.invalid_credentials';

  constructor() {
    super('Invalid email or password');
  }
}

/** Unknown, expired, revoked or reused refresh token. The app must sign in again. */
export class InvalidSessionError extends DomainError {
  readonly code = 'auth.invalid_session';

  constructor() {
    super('The session is no longer valid; sign in again');
  }
}

export class UnauthenticatedError extends DomainError {
  readonly code = 'auth.unauthenticated';

  constructor() {
    super('Missing or invalid credentials');
  }
}

export class EmailTakenError extends DomainError {
  readonly code = 'user.email_taken';

  constructor() {
    super('A user with this email already exists');
  }
}

export class InvalidEmailError extends DomainError {
  readonly code = 'user.invalid_email';

  constructor() {
    super('The email address is not valid');
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = 'user.weak_password';

  constructor() {
    super('Passwords need 12 to 128 characters');
  }
}
