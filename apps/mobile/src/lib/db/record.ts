import { uuidv7 } from '@kawsay/core/shared/uuid';
import type { RecordEnv } from './types';

/** Identity and timestamp of a new synced record (ADR 0004). */
export function newRecord(env: RecordEnv): { id: string; updatedAt: number } {
  const now = env.now();
  return { id: uuidv7(now, env.randomBytes(10)), updatedAt: now };
}
