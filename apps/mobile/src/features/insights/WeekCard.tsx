import type { weeklySummary } from '@kawsay/core/insights/weekly-summary';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/layout/Card';
import { formatNumber } from '@/lib/format';
import { color, font, radius, space, type } from '@/lib/theme';

type Week = ReturnType<typeof weeklySummary>;

const COUNTS = [
  { tone: 'green', bg: color.green50, ink: color.successText },
  { tone: 'yellow', bg: color.warning50, ink: color.warningText },
  { tone: 'red', bg: color.danger50, ink: color.dangerText },
] as const;

/** "Your week" (F20): days by colour, movement minutes vs 150 and the weight trend change. */
export function WeekCard({ week }: { week: Week }) {
  const { t } = useTranslation();
  const { minutes, goalMinutes } = week.movement;
  return (
    <Card>
      <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
        {t('insights.week.title')}
      </Text>
      <View style={styles.counts}>
        {COUNTS.map(({ tone, bg, ink }) => (
          <View key={tone} style={[styles.count, { backgroundColor: bg }]}>
            <Text style={[styles.countValue, { color: ink }]}>{week.days[tone]}</Text>
            <Text style={[type.caption, styles.center, { color: ink }]}>
              {t(`insights.week.${tone}`)}
            </Text>
          </View>
        ))}
      </View>
      {week.days.grey > 0 ? (
        <Text style={[type.caption, styles.muted, styles.center]}>
          {t('insights.week.grey', { count: week.days.grey })}
        </Text>
      ) : null}
      <View style={styles.line}>
        <Text style={[type.label, styles.ink]}>{t('insights.week.movement')}</Text>
        <Text style={[type.label, styles.muted]}>
          {t('insights.week.movementValue', { minutes: formatNumber(minutes), goal: goalMinutes })}
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('insights.week.movement')}
        accessibilityValue={{ min: 0, max: goalMinutes, now: Math.min(minutes, goalMinutes) }}
        style={styles.bar}
      >
        <View style={[styles.fill, { width: `${Math.min(1, minutes / goalMinutes) * 100}%` }]} />
      </View>
      <View style={[styles.line, styles.divided]}>
        <Text style={[type.label, styles.ink]}>{t('insights.week.weight')}</Text>
        {week.weight.kind === 'change' ? (
          <Text style={styles.weight}>
            {`${week.weight.changeKg > 0 ? '+' : week.weight.changeKg < 0 ? '−' : ''}${formatNumber(Math.abs(week.weight.changeKg), 1)} kg`}
          </Text>
        ) : (
          <Text style={[type.label, styles.muted]}>
            {t('insights.week.weightMore', { count: week.weight.weights })}
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  counts: { flexDirection: 'row', gap: space.sm },
  count: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm + 2,
    borderRadius: radius.card - 2,
  },
  countValue: { fontFamily: font.title, fontSize: 26, lineHeight: 30 },
  center: { textAlign: 'center' },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: space.sm,
  },
  divided: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: space.md },
  bar: { height: 10, borderRadius: radius.pill, backgroundColor: '#F1ECE1', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: '#3E8A55' },
  weight: { fontFamily: font.title, fontSize: 20, color: color.ink },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
