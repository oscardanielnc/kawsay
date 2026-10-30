import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatMoment } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { StoredAnalysis } from './analysis-store';

export type AnalysisError = 'limit' | 'offline' | 'account' | 'unavailable';
/** Which message a failed analysis shows; `code` is the API problem code when there is one. */
export function analysisError(error: unknown): AnalysisError {
  const e = error as { name?: string; code?: string | null; status?: number };
  if (e.code === 'insights.limit_reached') return 'limit';
  if (e.name === 'SignedOutError' || e.status === 401) return 'account';
  if (e.name === 'TypeError') return 'offline';
  return 'unavailable';
}

export type AnalysisStatus =
  { kind: 'idle' } | { kind: 'working' } | { kind: 'failed'; error: AnalysisError };

interface Props {
  stored: StoredAnalysis | null;
  status: AnalysisStatus;
  timeZone: string;
  onAnalyze: () => void;
}

/**
 * "Analyse with AI" (F17, ADR 0019): says what leaves the phone, runs on demand, and shows the latest answer —
 * summary, findings with confidence and source, habits to try, warning signs — never as a diagnosis.
 */
export function AiAnalysisCard({ stored, status, timeZone, onAnalyze }: Props) {
  const { t } = useTranslation();
  const working = status.kind === 'working';
  const a = stored?.analysis;
  return (
    <Card>
      <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
        {t('insights.ai.title')}
      </Text>
      <Text style={[type.caption, styles.muted]}>{t('insights.ai.privacy')}</Text>
      <Button
        label={
          working ? t('insights.ai.working') : t(stored ? 'insights.ai.again' : 'insights.ai.run')
        }
        disabled={working}
        onPress={onAnalyze}
      />
      {status.kind === 'failed' ? (
        <Text accessibilityRole="alert" style={[type.body, styles.danger]}>
          {t(`insights.ai.errors.${status.error}`)}
        </Text>
      ) : null}
      {stored && a ? (
        <View style={styles.result}>
          <Text style={[type.caption, styles.muted]}>
            {t('insights.ai.made', {
              moment: formatMoment(stored.at, timeZone),
              remaining: stored.remaining,
            })}
          </Text>
          <Text style={[type.body, styles.ink]}>{a.summary}</Text>
          {a.findings.length ? (
            <Text style={[type.label, styles.ink]}>{t('insights.ai.findings')}</Text>
          ) : null}
          {a.findings.map((f) => (
            <View key={f.title} style={styles.finding}>
              <Text style={[type.label, styles.ink]}>{f.title}</Text>
              <View style={styles.chips}>
                <View style={[styles.chip, styles.confidenceChip]}>
                  <Text style={[type.caption, styles.confidence]}>
                    {t(`insights.relations.confidence.${f.confidence}`)}
                  </Text>
                </View>
                <View style={[styles.chip, styles.source]}>
                  <Text style={[type.caption, styles.muted]}>
                    {t(`insights.ai.basedOn.${f.basedOn}`)}
                  </Text>
                </View>
              </View>
              <Text style={[type.caption, styles.ink]}>{f.explanation}</Text>
            </View>
          ))}
          {a.suggestions.length ? (
            <Text style={[type.label, styles.ink]}>{t('insights.ai.suggestions')}</Text>
          ) : null}
          {a.suggestions.map((s) => (
            <View key={s.habit} style={styles.suggestion}>
              <Text style={[type.label, styles.success]}>{`✓ ${s.habit}`}</Text>
              <Text style={[type.caption, styles.muted]}>{s.why}</Text>
            </View>
          ))}
          {a.warningSigns.length ? (
            <View style={styles.warning}>
              <Text style={[type.label, styles.danger]}>{t('insights.ai.warning')}</Text>
              {a.warningSigns.map((w) => (
                <Text key={w} style={[type.caption, styles.ink]}>{`• ${w}`}</Text>
              ))}
            </View>
          ) : null}
          <Text style={[type.caption, styles.muted]}>{t('insights.ai.footer')}</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  result: { gap: space.sm, marginTop: space.xs },
  finding: {
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.card - 2,
    backgroundColor: color.surface2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill },
  confidenceChip: { backgroundColor: color.blue50 },
  confidence: { color: color.blue800 },
  source: { backgroundColor: color.line },
  suggestion: { gap: 2, paddingLeft: space.xs },
  warning: {
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.card - 2,
    backgroundColor: color.coral50,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  danger: { color: color.coral800 },
  success: { color: color.blue800 },
});
