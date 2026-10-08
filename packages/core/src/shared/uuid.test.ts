import { describe, expect, it } from 'vitest';
import { uuidv7, uuidv7Time } from './uuid';

const zeros = new Uint8Array(10);
const ones = new Uint8Array(10).fill(0xff);

describe('uuidv7 (RFC 9562): time-ordered ids generated on the phone', () => {
  it('has the UUID shape with version 7 and variant 10', () => {
    expect(uuidv7(Date.UTC(2026, 9, 8), ones)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('starts with the 48-bit millisecond timestamp, so it can be read back', () => {
    const ms = Date.UTC(2026, 9, 8, 13, 45, 0, 123);
    expect(uuidv7Time(uuidv7(ms, zeros))).toBe(ms);
  });

  it('sorts by creation time as plain text', () => {
    const earlier = uuidv7(Date.UTC(2026, 9, 8, 13), ones);
    const later = uuidv7(Date.UTC(2026, 9, 8, 13, 0, 0, 1), zeros);
    expect(earlier < later).toBe(true);
  });

  it('the random bytes make ids of the same millisecond different', () => {
    const ms = Date.UTC(2026, 9, 8);
    expect(uuidv7(ms, zeros)).not.toBe(uuidv7(ms, ones));
  });

  it('rejects anything but 10 random bytes and a non-negative integer time', () => {
    expect(() => uuidv7(0, new Uint8Array(9))).toThrow(RangeError);
    expect(() => uuidv7(-1, zeros)).toThrow(RangeError);
    expect(() => uuidv7(1.5, zeros)).toThrow(RangeError);
  });
});
