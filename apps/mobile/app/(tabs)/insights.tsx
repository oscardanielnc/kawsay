import { addDays } from '@kawsay/core/shared/local-date';
import { useCallback, useState } from 'react';
import { loadInsights } from '@/compose/insights';
import { InsightsScreen } from '@/features/insights/InsightsScreen';
import { useDb } from '@/lib/db/DatabaseProvider';
import { today } from '@/lib/today';
import { useLoad } from '@/lib/use-load';
import { useReloadOnFocus } from '@/lib/use-reload-on-focus';

/** Insights (F17 without AI, F19, F20): computed on the phone from the local database (ADR 0019). */
export default function InsightsRoute() {
  const { db } = useDb();
  const now = today();
  const [end, setEnd] = useState(now);
  const { data, reload } = useLoad(useCallback(() => loadInsights(db, end), [db, end]));
  useReloadOnFocus(reload);
  return (
    <InsightsScreen
      data={data ?? null}
      canNext={end < now}
      onPrev={() => setEnd(addDays(end, -7))}
      onNext={() => setEnd(addDays(end, 7) > now ? now : addDays(end, 7))}
    />
  );
}
