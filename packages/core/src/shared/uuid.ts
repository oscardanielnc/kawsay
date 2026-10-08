const MAX_MS = 2 ** 48 - 1;

/**
 * UUID version 7 (RFC 9562): 48-bit Unix milliseconds, then randomness. Generated on the phone so entries get their
 * final id offline (ADR 0004); time-ordered, so new rows append to the primary-key index. Time and randomness are
 * injected: the caller passes `Date.now()` and 10 bytes from a secure random source.
 */
export function uuidv7(unixMs: number, random: Uint8Array): string {
  if (!Number.isInteger(unixMs) || unixMs < 0 || unixMs > MAX_MS) {
    throw new RangeError(`unixMs must be an integer in 0…2^48−1, got ${unixMs}`);
  }
  if (random.length !== 10) throw new RangeError(`need 10 random bytes, got ${random.length}`);

  const bytes = new Uint8Array(16);
  let time = unixMs;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = 0x70 | (random[0]! & 0x0f); // version 7
  bytes[7] = random[1]!;
  bytes[8] = 0x80 | (random[2]! & 0x3f); // variant 10
  bytes.set(random.subarray(3), 9);

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The creation time encoded in a UUIDv7. */
export function uuidv7Time(id: string): number {
  return Number.parseInt(id.replace(/-/g, '').slice(0, 12), 16);
}
