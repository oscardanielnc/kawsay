import type { Tone } from '../shared/tone';

/** ADR 0020: a drink with this much added sugar or more is a sugary drink. */
export const SUGARY_DRINK_G = 5;

/** A logged drink (group drink, served by glass, or tapped in hydration) with ≥ 5 g of added sugar. */
export function isSugaryDrink(addedSugarG: number): boolean {
  return addedSugarG >= SUGARY_DRINK_G;
}

/** Week's sugary drinks (EASL-EASD-EASO 2024: avoid them): 0 blue, 1–2 amber, 3 or more coral. */
export function sugaryDrinksZone(count: number): Tone {
  if (count === 0) return 'green';
  return count <= 2 ? 'yellow' : 'red';
}
