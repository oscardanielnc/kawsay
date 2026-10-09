import { z } from 'zod';

export const LoginRequest = z.strictObject({
  email: z.string().min(3).max(254),
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

/** The refresh token travels in the body: the phone keeps it in secure storage, not in a cookie (ADR 0005). */
export const RefreshRequest = z.strictObject({ refreshToken: z.string().min(1).max(200) });
export type RefreshRequest = z.infer<typeof RefreshRequest>;

export const TokenResponse = z.strictObject({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string(),
  user: z.strictObject({ id: z.uuid(), email: z.string() }),
});
export type TokenResponse = z.infer<typeof TokenResponse>;
