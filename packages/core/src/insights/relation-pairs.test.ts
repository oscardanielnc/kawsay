import { describe, expect, it } from 'vitest';
import { isDigestiveName, mayRelate } from './relation-pairs';

describe('relation pairs (F17)', () => {
  it('a food is never compared with mood, stress, energy or sleep: "culantro, less stress" cannot appear', () => {
    for (const symptom of ['check:mood', 'check:stress', 'check:energy', 'check:sleep']) {
      expect(mayRelate('food:culantro', symptom)).toBe(false);
      expect(mayRelate('dish:jugo-de-limon', symptom)).toBe(false);
    }
  });

  it('a food is compared with gut symptoms: milk and bloating still shows', () => {
    expect(mayRelate('food:leche-entera', 'check:bloating')).toBe(true);
    expect(mayRelate('food:leche-entera', 'check:diarrhoea')).toBe(true);
  });

  it('mouth ulcers relate to sleep, motorbike and hard days, never to a food', () => {
    expect(isDigestiveName('Llagas en la boca')).toBe(false);
    expect(isDigestiveName('Llagas')).toBe(false);
    expect(mayRelate('food:aji-amarillo', 'own:llagas')).toBe(false);
    for (const tag of [
      'tag:short-sleep',
      'tag:poor-sleep',
      'tag:long-motorbike',
      'tag:hard-activity',
    ])
      expect(mayRelate(tag, 'own:llagas')).toBe(true);
  });

  it('an own gut symptom ("Gases", "Acidez") is compared with foods', () => {
    expect(isDigestiveName('Gases')).toBe(true);
    expect(isDigestiveName('Acidez')).toBe(true);
    expect(mayRelate('food:cebolla', 'own:g', new Set(['own:g']))).toBe(true);
  });

  it('sleep tags are not compared with the sleep check-in itself', () => {
    expect(mayRelate('tag:short-sleep', 'check:sleep')).toBe(false);
    expect(mayRelate('tag:short-sleep', 'check:mood')).toBe(true);
  });
});
