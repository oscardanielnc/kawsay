import { InvalidEmailError, WeakPasswordError } from './errors';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Rules for a new password; checked before hashing, never stored. */
export function assertPasswordAcceptable(password: string): void {
  // Length beats composition rules (NIST 800-63B): 12+ characters, no maximum below 128.
  if (password.length < 12 || password.length > 128) throw new WeakPasswordError();
}

export function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL.test(normalized) || normalized.length > 254) throw new InvalidEmailError();
  return normalized;
}

/** An account: one person's synced history belongs to it. */
export class User {
  private constructor(private readonly props: UserProps) {}

  static register(input: Omit<UserProps, 'createdAt'> & { now: Date }): User {
    const { now, ...rest } = input;
    return new User({ ...rest, email: normalizeEmail(input.email), createdAt: now });
  }

  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
