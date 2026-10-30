/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import {
  answerSymptom,
  createSymptom,
  deleteSymptom,
  listSymptoms,
  ongoingSymptoms,
  symptomAnswersOn,
} from './symptoms-db';
import { addDays } from '@kawsay/core/shared/local-date';

const day = '2026-10-08';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 8, 12);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

describe('custom symptoms (F13)', () => {
  it('a symptom marked up to yesterday is ongoing with its length; a gap or a 0 ends it', async () => {
    const db = await createTestDb();
    const e = env();
    const headache = await createSymptom(db, e, { name: 'Dolor de cabeza', scale: 'yes-no' });
    const acidity = await createSymptom(db, e, { name: 'Acidez', scale: 'zero-five' });
    const mark = (symptomId: string, back: number, value: string) =>
      answerSymptom(db, e, {
        date: addDays(day, -back),
        timeZone: 'America/Lima',
        symptomId,
        value,
      });
    for (const back of [1, 2, 3, 5]) await mark(headache.id, back, 'yes');
    await mark(acidity.id, 2, '3');
    await mark(acidity.id, 1, '0');
    expect(await ongoingSymptoms(db, day)).toEqual({ [headache.id]: { days: 3, value: 'yes' } });
  });

  it('creates a symptom with its scale and lists it', async () => {
    const db = await createTestDb();
    await createSymptom(db, env(), { name: '  Acidez ', scale: 'zero-five' });
    expect(await listSymptoms(db)).toEqual([
      expect.objectContaining({ name: 'Acidez', scale: 'zero-five' }),
    ]);
  });

  it('answering again the same day replaces the answer; null clears it', async () => {
    const db = await createTestDb();
    const e = env();
    const { id } = await createSymptom(db, e, { name: 'Dolor de cabeza', scale: 'yes-no' });
    const input = { date: day, timeZone: 'America/Lima', symptomId: id };
    await answerSymptom(db, e, { ...input, value: '2' });
    await answerSymptom(db, e, { ...input, value: '4' });
    expect(await symptomAnswersOn(db, day)).toEqual({ [id]: '4' });
    await answerSymptom(db, e, { ...input, value: null });
    expect(await symptomAnswersOn(db, day)).toEqual({});
  });

  it('a deleted symptom disappears from the list', async () => {
    const db = await createTestDb();
    const e = env();
    const { id } = await createSymptom(db, e, { name: 'Granos', scale: 'size' });
    await deleteSymptom(db, e, id);
    expect(await listSymptoms(db)).toEqual([]);
  });
});
