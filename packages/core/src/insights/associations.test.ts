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

  it('Minimum data: an exposure seen fewer than 5 times is never a finding', () => {
    const days = dairyWeeks().map((d, i) => ({
      ...d,
      exposures: i < 16 ? d.exposures : d.exposures.filter((e) => e !== 'food:leche-entera'),
    }));
    const result = findAssociations(days);
    if (result.status !== 'ok') throw new Error('expected a result');
    expect(result.findings.filter((f) => f.exposure === 'food:leche-entera')).toEqual([]);
  });

  it('the window reaches 48 h: exposure two days before still counts', () => {
    const days: AssociationDay[] = Array.from({ length: 25 }, (_, i) => ({
      date: addDays(start, i),
      exposures: i % 5 === 0 ? ['tag:alcohol'] : [],
      symptoms: { mood: i % 5 === 2 },
    }));
    const result = findAssociations(days);
    if (result.status !== 'ok') throw new Error('expected findings');
    expect(result.findings[0]).toMatchObject({ exposure: 'tag:alcohol', symptom: 'mood' });
  });

  it('a pair left out by the rules is never a finding', () => {
    const result = findAssociations(dairyWeeks(), (exposure) => !exposure.startsWith('food:'));
    if (result.status !== 'ok') throw new Error('expected a result');
    expect(result.findings).toEqual([]);
  });

  it('noise: 60 foods eaten at random against random constipation over 42 days show no relation', () => {
    let seed = 7;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    const days: AssociationDay[] = Array.from({ length: 42 }, (_, i) => ({
      date: addDays(start, i),
      exposures: Array.from({ length: 60 }, (_, f) => f).flatMap((f) =>
        random() < 0.15 ? [`food:f${f}`] : [],
      ),
      symptoms: { constipation: random() < 0.25 },
    }));
    const result = findAssociations(days);
    if (result.status !== 'ok') throw new Error('expected a result');
    expect(result.findings).toEqual([]);
  });

  it('each finding carries its p and its q after correcting for every pair tested', () => {
    const result = findAssociations(dairyWeeks());
    if (result.status !== 'ok') throw new Error('expected findings');
    expect(result.findings[0]!.pValue).toBeLessThan(0.05);
    expect(result.findings[0]!.qValue).toBeLessThanOrEqual(0.1);
  });
});
