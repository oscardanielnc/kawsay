/** FIB-4 bands (ADR 0020): a screening score, never a diagnosis. */
export type Fib4Band = 'low' | 'see-doctor' | 'high';

/**
 * FIB-4 = age × AST ÷ (platelets in 10⁹/L × √ALT). Under 1.30 low (under 2.0 above 65 years), 1.30–2.67 talk to a
 * doctor, above 2.67 high.
 */
export function fib4({
  ageYears,
  ast,
  alt,
  platelets,
}: {
  ageYears: number;
  ast: number;
  alt: number;
  platelets: number;
}): { value: number; band: Fib4Band } {
  if (!(ageYears > 0 && ast > 0 && alt > 0 && platelets > 0))
    throw new RangeError('FIB-4 needs positive age, AST, ALT and platelets');
  const value = (ageYears * ast) / (platelets * Math.sqrt(alt));
  const lowUnder = ageYears > 65 ? 2.0 : 1.3;
  const band: Fib4Band = value < lowUnder ? 'low' : value <= 2.67 ? 'see-doctor' : 'high';
  return { value, band };
}
