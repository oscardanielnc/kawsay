import { isDigestiveName, mayRelate } from '@kawsay/core/insights/relation-pairs';
import { addedSugarLimits } from '@kawsay/core/day/added-sugar';
import {
  itemParts,
  weeklyCalorieSources,
  type BucketFood,
  type CaloriePart,
} from '@kawsay/core/insights/calorie-sources';
import { findAssociations, type AssociationDay } from '@kawsay/core/insights/associations';
import { ingredientsEaten } from '@kawsay/core/insights/ingredient-exposures';
import { symptomEpisodes } from '@kawsay/core/insights/symptom-episodes';
import { weeklyNutrients, type NutrientDay } from '@kawsay/core/insights/weekly-nutrients';
import { weeklySummary } from '@kawsay/core/insights/weekly-summary';
import { WEEKLY_NUTRIENTS } from '@kawsay/core/nutrition/references';
import { ageOn } from '@kawsay/core/profile/profile';
import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import { daySleepHours } from '@kawsay/core/sleep/sleep-session';
import { asc, isNull } from 'drizzle-orm';
import type { Exposure, InsightsData, SymptomRef } from '@/features/insights/types';
import { notesBetween } from '@/features/notes/notes-db';
import { getProfile } from '@/features/profile/profile-db';
import { trendWeightKg } from '@/features/profile/profile-targets';
import { listSymptoms, symptomAnswersOn, type Symptom } from '@/features/symptoms/symptoms-db';
import { weightsBetween } from '@/features/weight/weight-db';
import { dish, dishItem, food, foodUnit, userDish, userDishItem } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { loadDay, summarizeDay, TREND_DAYS, type DayData } from './day';

/** The week of F19/F20 is the 7 days ending on `end`; relations look at 6 weeks (F17). */
export const WEEK_DAYS = 7;
export const RELATION_DAYS = 42;
/** Under 6 hours of sleep counts as a short night (an exposure for F17). */
const SHORT_SLEEP_H = 6;
/** Two hours or more on the motorbike in a day: the owner's tiring days (F17, 2026-11-04). */
const LONG_MOTORBIKE_MIN = 120;

/** Bad-day rules: answers on the bad side of each scale (check-in values: see the export README). */
function badSymptoms(
  day: DayData,
  answers: Record<string, string>,
  symptoms: readonly Symptom[],
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  const latest = (kind: string) => day.checkIns.filter((c) => c.kind === kind).at(-1)?.value;
  const bloating = latest('bloating');
  if (bloating) out['check:bloating'] = bloating === 'worse';
  const stress = latest('stress');
  if (stress) out['check:stress'] = Number(stress) >= 4;
  const energy = latest('energy');
  if (energy) out['check:energy'] = Number(energy) <= 2;
  const mood = latest('mood');
  if (mood) out['check:mood'] = Number(mood) <= 2;
  const visits = day.checkIns.filter((c) => c.kind === 'bathroom').map((c) => c.value);
  if (visits.length) {
    const bristol = visits.map(Number).filter((n) => n >= 1 && n <= 7);
    out['check:diarrhoea'] = bristol.some((n) => n >= 6);
    out['check:constipation'] = bristol.some((n) => n <= 2) || visits.includes('none');
  }
  const rated = day.sleep.filter((s) => s.quality !== null);
  if (rated.length) out['check:sleep'] = rated.some((s) => (s.quality ?? 5) <= 2);
  // Own symptoms: once anything was logged that day, a yes/no symptom not tapped means "no".
  const anyAnswer = Object.keys(out).length > 0 || Object.keys(answers).length > 0;
  for (const s of symptoms) {
    const value = answers[s.id];
    if (s.scale === 'yes-no') {
      if (value || anyAnswer) out[`own:${s.id}`] = value === 'yes';
    } else if (value) {
      out[`own:${s.id}`] =
        s.scale === 'zero-five' ? Number(value) >= 3 : value === 'medium' || value === 'large';
    }
  }
  return out;
}

/**
 * Everything the Insights tab shows, computed on the phone from the local database (F17, F19, F20; ADR 0019):
 * the week ending on `end` and six weeks of relations.
 */
export async function loadInsights(db: Db, end: LocalDate): Promise<InsightsData> {
  const from = addDays(end, -(RELATION_DAYS - 1));
  const weekFrom = addDays(end, -(WEEK_DAYS - 1));
  const [profile, weights, symptoms, items, ownItems, foods, dishes, ownDishes, units] =
    await Promise.all([
      getProfile(db),
      weightsBetween(db, addDays(from, -TREND_DAYS), end),
      listSymptoms(db),
      db.select().from(dishItem),
      db.select().from(userDishItem).where(isNull(userDishItem.deletedAt)),
      db
        .select({
          id: food.id,
          name: food.name,
          per100g: food.per100g,
          tags: food.tags,
          sourceKind: food.sourceKind,
          sourceCode: food.sourceCode,
        })
        .from(food),
      db.select({ id: dish.id, name: dish.name }).from(dish),
      db.select({ id: userDish.id, name: userDish.name }).from(userDish),
      db.select().from(foodUnit).orderBy(asc(foodUnit.position)),
    ]);
  const dates = Array.from({ length: RELATION_DAYS }, (_, i) => addDays(from, i));
  const days = await Promise.all(dates.map((date) => loadDay(db, date, { profile, weights })));
  const [answers, notes] = await Promise.all([
    Promise.all(dates.map((date) => symptomAnswersOn(db, date))),
    notesBetween(db, from, end),
  ]);

  const ingredients = new Map<string, string[]>();
  const recipe = new Map<string, { food: string; grams: number }[]>();
  for (const i of [
    ...items.map((x) => ({ owner: x.dishId, food: x.foodId, grams: x.grams })),
    ...ownItems.map((x) => ({ owner: x.userDishId, food: x.foodId, grams: x.grams })),
  ]) {
    ingredients.set(i.owner, [...(ingredients.get(i.owner) ?? []), i.food]);
    recipe.set(i.owner, [...(recipe.get(i.owner) ?? []), { food: i.food, grams: i.grams }]);
  }
  const bucketFood = new Map<string, BucketFood>(
    foods.map((f) => [
      f.id,
      {
        name: f.name,
        tags: f.tags ?? [],
        insCode: f.sourceKind === 'INS' ? f.sourceCode : null,
        per100g: f.per100g,
      },
    ]),
  );
  const foodName = new Map(foods.map((f) => [f.id, f.name]));
  const dishName = new Map([...dishes, ...ownDishes].map((d) => [d.id, d.name]));

  const summaries = days.map(summarizeDay);
  const associationDays: AssociationDay[] = days.map((day, i) => {
    const summary = summaries[i]!;
    const exposures = new Set<string>();
    for (const m of day.meals) {
      exposures.add(`${m.kind}:${m.itemId}`);
      if (m.kind === 'dish')
        for (const f of ingredientsEaten(recipe.get(m.itemId) ?? [], m.grams))
          exposures.add(`food:${f}`);
    }
    if (day.drinks.some((d) => d.kind === 'alcohol')) exposures.add('tag:alcohol');
    if (day.drinks.some((d) => d.kind === 'zero-calorie')) exposures.add('tag:coffee-tea');
    if (
      summary.targets &&
      summary.eaten.addedSugarG > addedSugarLimits(summary.targets.targetKcal).greenMaxG
    )
      exposures.add('tag:sugar-high');
    if (day.sleep.length && daySleepHours(day.sleep.map((s) => s.stamps)) < SHORT_SLEEP_H)
      exposures.add('tag:short-sleep');
    if (day.sleep.some((s) => s.quality !== null && s.quality <= 2))
      exposures.add('tag:poor-sleep');
    const motorbikeMin = day.activities
      .filter((a) => a.kind === 'motorbike')
      .reduce((sum, a) => sum + a.minutes, 0);
    if (motorbikeMin >= LONG_MOTORBIKE_MIN) exposures.add('tag:long-motorbike');
    if (day.activities.some((a) => a.intensity === 'hard')) exposures.add('tag:hard-activity');
    if (day.activities.length) exposures.add('tag:activity');
    if (day.status.noActivity) exposures.add('tag:no-activity');
    return {
      date: day.date,
      exposures: [...exposures],
      symptoms: badSymptoms(day, answers[i]!, symptoms),
    };
  });

  // Own symptoms are marked every day they last (F13): triggers are looked for on each episode's first day only, so
  // the days after it neither count as a new bad day nor as a good one.
  const episodeStarts: LocalDate[] = [];
  for (const s of symptoms) {
    const key = `own:${s.id}`;
    const present = associationDays.filter((d) => d.symptoms[key]).map((d) => d.date);
    const starts = new Set(symptomEpisodes(present).map((e) => e.start));
    episodeStarts.push(...starts);
    associationDays.forEach((d, i) => {
      if (!d.symptoms[key] || starts.has(d.date)) return;
      associationDays[i] = {
        ...d,
        symptoms: Object.fromEntries(Object.entries(d.symptoms).filter(([k]) => k !== key)),
      };
    });
  }

  const toExposure = (key: string): Exposure => {
    const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    if (kind === 'tag') return { kind: 'tag', id: id as Extract<Exposure, { kind: 'tag' }>['id'] };
    const name = (kind === 'food' ? foodName.get(id) : dishName.get(id)) ?? id;
    return { kind: kind as 'food' | 'dish', id, name };
  };
  const ownName = new Map(symptoms.map((s) => [s.id, s.name]));
  const toSymptom = (key: string): SymptomRef => {
    const id = key.slice(key.indexOf(':') + 1);
    return key.startsWith('own:')
      ? { kind: 'own', id, name: ownName.get(id) ?? id }
      : { kind: 'check', id: id as Extract<SymptomRef, { kind: 'check' }>['id'] };
  };
  const digestiveOwn = new Set(
    symptoms.filter((s) => isDigestiveName(s.name)).map((s) => `own:${s.id}`),
  );
  const found = findAssociations(associationDays, (exposure, symptom) =>
    mayRelate(exposure, symptom, digestiveOwn),
  );
  const relations: InsightsData['relations'] =
    found.status === 'need-days'
      ? found
      : {
          ...found,
          findings: found.findings.map((f) => ({
            ...f,
            exposure: toExposure(f.exposure),
            symptom: toSymptom(f.symptom),
          })),
        };

  // The week (F19, F20).
  const week = days.slice(-WEEK_DAYS);
  const weekSummaries = summaries.slice(-WEEK_DAYS);
  const summary = weeklySummary(
    week.map((day, i) => ({
      colour: weekSummaries[i]!.colour,
      movementMinutes: weekSummaries[i]!.movementMinutes,
      trendKg: trendWeightKg(day.weights),
      weighed: day.weights.some((w) => w.date === day.date),
    })),
  );
  const nutrientDays: NutrientDay[] = week.map((day, i) => ({
    meals: new Set(day.meals.map((m) => m.meal)).size,
    targetKcal: weekSummaries[i]!.targets?.targetKcal ?? null,
    entries: day.meals.map((m) => ({ grams: m.grams ?? 0, per100g: m.per100g })),
  }));
  const nutrients = profile
    ? weeklyNutrients({
        days: nutrientDays,
        sex: profile.sex,
        ageYears: ageOn({ ageYears: profile.ageYears, ageSetOn: profile.ageSetOn, today: end }),
      })
    : null;

  const eatenIds = new Set(
    days.flatMap((d) =>
      d.meals.flatMap((m) => (m.kind === 'food' ? [m.itemId] : (ingredients.get(m.itemId) ?? []))),
    ),
  );
  const firstUnit = new Map<string, { label: string; grams: number | null }>();
  for (const u of units) if (!firstUnit.has(u.foodId)) firstUnit.set(u.foodId, u);
  const sources: InsightsData['sources'] = {};
  const richest: InsightsData['richest'] = {};
  const weekMeals = week.flatMap((d) => d.meals);
  for (const key of WEEKLY_NUTRIENTS) {
    const byName = new Map<string, number>();
    for (const m of weekMeals) {
      const per100 = m.per100g?.[key];
      if (per100 == null || !m.grams) continue;
      byName.set(m.name, (byName.get(m.name) ?? 0) + (per100 * m.grams) / 100);
    }
    sources[key] = [...byName]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    if (key === 'sodiumMg') continue;
    richest[key] = foods
      .flatMap((f) => {
        const unit = firstUnit.get(f.id);
        const per100 = f.per100g?.[key];
        if (!unit?.grams || per100 == null || per100 <= 0) return [];
        return [
          {
            name: f.name,
            amount: (per100 * unit.grams) / 100,
            portion: unit.label,
            eaten: eatenIds.has(f.id),
          },
        ];
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 12)
      .sort((a, b) => Number(b.eaten) - Number(a.eaten))
      .slice(0, 5);
  }

  // Where the calories come from (F24): each logged item split into rice, flours, sweets, fruit and the rest.
  const calorieParts: CaloriePart[][] = week.map((day) =>
    day.meals.flatMap((m) =>
      itemParts({
        name: m.name,
        kcal: m.kcal,
        food: m.kind === 'food' ? bucketFood.get(m.itemId) : undefined,
        ingredients:
          m.kind === 'dish'
            ? (recipe.get(m.itemId) ?? []).flatMap((i) => {
                const f = bucketFood.get(i.food);
                return f ? [{ food: f, grams: i.grams }] : [];
              })
            : undefined,
        addedSugarG: m.addedSugarG,
        refinedFlourG: m.refinedFlourG,
      }),
    ),
  );

  return {
    from: weekFrom,
    calories: weeklyCalorieSources(calorieParts),
    to: end,
    relationsFrom: from,
    notes,
    strengthDays: week.filter((d) =>
      d.activities.some((a) => a.kind === 'weights' || a.kind === 'routine'),
    ).length,
    loggedDates: days.filter((_, i) => summaries[i]!.hasEntries).map((d) => d.date),
    episodeStarts,
    week: summary,
    nutrients,
    sources,
    richest,
    relations,
  };
}
