import type { weeklyCalorieSources } from '@kawsay/core/insights/calorie-sources';
import type { Association } from '@kawsay/core/insights/associations';
import type { weeklyNutrients } from '@kawsay/core/insights/weekly-nutrients';
import type { weeklySummary } from '@kawsay/core/insights/weekly-summary';
import type { WeeklyNutrient } from '@kawsay/core/nutrition/references';
import type { LocalDate } from '@kawsay/core/shared/local-date';

/** What the Insights tab shows (F17 without AI, F19, F20); built by `compose/insights`. */

/** Something that may line up with a symptom: a food or dish eaten, or a tag of the day. */
export type Exposure =
  | { kind: 'food' | 'dish'; id: string; name: string }
  | {
      kind: 'tag';
      id: 'alcohol' | 'coffee-tea' | 'sugar-high' | 'short-sleep' | 'activity' | 'no-activity';
    };
/** A symptom read from check-ins, sleep or the user's own symptoms; `bad` rules in `badSymptoms`. */
export type SymptomRef =
  | {
      kind: 'check';
      id: 'bloating' | 'diarrhoea' | 'constipation' | 'stress' | 'energy' | 'mood' | 'sleep';
    }
  | { kind: 'own'; id: string; name: string };

export interface Relation extends Omit<Association, 'exposure' | 'symptom'> {
  exposure: Exposure;
  symptom: SymptomRef;
}

export interface FoodPick {
  name: string;
  /** Amount of the nutrient in that portion or in the week. */
  amount: number;
  portion?: string;
  /** Already logged by the user in the analysed weeks. */
  eaten?: boolean;
}

export interface InsightsData {
  from: LocalDate;
  to: LocalDate;
  /** First day of the six weeks the relations and the AI look at. */
  relationsFrom: LocalDate;
  /** Day notes of those six weeks, for the AI (ADR 0019); not shown on this tab. */
  notes: { date: LocalDate; text: string }[];
  week: ReturnType<typeof weeklySummary>;
  nutrients: ReturnType<typeof weeklyNutrients> | null;
  /** Where the week's calories come from (F24). */
  calories: ReturnType<typeof weeklyCalorieSources>;
  /** Per nutrient: the 3 biggest sources of the week and the 5 richest catalog foods per usual portion. */
  sources: Partial<Record<WeeklyNutrient, FoodPick[]>>;
  richest: Partial<Record<WeeklyNutrient, FoodPick[]>>;
  /** Days of the six weeks with something logged, and first days of own-symptom episodes: they decide when the
   * AI summary card suggests an update (F17). */
  loggedDates: LocalDate[];
  /** Days with weights, bodyweight or a routine in the week, against 2 (F20, ADR 0020). */
  strengthDays: number;
  episodeStarts: LocalDate[];
  relations:
    | { status: 'need-days'; loggedDays: number; neededDays: number }
    | { status: 'ok'; loggedDays: number; findings: Relation[] };
}
