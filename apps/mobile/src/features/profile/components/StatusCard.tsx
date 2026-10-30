import { bmiStatus, HEALTHY_BMI, weightAtBmi, type BmiBand } from '@kawsay/core/body/bmi';
import { waistToHeight } from '@kawsay/core/body/waist-to-height';
import type { Tone } from '@kawsay/core/shared/tone';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArcGauge } from '@/components/data-display/ArcGauge';
import { piecewise, UPPER_LIMIT } from '@/components/data-display/gauge';
import { BMI_BANDS, bmiPosition } from './bmi-gauge';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';

const TONE_TEXT: Record<Tone, string> = {
  green: color.blue800,
  yellow: color.amber800,
  red: color.coral800,
};
const TONE_PILL: Record<Tone, string> = {
  green: color.blue50,
  yellow: color.amber50,
  red: color.coral50,
};
/** Waist-to-height (NICE) on the upper-limit gauge: green below 0.5, yellow to 0.6, red above. */
const WAIST_POINTS: readonly [number, number][] = [
  [0.35, 0],
  [0.5, 3 / 7],
  [0.6, 5 / 7],
  [0.7, 1],
];

function Pill({ tone, text }: { tone: Tone; text: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: TONE_PILL[tone] }]}>
      <Text style={[type.label, { color: TONE_TEXT[tone] }]}>{text}</Text>
    </View>
  );
}

interface Props {
  weightKg: number;
  heightCm: number;
  goalWeightKg: number | null;
  /** The last weekly waist (F04), for the waist-to-height ratio. */
  waistCm?: number | null;
}

/** "Your status today" (F01): BMI from the trend weight, its WHO band and colour, kg to green, the goal flag. */
export function StatusCard({ weightKg, heightCm, goalWeightKg, waistCm = null }: Props) {
  const { t } = useTranslation();
  const [info, setInfo] = useState(false);
  const status = bmiStatus({ weightKg, heightCm });
  const band = (code: BmiBand) => t(`profile.bands.${code}`);
  const goal = goalWeightKg === null ? null : bmiStatus({ weightKg: goalWeightKg, heightCm });
  const waist = waistCm === null ? null : waistToHeight({ waistCm, heightCm });
  const limit = (bmi: number) => formatNumber(weightAtBmi(bmi, heightCm), 1);

  let distance = t('profile.inGreen');
  if (status.kgToHealthy < 0) {
    distance = t('profile.toGreenDown', {
      kg: formatNumber(-status.kgToHealthy, 1),
      limit: limit(HEALTHY_BMI.max),
    });
  } else if (status.kgToHealthy > 0) {
    distance = t('profile.toGreenUp', {
      kg: formatNumber(status.kgToHealthy, 1),
      limit: limit(HEALTHY_BMI.min),
    });
  }

  return (
    <View accessible={false} accessibilityLabel={t('profile.statusTitle')} style={styles.card}>
      <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
        {t('profile.statusTitle')}
      </Text>
      <View style={styles.gauges}>
        <View style={[styles.gauge, !waist && styles.single]}>
          <Text style={[type.label, styles.ink, styles.centered, styles.name]} numberOfLines={2}>
            {t('profile.bmiName')}
          </Text>
          <ArcGauge
            bands={BMI_BANDS}
            limits={[
              { at: bmiPosition(17), text: '17' },
              { at: bmiPosition(18.5), text: formatNumber(18.5, 1), strong: true },
              { at: bmiPosition(25), text: '25', strong: true },
              { at: bmiPosition(30), text: '30' },
            ]}
            needle={bmiPosition(status.bmi)}
            flag={goal ? bmiPosition(goal.bmi) : null}
            value={formatNumber(status.bmi, 1)}
            unit={t('profile.bmi')}
            accessibilityLabel={t('profile.bmiGauge', {
              bmi: formatNumber(status.bmi, 1),
              band: band(status.band),
            })}
          />
          <Pill tone={status.tone} text={band(status.band)} />
        </View>
        {waist ? (
          <View style={styles.gauge}>
            <Text style={[type.label, styles.ink, styles.centered, styles.name]} numberOfLines={2}>
              {t('waist.profileLine')}
            </Text>
            <ArcGauge
              bands={UPPER_LIMIT}
              limits={[
                { at: 3 / 7, text: formatNumber(0.5, 2), strong: true },
                { at: 5 / 7, text: formatNumber(0.6, 2) },
              ]}
              needle={piecewise(waist.ratio, WAIST_POINTS)}
              value={formatNumber(waist.ratio, 2)}
              unit={t('waist.unit')}
              accessibilityLabel={t('waist.ratio', {
                ratio: formatNumber(waist.ratio, 2),
                band: t(`waist.bands.${waist.band}`),
              })}
            />
            <Pill tone={waist.tone} text={t(`waist.bands.${waist.band}`)} />
          </View>
        ) : null}
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
      <View style={styles.facts}>
        <Text style={[type.caption, styles.muted]}>
          {t('profile.bodyLine', { kg: formatNumber(weightKg, 1), cm: heightCm })}
        </Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setInfo(!info)}>
        <Text style={[type.label, styles.brand]}>{t('profile.bmiInfo')}</Text>
      </Pressable>
      {info ? <Text style={[type.caption, styles.ink]}>{t('profile.bmiInfoBody')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Two lines always, so both gauges start at the same height whatever their names wrap to. */
  name: { minHeight: 36 },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.md,
  },
  gauges: { flexDirection: 'row', gap: space.sm },
  gauge: { flex: 1, gap: space.xs },
  single: { paddingHorizontal: '12%' },
  centered: { textAlign: 'center' },
  pill: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  facts: { flexDirection: 'row', justifyContent: 'space-between' },
  note: { backgroundColor: color.blue50, borderRadius: radius.chip, padding: space.md, gap: 2 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.blue700 },
});
