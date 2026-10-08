import { metForIntensity, type Intensity } from './activity';

export type ActivityKind =
  'walking' | 'weights' | 'stairs' | 'jogging' | 'motorbike' | 'housework' | 'football' | 'cycling';

/**
 * Activity catalog of the design (F08). `met` lists one value per intensity when the 2024 Adult Compendium has
 * separate codes; a single value scales ±20% with intensity (ADR 0009). `codes` holds only codes verified in the
 * docs (F18); the others stay empty until checked against the Compendium, so the ⓘ never cites an unverified code.
 */
export const ACTIVITY_TYPES: readonly {
  kind: ActivityKind;
  met: readonly number[];
  codes: readonly string[];
}[] = [
  { kind: 'walking', met: [2.8, 3.5, 4.3], codes: [] },
  { kind: 'weights', met: [3.5, 5.0, 6.0], codes: ['02054', '02052', '02050'] },
  { kind: 'stairs', met: [6.8], codes: [] },
  { kind: 'jogging', met: [7.0], codes: [] },
  { kind: 'motorbike', met: [2.8], codes: [] },
  { kind: 'housework', met: [3.3], codes: [] },
  { kind: 'football', met: [7.0], codes: [] },
  { kind: 'cycling', met: [4.0], codes: [] },
];

const LEVEL: Record<Intensity, number> = { light: 0, medium: 1, hard: 2 };

/** MET of an activity at an intensity: its own code, or the single code ±20%. */
export function activityMet(kind: ActivityKind, intensity: Intensity): number {
  const type = ACTIVITY_TYPES.find((t) => t.kind === kind);
  if (!type) throw new RangeError(`unknown activity type: ${kind}`);
  const own = type.met.length === 3 ? type.met[LEVEL[intensity]] : undefined;
  return own ?? metForIntensity(type.met[0] ?? 1, intensity);
}

/** The Compendium code behind the MET, for the ⓘ explanation; null when the value is scaled ±20%. */
export function activityCode(kind: ActivityKind, intensity: Intensity): string | null {
  const type = ACTIVITY_TYPES.find((t) => t.kind === kind);
  if (!type) return null;
  if (type.codes.length === 3) return type.codes[LEVEL[intensity]] ?? null;
  return intensity === 'medium' ? (type.codes[0] ?? null) : null;
}
