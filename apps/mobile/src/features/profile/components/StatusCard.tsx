import { bmiStatus, HEALTHY_BMI, weightAtBmi, type BmiBand } from '@kawsay/core/body/bmi';
import type { Tone } from '@kawsay/core/shared/tone';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';

const TONE_TEXT: Record<Tone, string> = { green: color.successText, yellow: color.warningText, red: color.dangerText };
const TONE_FILL: Record<Tone, string> = { green: color.rangeGreen, yellow: color.rangeYellow, red: color.rangeRed };
/** The 15–35 track of the design, zone by zone. */
const ZONES: readonly [number, number, Tone][] = [
  [15, 17, 'red'],
  [17, 18.5, 'yellow'],
  [18.5, 25, 'green'],
  [25, 30, 'yellow'],
  [30, 35, 'red'],
];
const position = (bmi: number) => `${Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100))}%` as const;

interface Props {
  weightKg: number;
  heightCm: number;
  goalWeightKg: number | null;
}

/** "Your status today" (F01): BMI from the trend weight, its WHO band and colour, kg to green, the goal flag. */
export function StatusCard({ weightKg, heightCm, goalWeightKg }: Props) {
  const { t } = useTranslation();
  const [info, setInfo] = useState(false);
  const status = bmiStatus({ weightKg, heightCm });
  const band = (code: BmiBand) => t(`profile.bands.${code}`);
  const goal = goalWeightKg === null ? null : bmiStatus({ weightKg: goalWeightKg, heightCm });
  const limit = (bmi: number) => formatNumber(weightAtBmi(bmi, heightCm), 1);

  let distance = t('profile.inGreen');
  if (status.kgToHealthy < 0) {
    distance = t('profile.toGreenDown', { kg: formatNumber(-status.kgToHealthy, 1), limit: limit(HEALTHY_BMI.max) });
  } else if (status.kgToHealthy > 0) {
    distance = t('profile.toGreenUp', { kg: formatNumber(status.kgToHealthy, 1), limit: limit(HEALTHY_BMI.min) });
  }

  return (
    <View accessible={false} accessibilityLabel={t('profile.statusTitle')} style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
          {t('profile.statusTitle')}
        </Text>
        <Text style={[type.label, styles.muted]}>{t('profile.bmi')}</Text>
      </View>
      <View style={styles.reading}>
        <Text style={[type.display, { color: TONE_TEXT[status.tone] }]}>{formatNumber(status.bmi, 1)}</Text>
        <View>
          <Text style={[type.heading, { color: TONE_TEXT[status.tone] }]}>{band(status.band)}</Text>
          <Text style={[type.caption, styles.muted]}>
            {t('profile.bodyLine', { kg: formatNumber(weightKg, 1), cm: heightCm })}
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        {ZONES.map(([from, to, tone]) => (
          <View key={from} style={{ flex: to - from, backgroundColor: TONE_FILL[tone] }} />
        ))}
        <View style={[styles.marker, { left: position(status.bmi) }]} />
        {goal ? <Text style={[styles.flag, { left: position(goal.bmi) }]}>🚩</Text> : null}
      </View>
      <View style={styles.note}>
        <Text style={[type.body, styles.ink]}>{distance}</Text>
        {goal && goalWeightKg !== null ? (
          <Text style={[type.caption, styles.muted]}>
            {t('profile.goalFlag', {
              kg: formatNumber(goalWeightKg, 1),
              bmi: formatNumber(goal.bmi, 1),
              band: band(goal.band).toLowerCase(),
            })}
          </Text>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" onPress={() => setInfo(!info)}>
        <Text style={[type.label, styles.brand]}>{t('profile.bmiInfo')}</Text>
      </Pressable>
      {info ? <Text style={[type.caption, styles.ink]}>{t('profile.bmiInfoBody')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.card, padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  reading: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  track: { flexDirection: 'row', height: 14, borderRadius: radius.pill, overflow: 'visible', marginTop: space.lg },
  marker: { position: 'absolute', top: -6, width: 4, height: 26, marginLeft: -2, borderRadius: 2, backgroundColor: color.ink },
  flag: { position: 'absolute', top: -24, marginLeft: -8, fontSize: 14 },
  note: { backgroundColor: color.green50, borderRadius: radius.chip, padding: space.md, gap: 2 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.brand },
});
