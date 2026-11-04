/** Check-in symptoms of the gut: the only ones a food or dish is compared against. */
const DIGESTIVE_CHECKS = new Set(['check:bloating', 'check:diarrhoea', 'check:constipation']);
/** Words that make an own symptom digestive (Spanish, as the user names it). */
const DIGESTIVE_WORDS =
  /(^|[^\p{L}])(gas|hinch|distensi|acidez|reflujo|diarr|estreñ|estomag|estómag|barriga|panza|intestin|c[oó]lico|n[aá]usea|v[oó]mit|eructo|heces|deposici)/iu;
/** Exposures that describe the night: comparing them with the sleep check-in would compare sleep with itself. */
const SLEEP_TAGS = new Set(['tag:short-sleep', 'tag:poor-sleep']);

/** An own symptom named like a gut symptom ("Gases", "Acidez") is compared against foods; any other is not. */
export function isDigestiveName(name: string): boolean {
  return DIGESTIVE_WORDS.test(name);
}

/**
 * Which exposure may be compared with which symptom (F17, owner 2026-11-04). Foods and dishes only against gut
 * symptoms: mood, stress, energy, sleep or mouth ulcers follow rest, the day's load and what happened, and testing
 * hundreds of foods against them only finds coincidences ("culantro, less stress"). Day tags (sleep, activity,
 * motorbike, alcohol, sugar, coffee) may relate to any symptom.
 */
export function mayRelate(
  exposure: string,
  symptom: string,
  digestiveOwn: ReadonlySet<string> = new Set(),
): boolean {
  const isFood = exposure.startsWith('food:') || exposure.startsWith('dish:');
  if (isFood) return DIGESTIVE_CHECKS.has(symptom) || digestiveOwn.has(symptom);
  if (SLEEP_TAGS.has(exposure) && symptom === 'check:sleep') return false;
  return true;
}
