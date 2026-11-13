import type { LabelReading } from '@kawsay/contracts/catalog';
import { describe, expect, it } from 'vitest';
import { Clock } from '../../../../shared/application/ports/clock';
import { LabelLimitError, LabelUnavailableError } from '../../domain/errors';
import { LabelReader, type LabelImage } from '../ports/label-reader';
import { LABEL_DAILY_LIMIT, ReadLabelUseCase, labelProblems } from './read-label.use-case';

const IMAGE: LabelImage = { base64: 'AAAA', mimeType: 'image/jpeg' };
const NONE = {
  energyKcal: null,
  fatG: null,
  saturatedFatG: null,
  transFatG: null,
  cholesterolMg: null,
  sodiumMg: null,
  carbsTotalG: null,
  fiberG: null,
  sugarsTotalG: null,
  addedSugarG: null,
  proteinG: null,
};
/** Vanilla cookies, per serving of 30 g: 150 kcal = 4·1.8 + 9·6 + 4·22 ≈ 149. */
const COOKIES: LabelReading = {
  readable: true,
  name: 'Galletas de vainilla',
  brand: null,
  basis: 'perServing',
  servingLabel: '6 galletas',
  servingGrams: 30,
  packageGrams: 180,
  isDrink: false,
  refinedFlour: true,
  values: {
    ...NONE,
    energyKcal: 150,
    proteinG: 1.8,
    fatG: 6,
    saturatedFatG: 3,
    carbsTotalG: 22,
    sugarsTotalG: 9,
    sodiumMg: 95,
  },
};

class FakeReader extends LabelReader {
  asked: (string[] | undefined)[] = [];
  constructor(private readonly answers: (LabelReading | Error)[]) {
    super();
  }
  read(_image: LabelImage, problems?: string[]) {
    this.asked.push(problems);
    const next = this.answers.shift() ?? new Error('no more');
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  }
}
class FixedClock extends Clock {
  now() {
    return new Date('2026-11-12T12:00:00Z');
  }
}
const useCase = (reader: LabelReader) => new ReadLabelUseCase(reader, new FixedClock());

describe('ReadLabelUseCase ("Leer etiqueta", F23 piece 3)', () => {
  it('returns a reading that passes every check on the first try', async () => {
    const reader = new FakeReader([COOKIES]);
    await expect(useCase(reader).execute('u1', IMAGE)).resolves.toEqual(COOKIES);
    expect(reader.asked).toEqual([undefined]);
  });

  it('a serving value in the 100 g column is sent back once with the problem, and the fix is returned', async () => {
    const misread = { ...COOKIES, values: { ...COOKIES.values, energyKcal: 500 } };
    const reader = new FakeReader([misread, COOKIES]);
    await expect(useCase(reader).execute('u1', IMAGE)).resolves.toEqual(COOKIES);
    expect(reader.asked[1]?.join(' ')).toMatch(/energía no cuadra/);
  });

  it('a reading still failing after the retry is returned for the user to correct', async () => {
    const misread = { ...COOKIES, values: { ...COOKIES.values, energyKcal: 500 } };
    const reader = new FakeReader([misread, misread]);
    await expect(useCase(reader).execute('u1', IMAGE)).resolves.toEqual(misread);
  });

  it('an unreadable photo is answered as such, without a retry', async () => {
    const blurry = { ...COOKIES, readable: false, values: NONE };
    const reader = new FakeReader([blurry]);
    await expect(useCase(reader).execute('u1', IMAGE)).resolves.toMatchObject({ readable: false });
    expect(reader.asked).toHaveLength(1);
  });

  it('two failed calls are a clear error', async () => {
    await expect(
      useCase(new FakeReader([new Error('down'), new Error('down')])).execute('u1', IMAGE),
    ).rejects.toBeInstanceOf(LabelUnavailableError);
  });

  it(`stops at ${LABEL_DAILY_LIMIT} readings a day per user`, async () => {
    const reader = new FakeReader(Array.from({ length: LABEL_DAILY_LIMIT + 1 }, () => COOKIES));
    const run = useCase(reader);
    for (let i = 0; i < LABEL_DAILY_LIMIT; i++) await run.execute('u1', IMAGE);
    await expect(run.execute('u1', IMAGE)).rejects.toBeInstanceOf(LabelLimitError);
    await expect(run.execute('u2', IMAGE)).resolves.toEqual(COOKIES);
  });
});

describe('labelProblems', () => {
  it('per-serving numbers need the serving grams', () => {
    expect(labelProblems({ ...COOKIES, servingGrams: null })).toEqual([
      expect.stringMatching(/tamaño de la porción/),
    ]);
  });

  it('a part cannot exceed its total', () => {
    const values = { ...COOKIES.values, saturatedFatG: 9, sugarsTotalG: 30 };
    expect(labelProblems({ ...COOKIES, values })).toHaveLength(2);
  });
});
