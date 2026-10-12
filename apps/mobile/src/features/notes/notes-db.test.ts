/** @jest-environment node */
import { createTestDb } from '@/lib/db/test-db';
import type { RecordEnv } from '@/lib/db/types';
import { deleteNote, notesOn, saveNote } from './notes-db';

const day = '2026-10-12';
const timeZone = 'America/Lima';
function env(): RecordEnv {
  let now = Date.UTC(2026, 9, 12, 15);
  let seed = 0;
  return { now: () => (now += 60_000), randomBytes: (n) => new Uint8Array(n).fill(++seed % 256) };
}

describe('day notes (F21)', () => {
  it('Writing "Tuve una pelea con mi novia pero a los pocos minutos nos reconciliamos" saves a note on that day', async () => {
    const db = await createTestDb();
    const text = 'Tuve una pelea con mi novia pero a los pocos minutos nos reconciliamos';
    await saveNote(db, env(), { date: day, timeZone, text: `  ${text}\n` });
    const [note, ...rest] = await notesOn(db, day);
    expect(rest).toEqual([]);
    expect(note).toMatchObject({ text, timeZone });
    expect(await notesOn(db, '2026-10-13')).toEqual([]);
  });

  it('Editing a note keeps one note with the new text; deleting it removes it from the day', async () => {
    const db = await createTestDb();
    const e = env();
    await saveNote(db, e, { date: day, timeZone, text: 'Barriga hinchada' });
    const [first] = await notesOn(db, day);
    await saveNote(db, e, {
      id: first!.id,
      date: day,
      timeZone,
      text: 'Barriga hinchada, pero después del baño ya no',
    });
    const edited = await notesOn(db, day);
    expect(edited).toEqual([
      {
        id: first!.id,
        text: 'Barriga hinchada, pero después del baño ya no',
        loggedAt: first!.loggedAt,
        timeZone,
      },
    ]);
    await deleteNote(db, e, first!.id);
    expect(await notesOn(db, day)).toEqual([]);
  });

  it('A blank note cannot be saved', async () => {
    const db = await createTestDb();
    await expect(saveNote(db, env(), { date: day, timeZone, text: '  \n ' })).rejects.toThrow(
      RangeError,
    );
    expect(await notesOn(db, day)).toEqual([]);
  });

  it('lists the day in the order the notes were written', async () => {
    const db = await createTestDb();
    const e = env();
    await saveNote(db, e, { date: day, timeZone, text: 'primera' });
    await saveNote(db, e, { date: day, timeZone, text: 'segunda' });
    expect((await notesOn(db, day)).map((n) => n.text)).toEqual(['primera', 'segunda']);
  });
});
