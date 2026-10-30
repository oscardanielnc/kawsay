import type { SuggestReason } from '@kawsay/core/insights/should-suggest-update';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Pill, type PillTone } from '@/components/data-display/Pill';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatMoment } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { StoredAnalysis } from './analysis-store';

export type AnalysisError = 'limit' | 'offline' | 'account' | 'unavailable';
/** Which message a failed summary shows; `code` is the API problem code when there is one. */
export function analysisError(error: unknown): AnalysisError {
  const e = error as { name?: string; code?: string | null; status?: number };
  if (e.code === 'insights.limit_reached') return 'limit';
  if (e.name === 'SignedOutError' || e.status === 401) return 'account';
  if (e.name === 'TypeError') return 'offline';
  return 'unavailable';
}

export type AnalysisStatus =
  { kind: 'idle' } | { kind: 'working' } | { kind: 'failed'; error: AnalysisError };

const TAG: Record<string, PillTone> = {
  food: 'peach',
  sleep: 'in',
  stress: 'far',
  activity: 'neutral',
  symptom: 'near',
};
const LEVEL = { low: 1, medium: 2, high: 3 } as const;

interface Props {
  stored: StoredAnalysis | null;
  status: AnalysisStatus;
  timeZone: string;
  /** Why the card suggests an update; null = "Al día". */
  suggest: SuggestReason | null;
  onAnalyze: () => void;
}

/**
 * "Resumen con IA" (F17 redesign, Analysis.dc.html): the date of the last summary, a banner that suggests updating
 * or says "Al día", and "Actualizar resumen" as the only thing that calls the AI. Findings with a coloured tag and
 * three confidence dots, habits to try, warning signs only when present, never a diagnosis.
 */
export function AiAnalysisCard({ stored, status, timeZone, suggest, onAnalyze }: Props) {
  const { t } = useTranslation();
  const working = status.kind === 'working';
  const s = stored?.summary;
  return (
    <Card
      title={t('insights.ai.title')}
      action={
        <Text style={[type.caption, styles.muted]}>
          {stored
            ? t('insights.ai.updated', { moment: formatMoment(stored.at, timeZone) })
            : t('insights.ai.never')}
        </Text>
      }
    >
      <View style={[styles.banner, suggest ? styles.bannerSuggest : styles.bannerFresh]}>
        <View
          style={[styles.bannerDot, { backgroundColor: suggest ? color.peach300 : color.blue500 }]}
        />
        <Text style={[type.label, styles.ink, styles.grow]}>
          {suggest ? t(`insights.ai.suggest.${suggest}`) : t('insights.ai.upToDate')}
        </Text>
      </View>
      <Button
        label={working ? t('insights.ai.working') : t('insights.ai.update')}
        variant={suggest ? 'primary' : 'secondary'}
        disabled={working}
        onPress={onAnalyze}
      />
      <Text style={[type.caption, styles.muted, styles.center]}>
        {t('insights.ai.left', { remaining: stored?.remaining ?? 3 })}
      </Text>
      {status.kind === 'failed' ? (
        <Text accessibilityRole="alert" style={[type.body, styles.danger]}>
          {t(`insights.ai.errors.${status.error}`)}
        </Text>
      ) : null}
      {s ? (
        <View style={styles.result}>
          <Text style={[type.body, styles.ink]}>{s.summary}</Text>
          {s.findings.map((f) => (
            <View key={f.title} style={styles.finding}>
              <View style={styles.row}>
                <Pill tone={TAG[f.tag] ?? 'neutral'} text={t(`insights.ai.tags.${f.tag}`)} />
                <View
                  accessible
                  accessibilityLabel={t(`insights.ai.confidence.${f.confidence}`)}
                  style={styles.dots}
                >
                  {[1, 2, 3].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.dot,
                        { backgroundColor: n <= LEVEL[f.confidence] ? color.blue500 : color.line },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={[type.heading, styles.ink]}>{f.title}</Text>
              <Text style={[type.label, styles.soft]}>{f.detail}</Text>
            </View>
          ))}
          {s.habits.length ? (
            <>
              <Text style={[type.section, styles.soft]}>{t('insights.ai.habits')}</Text>
              <View style={styles.chips}>
                {s.habits.map((habit) => (
                  <Pill key={habit} tone="in" text={habit} />
                ))}
              </View>
            </>
          ) : null}
          {s.warningSigns.length ? (
            <View style={styles.warning}>
              <Text style={[type.label, styles.danger]}>{t('insights.ai.warning')}</Text>
              {s.warningSigns.map((w) => (
                <Text key={w} style={[type.label, styles.ink]}>{`• ${w}`}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      <Text style={[type.caption, styles.muted]}>{t('insights.ai.privacy')}</Text>
      <Text style={[type.caption, styles.muted]}>{t('insights.ai.footer')}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.inner,
  },
  bannerSuggest: { backgroundColor: color.peach50 },
  bannerFresh: { backgroundColor: color.blue50 },
  bannerDot: { width: 10, height: 10, borderRadius: 5 },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  result: { gap: space.md },
  finding: {
    gap: 4,
    padding: space.md,
    borderRadius: radius.inner,
    backgroundColor: color.surface2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  warning: {
    gap: 4,
    padding: space.md,
    borderRadius: radius.inner,
    backgroundColor: color.coral50,
  },
  ink: { color: color.ink },
  soft: { color: color.inkSoft },
  muted: { color: color.inkMuted },
  danger: { color: color.coral800 },
});
