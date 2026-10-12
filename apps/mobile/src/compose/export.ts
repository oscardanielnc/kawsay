import { drunkGlasses } from '@kawsay/core/day/drinks';
import { activityKcal } from '@kawsay/core/energy/activity';
import { addDays, daysBetween, type LocalDate } from '@kawsay/core/shared/local-date';
import { daySleepHours } from '@kawsay/core/sleep/sleep-session';
import { notesOn } from '@/features/notes/notes-db';
import { listRoutines } from '@/features/routines/routines-db';
import { getProfile } from '@/features/profile/profile-db';
import { trendWeightKg } from '@/features/profile/profile-targets';
import { intimateOn } from '@/features/private/private-db';
import { listSymptoms, symptomAnswersOn } from '@/features/symptoms/symptoms-db';
import { waistsSince } from '@/features/waist/waist-db';
import { weightsBetween } from '@/features/weight/weight-db';
import { toCsv, type Cell } from '@/lib/csv';
import { formatTime } from '@/lib/format';
import type { Db } from '@/lib/db/types';
import { loadDay, summarizeDay, TREND_DAYS } from './day';

/** Every CSV of the export and its columns, in order; the README describes each one (F15). */
export const EXPORT_COLUMNS = {
  days: [
    'date',
    'colour',
    'target_kcal',
    'eaten_kcal',
    'protein_g',
    'target_protein_g',
    'fat_g',
    'carbs_g',
    'added_sugar_g',
    'movement_min',
    'glasses',
    'sleep_h',
    'weight_kg',
    'trend_kg',
    'ring_done',
  ],
  meals: [
    'date',
    'meal',
    'item_kind',
    'name',
    'servings',
    'grams',
    'kcal',
    'protein_g',
    'fat_g',
    'carbs_g',
    'volume_ml',
  ],
  activities: ['date', 'kind', 'name', 'intensity', 'minutes', 'met', 'kcal', 'time_band'],
  sleep: ['date', 'kind', 'start', 'end', 'hours', 'quality', 'nightmares'],
  drinks: ['date', 'kind', 'volume_ml'],
  checkins: ['date', 'logged_at', 'kind', 'value'],
  symptoms: ['date', 'symptom', 'scale', 'value'],
  notes: ['date', 'time', 'text'],
  weights: ['date', 'kg'],
  waist: ['week_start', 'cm'],
  private: ['date', 'kind'],
} as const;
export type ExportFile = keyof typeof EXPORT_COLUMNS;

export interface ExportData {
  /** File name → contents: `kawsay.json` and one CSV per module. */
  files: Record<string, string>;
  from: LocalDate;
  to: LocalDate;
}

/**
 * The user's history from `from` to `to`, built on the phone (works offline). The private log is read and written
 * only when `includePrivate` is set (F12, F15).
 */
export async function buildExport(
  db: Db,
  { from, to, includePrivate }: { from: LocalDate; to: LocalDate; includePrivate: boolean },
): Promise<ExportData> {
  const dates = Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i));
  const [profile, weights, routines, symptoms, waists] = await Promise.all([
    getProfile(db),
    weightsBetween(db, addDays(from, -TREND_DAYS), to),
    listRoutines(db),
    listSymptoms(db),
    waistsSince(db, from),
  ]);
  const routineName = new Map(routines.map((r) => [r.id, r.name]));
  const symptomById = new Map(symptoms.map((s) => [s.id, s]));
  const rows: Record<ExportFile, Cell[][]> = {
    days: [],
    meals: [],
    activities: [],
    sleep: [],
    drinks: [],
    checkins: [],
    symptoms: [],
    notes: [],
    weights: weights.filter((w) => w.date >= from).map((w) => [w.date, w.kg]),
    waist: waists.filter((w) => w.weekStart <= to).map((w) => [w.weekStart, w.cm]),
    private: [],
  };
  const days = [];

  for (const date of dates) {
    const day = await loadDay(db, date, { profile, weights });
    const summary = summarizeDay(day);
    const answers = await symptomAnswersOn(db, date);
    const notes = await notesOn(db, date);
    const intimate = includePrivate ? await intimateOn(db, date) : [];
    const bmrKcal = summary.targets?.bmrKcal ?? null;
    const slept = day.sleep.length ? daySleepHours(day.sleep.map((s) => s.stamps)) : null;
    const glasses = drunkGlasses([
      ...day.drinks.map((d) => ({ ml: d.volumeMl, alcohol: d.kind === 'alcohol' })),
      ...day.meals.flatMap((m) =>
        m.volumeMl === null ? [] : [{ ml: m.volumeMl, alcohol: false }],
      ),
    ]);
    const weighed = day.weights.find((w) => w.date === date)?.kg ?? null;

    rows.days.push([
      date,
      summary.colour,
      summary.targets?.targetKcal ?? null,
      summary.eaten.kcal,
      summary.eaten.proteinG,
      summary.targets?.proteinG ?? null,
      summary.eaten.fatG,
      summary.eaten.carbsG,
      summary.eaten.addedSugarG,
      summary.movementMinutes,
      glasses,
      slept,
      weighed,
      trendWeightKg(day.weights),
      summary.ring.done,
    ]);
    for (const m of day.meals) {
      rows.meals.push([
        date,
        m.meal,
        m.kind,
        m.name,
        m.servings,
        m.grams,
        m.kcal,
        m.proteinG,
        m.fatG,
        m.carbsG,
        m.volumeMl,
      ]);
    }
    for (const a of day.activities) {
      rows.activities.push([
        date,
        a.kind,
        a.kind === 'routine' ? (routineName.get(a.routineId ?? '') ?? null) : null,
        a.intensity,
        a.minutes,
        a.met,
        bmrKcal ? activityKcal({ met: a.met, hours: a.minutes / 60, bmrKcal }) : null,
        a.timeBand,
      ]);
    }
    for (const s of day.sleep) {
      rows.sleep.push([
        date,
        s.kind,
        s.stamps.start,
        s.stamps.end,
        s.hours,
        s.quality,
        s.nightmares,
      ]);
    }
    for (const d of day.drinks) rows.drinks.push([date, d.kind, d.volumeMl]);
    for (const c of day.checkIns)
      rows.checkins.push([date, new Date(c.loggedAt).toISOString(), c.kind, c.value]);
    for (const [id, value] of Object.entries(answers)) {
      const symptom = symptomById.get(id);
      if (symptom) rows.symptoms.push([date, symptom.name, symptom.scale, value]);
    }
    for (const n of notes) {
      // A note is shown at the time it was written, in the zone it was written in.
      rows.notes.push([date, formatTime(n.loggedAt, n.timeZone), n.text]);
    }
    for (const i of intimate) rows.private.push([date, i.kind]);

    days.push({
      date,
      summary: {
        colour: summary.colour,
        targets: summary.targets,
        eaten: summary.eaten,
        movementMinutes: summary.movementMinutes,
        ring: summary.ring,
        glasses,
        sleepHours: slept,
      },
      meals: day.meals,
      activities: day.activities,
      noActivity: day.status.noActivity,
      sweatedALot: day.status.sweatedALot,
      sleep: day.sleep,
      drinks: day.drinks,
      checkIns: day.checkIns,
      symptoms: answers,
      notes: notes.map(({ loggedAt, text }) => ({ loggedAt, text })),
      weightKg: weighed,
      ...(includePrivate && { private: intimate }),
    });
  }

  const files: Record<string, string> = {
    'kawsay.json': JSON.stringify(
      { app: 'Kawsay', exportedRange: { from, to }, profile, symptoms, waists: rows.waist, days },
      null,
      2,
    ),
  };
  for (const file of Object.keys(EXPORT_COLUMNS) as ExportFile[]) {
    if (file === 'private' && !includePrivate) continue;
    files[`${file}.csv`] = toCsv(EXPORT_COLUMNS[file], rows[file]);
  }
  return { files, from, to };
}
