import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { InsightsData } from './types';
import { color, radius, space, type } from '@/lib/theme';
import { AiAnalysisCard, type AnalysisStatus } from './AiAnalysisCard';
import type { StoredAnalysis } from './analysis-store';
import { NutrientsCard } from './NutrientsCard';
import { RelationsCard } from './RelationsCard';
import { WeekCard } from './WeekCard';

interface Props {
  data: InsightsData | null;
  /** The shown week ends on today: no "next". */
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  ai: {
    stored: StoredAnalysis | null;
    status: AnalysisStatus;
    timeZone: string;
    onAnalyze: () => void;
  };
}

/** "6 – 12 oct." for a week inside one month, "29 sept. – 5 oct." across two. */
function weekLabel(from: string, to: string): string {
  const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString('es-PE', { ...opts, timeZone: 'UTC' });
  return from.slice(0, 7) === to.slice(0, 7)
    ? `${Number(from.slice(8))} – ${fmt(to, { day: 'numeric', month: 'short' })}`
    : `${fmt(from, { day: 'numeric', month: 'short' })} – ${fmt(to, { day: 'numeric', month: 'short' })}`;
}

/** Insights tab (F17 without AI, F19, F20): the week ending on the chosen day, computed on the phone. */
export function InsightsScreen({ data, canNext, onPrev, onNext, ai }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[type.title, styles.ink]}>
          {t('insights.title')}
        </Text>
        {data ? (
          <>
            <View style={styles.nav}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('insights.prevWeek')}
                onPress={onPrev}
                style={styles.arrow}
              >
                <Text style={[type.heading, styles.brand]}>‹</Text>
              </Pressable>
              <Text style={[type.label, styles.muted]}>{weekLabel(data.from, data.to)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('insights.nextWeek')}
                accessibilityState={{ disabled: !canNext }}
                disabled={!canNext}
                onPress={onNext}
                style={[styles.arrow, !canNext && styles.off]}
              >
                <Text style={[type.heading, styles.brand]}>›</Text>
              </Pressable>
            </View>
            <WeekCard week={data.week} />
            <NutrientsCard
              nutrients={data.nutrients}
              sources={data.sources}
              richest={data.richest}
            />
            <RelationsCard relations={data.relations} />
            <AiAnalysisCard {...ai} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.35 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.brand },
});
