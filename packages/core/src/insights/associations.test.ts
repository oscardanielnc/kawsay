import { describe, expect, it } from 'vitest';
import { addDays } from '../shared/local-date';
import { findAssociations, type AssociationDay } from './associations';

const start = '2026-09-01';

/** 24 days: milk every 4th day; bloating is worse that day and the next, usual otherwise. */
function dairyWeeks(): AssociationDay[] {
  const milkDays = new Set([0, 4, 8, 12, 16, 20]);
  return Array.from({ length: 24 }, (_, i) => ({
    date: addDays(start, i),
    exposures: [...(milkDays.has(i) ? ['food:leche-entera'] : []), 'food:arroz-cocido'],
    symptoms: { bloating: milkDays.has(i) || milkDays.has(i - 1) },
  }));
}

describe('associations (F17, computed without AI)', () => {
  it('With seeded data where dairy raises bloating, the insight reports it', () => {
    const result = findAssociations(dairyWeeks());
    if (result.status !== 'ok') throw new Error('expected findings');
    expect(result.findings[0]).toMatchObject({
      exposure: 'food:leche-entera',
      symptom: 'bloating',
      direction: 'raises',
      occurrences: 6,
    });
    expect(result.findings[0]!.exposedRate).toBeGreaterThan(result.findings[0]!.baselineRate);
  });

  it('something eaten every day has no days without it to compare: no finding', () => {
    const result = findAssociations(dairyWeeks());
    if (result.status !== 'ok') throw new Error('expected findings');
    expect(result.findings.some((f) => f.exposure === 'food:arroz-cocido')).toBe(false);
  });

  it('Minimum data: fewer than 10 days with symptoms answered asks for more', () => {
    expect(findAssociations(dairyWeeks().slice(0, 9))).toEqual({
      status: 'need-days',
      loggedDays: 9,
      neededDays: 10,
    });
  });

  it('Minimum data: an exposure seen fewer than 3 times is never a finding', () => {
    const days = dairyWeeks().map((d, i) => ({
      ...d,
      exposures: i < 8 ? d.exposures : d.exposures.filter((e) => e !== 'food:leche-entera'),
    }));
    const result = findAssociations(days);
    if (result.status !== 'ok') throw new Error('expected a result');
    expect(result.findings.filter((f) => f.exposure === 'food:leche-entera')).toEqual([]);
  });

  it('the window reaches 48 h: exposure two days before still counts', () => {
    const days: AssociationDay[] = Array.from({ length: 20 }, (_, i) => ({
      date: addDays(start, i),
      exposures: i % 5 === 0 ? ['tag:alcohol'] : [],
      symptoms: { mood: i % 5 === 2 },
    }));
    const result = findAssociations(days);
    if (result.status !== 'ok') throw new Error('expected findings');
    expect(result.findings[0]).toMatchObject({ exposure: 'tag:alcohol', symptom: 'mood' });
  });
});
