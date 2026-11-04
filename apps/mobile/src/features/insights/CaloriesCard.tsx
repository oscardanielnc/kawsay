import type { CalorieBucket, weeklyCalorieSources } from '@kawsay/core/insights/calorie-sources';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/layout/Card';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';

const TINT: Record<CalorieBucket, string> = {
  rice: color.amber300,
  flour: color.peach300,
  sweets: color.coral300,
  fruit: color.blue300,
  other: color.noData,
};

const percent = (share: number) => `${formatNumber(share * 100)} %`;

/** "Where your calories come from" (F24): one stacked bar and a row per bucket with what added most. */
export function CaloriesCard({ calories }: { calories: ReturnType<typeof weeklyCalorieSources> }) {
  const { t } = useTranslation();
  return (
    <Card>
      <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
        {t('insights.calories.title')}
      </Text>
      {calories.status === 'need-days' ? (
        <Text style={[type.body, styles.muted]}>
          {t('insights.calories.needDays', {
            count: calories.countedDays,
            needed: calories.neededDays,
          })}
        </Text>
      ) : (
        <>
          <Text style={[type.caption, styles.muted]}>
            {t('insights.calories.average', { kcal: formatNumber(calories.kcalPerDay) })}
          </Text>
          <View style={styles.bar}>
            {calories.rows.map((row) => (
              <View
                key={row.bucket}
                style={{ flex: row.share, backgroundColor: TINT[row.bucket] }}
              />
            ))}
          </View>
          {calories.rows.map((row) => (
            <View
              key={row.bucket}
              accessible
              accessibilityLabel={`${t(`insights.calories.buckets.${row.bucket}`)}: ${percent(row.share)}`}
              style={styles.row}
            >
              <View style={styles.top}>
                <View style={[styles.dot, { backgroundColor: TINT[row.bucket] }]} />
                <Text style={[type.label, styles.ink, styles.grow]}>
                  {t(`insights.calories.buckets.${row.bucket}`)}
                </Text>
                <Text style={[type.label, styles.ink]}>{percent(row.share)}</Text>
              </View>
              <Text style={[type.caption, styles.muted]} numberOfLines={2}>
                {t('insights.calories.perDay', { kcal: formatNumber(row.kcalPerDay) })}
                {row.top.length ? ` · ${row.top.map((x) => x.name).join(', ')}` : ''}
              </Text>
            </View>
          ))}
          <Text style={[type.caption, styles.muted]}>{t('insights.calories.why')}</Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: color.surface2,
    marginVertical: space.xs,
  },
  row: { gap: 2, paddingVertical: space.xs },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  grow: { flex: 1 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
