import { shouldSuggestUpdate } from '@kawsay/core/insights/should-suggest-update';
import { addDays, localDateOf } from '@kawsay/core/shared/local-date';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadInsights } from '@/compose/insights';
import { loadLiver } from '@/compose/liver';
import { addLab } from '@/features/liver/labs-db';
import { LiverCard } from '@/features/liver/LiverCard';
import { analysisError, type AnalysisStatus } from '@/features/insights/AiAnalysisCard';
import { buildAnalysisRequest } from '@/features/insights/analysis-request';
import { lastAnalysis, saveAnalysis } from '@/features/insights/analysis-store';
import { InsightsScreen } from '@/features/insights/InsightsScreen';
import { useDb } from '@/lib/db/DatabaseProvider';
import { useSync } from '@/lib/sync/SyncProvider';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';
import { useLoad } from '@/lib/use-load';
import { useReloadOnFocus } from '@/lib/use-reload-on-focus';

/** Insights (F17, F19, F20): computed on the phone (ADR 0019); the AI analysis is asked on demand. */
export default function InsightsRoute() {
  const { t } = useTranslation();
  const { db, env } = useDb();
  const sync = useSync();
  const now = today();
  const [end, setEnd] = useState(now);
  const [status, setStatus] = useState<AnalysisStatus>({ kind: 'idle' });
  const { data, reload } = useLoad(useCallback(() => loadInsights(db, end), [db, end]));
  const { data: liver, reload: reloadLiver } = useLoad(
    useCallback(() => loadLiver(db, end), [db, end]),
  );
  useReloadOnFocus(reloadLiver);
  const { data: stored, reload: reloadStored } = useLoad(useCallback(() => lastAnalysis(db), [db]));
  useReloadOnFocus(reload);

  const run = () => {
    if (!data) return;
    if (sync.account?.kind !== 'signed-in') return setStatus({ kind: 'failed', error: 'account' });
    setStatus({ kind: 'working' });
    sync
      .summarize(buildAnalysisRequest(data, t))
      .then((response) => saveAnalysis(db, { ...response, at: env.now() }))
      .then(
        () => {
          setStatus({ kind: 'idle' });
          reloadStored();
        },
        (error: unknown) => setStatus({ kind: 'failed', error: analysisError(error) }),
      );
  };

  return (
    <InsightsScreen
      data={data ?? null}
      canNext={end < now}
      onPrev={() => setEnd(addDays(end, -7))}
      onNext={() => setEnd(addDays(end, 7) > now ? now : addDays(end, 7))}
      liver={
        liver ? (
          <LiverCard
            week={liver}
            today={now}
            onAddLab={(lab) => void addLab(db, env, lab).then(reloadLiver)}
          />
        ) : null
      }
      ai={{
        stored: stored ?? null,
        status,
        timeZone: deviceTimeZone(),
        // Only a suggestion: the AI runs when the user taps "Actualizar resumen", never on open (F17).
        suggest: data
          ? shouldSuggestUpdate({
              today: now,
              lastUpdate: stored ? localDateOf(new Date(stored.at), deviceTimeZone()) : null,
              loggedDays: data.loggedDates,
              episodeStarts: data.episodeStarts,
            })
          : null,
        onAnalyze: run,
      }}
    />
  );
}
