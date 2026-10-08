import type { DayTargets } from '@kawsay/core/targets/compute-day-targets';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';

interface Props {
  targets: DayTargets;
  movementGoalMin: number;
  awakeHours: number;
  proteinGPerKg: number;
  fatShare: number;
  referenceWeightKg: number;
}

/** The dark-green card: target of a day without exercise, its macros and an ⓘ with the formula (ADR 0009). */
export function TargetCard({ targets, movementGoalMin, awakeHours, proteinGPerKg, fatShare, referenceWeightKg }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const cells = [
    [formatNumber(targets.proteinG), t('profile.proteinG')],
    [formatNumber(targets.fatG), t('profile.fatG')],
    [formatNumber(targets.carbsG), t('profile.carbsG')],
    [String(movementGoalMin), t('profile.movementMin')],
  ] as const;
  return (
    <View style={styles.card}>
      <Text style={[type.caption, styles.soft]}>{t('profile.dayWithoutExercise')}</Text>
      <Text style={[type.display, styles.onDark]}>
        {formatNumber(targets.targetKcal)}
        <Text style={type.heading}> {t('profile.kcal')}</Text>
      </Text>
      <View style={styles.grid}>
        {cells.map(([value, label]) => (
          <View key={label} style={styles.cell}>
            <Text style={[type.title, styles.onDark]}>{value}</Text>
            <Text style={[type.caption, styles.soft]}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={[type.caption, styles.soft]}>{t('profile.targetNote')}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!open)}>
        <Text style={[type.label, styles.onDark]}>{t('profile.how')}</Text>
      </Pressable>
      {open ? (
        <Text style={[type.caption, styles.onDark]}>
          {t('profile.howBody', {
            bmr: formatNumber(targets.bmrKcal),
            awake: formatNumber(awakeHours, 1),
            expenditure: formatNumber(targets.expenditureKcal),
            target: formatNumber(targets.targetKcal),
            protein: formatNumber(proteinGPerKg, 1),
            reference: formatNumber(referenceWeightKg, 1),
            fat: formatNumber(fatShare * 100),
          })}
          {targets.lowCarbs ? `\n${t('profile.lowCarbs')}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.brand, borderRadius: radius.card, padding: space.lg, gap: space.sm, alignItems: 'center' },
  grid: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between' },
  cell: { alignItems: 'center', flex: 1 },
  onDark: { color: color.onDark, textAlign: 'center' },
  soft: { color: color.green100, textAlign: 'center' },
});
