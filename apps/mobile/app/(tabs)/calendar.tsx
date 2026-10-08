import { drunkGlasses } from '@kawsay/core/day/drinks';
import { addDays, monthDays, type LocalMonth } from '@kawsay/core/shared/local-date';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { loadDay, summarizeDay, TREND_DAYS, type DayData } from '@/compose/day';
import { CalendarScreen, type CalendarDay } from '@/features/calendar/CalendarScreen';
import { getProfile } from '@/features/profile/profile-db';
import { trendWeightKg } from '@/features/profile/profile-targets';
import { weightsBetween } from '@/features/weight/weight-db';
import { useDb } from '@/lib/db/DatabaseProvider';
import { today as todayOnPhone } from '@/lib/today';
import { useLoad } from '@/lib/use-load';
import { useReloadOnFocus } from '@/lib/use-reload-on-focus';

function calendarDay(day: DayData): CalendarDay {
  const summary = summarizeDay(day);
  return {
    date: day.date,
    colour: summary.colour,
    kcal: summary.eaten.kcal,
    targetKcal: summary.targets?.targetKcal ?? null,
    proteinG: summary.eaten.proteinG,
    targetProteinG: summary.targets?.proteinG ?? null,
    movementMinutes: summary.movementMinutes,
    activity: day.activities.length > 0 ? 'logged' : day.status.noActivity ? 'none' : 'missing',
    glasses: drunkGlasses([
      ...day.drinks.map((d) => ({ ml: d.volumeMl, alcohol: d.kind === 'alcohol' })),
      ...day.meals.flatMap((m) =>
        m.volumeMl === null ? [] : [{ ml: m.volumeMl, alcohol: false }],
      ),
    ]),
    bloating: summary.checks.bloating,
    weightKg: day.weights.find((w) => w.date === day.date)?.kg ?? null,
    trendKg: trendWeightKg(day.weights),
  };
}

/** Calendar (F14): every past day of the month computed like Today (ADR 0017). */
export default function CalendarRoute() {
  const { db } = useDb();
  const today = todayOnPhone();
  const [month, setMonth] = useState<LocalMonth>(today.slice(0, 7));
  const { data, reload } = useLoad(
    useCallback(async () => {
      const dates = monthDays(month).filter((date) => date <= today);
      const last = dates.at(-1);
      if (!last) return [];
      const [profile, weights] = await Promise.all([
        getProfile(db),
        weightsBetween(db, addDays(`${month}-01`, -TREND_DAYS), last),
      ]);
      const days = await Promise.all(dates.map((date) => loadDay(db, date, { profile, weights })));
      return days.map(calendarDay);
    }, [db, month, today]),
  );
  useReloadOnFocus(reload);
  return (
    <CalendarScreen
      month={month}
      today={today}
      days={data ?? []}
      onMonth={setMonth}
      onOpenDay={(day) => router.navigate({ pathname: '/', params: { day } })}
    />
  );
}
