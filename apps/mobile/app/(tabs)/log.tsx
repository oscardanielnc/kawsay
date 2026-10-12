import { GLASS_ML } from '@kawsay/core/day/drinks';
import { router } from 'expo-router';
import { addDrink } from '@/features/hydration/hydration-db';
import { LogScreen, type LogTile } from '@/features/log/LogScreen';
import { useDb } from '@/lib/db/DatabaseProvider';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';

/** The Today section each tile opens. */
const SECTION: Record<LogTile, string> = {
  meals: 'meals',
  bathroom: 'body',
  activity: 'activity',
  water: 'water',
  mood: 'body',
  sleep: 'sleep',
  weight: 'weight',
  note: 'notes',
};

/** (+) tab: quick-log grid (design N1). */
export default function LogRoute() {
  const { db, env } = useDb();
  const open = (tile: LogTile) =>
    router.navigate({
      pathname: '/',
      params: { day: today(), focus: SECTION[tile], at: String(Date.now()) },
    });
  return (
    <LogScreen
      onPick={(tile) => {
        if (tile !== 'water') return open(tile);
        void addDrink(db, env, {
          date: today(),
          timeZone: deviceTimeZone(),
          kind: 'water',
          volumeMl: GLASS_ML,
        }).then(() => open(tile));
      }}
    />
  );
}
