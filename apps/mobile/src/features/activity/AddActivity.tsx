import { activityKcal, type Intensity } from '@kawsay/core/energy/activity';
import { ACTIVITY_TYPES, activityMet, type ActivityKind } from '@kawsay/core/energy/activity-types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIcon } from '@/components/data-display/ActivityIcon';
import { Segmented } from '@/components/forms/Segmented';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { TimeBand } from './activity-db';

export const DURATIONS = [15, 30, 45, 60, 90] as const;
export const INTENSITIES: readonly Intensity[] = ['light', 'medium', 'hard'];
export const BANDS: readonly TimeBand[] = ['early', 'morning', 'midday', 'afternoon', 'night'];

export interface NewActivityChoice {
  kind: ActivityKind;
  intensity: Intensity;
  minutes: number;
  met: number;
  timeBand: TimeBand;
}

interface Props {
  bmrKcal: number;
  defaultBand: TimeBand;
  onAdd: (choice: NewActivityChoice) => void;
}

/** Type, duration, intensity by the talk test, extra kcal with its ⓘ, and the time band (F08). */
export function AddActivity({ bmrKcal, defaultBand, onAdd }: Props) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ActivityKind | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] = useState<Intensity>('medium');
  const [band, setBand] = useState<TimeBand>(defaultBand);
  const [formula, setFormula] = useState(false);
  const met = kind ? activityMet(kind, intensity) : null;

  return (
    <>
      <View style={styles.grid}>
        {ACTIVITY_TYPES.map(({ kind: k }) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={t(`activity.kinds.${k}`)}
            accessibilityState={{ selected: kind === k }}
            onPress={() => setKind(k)}
            style={[styles.tile, kind === k && styles.selected]}
          >
            <ActivityIcon kind={k} />
            <Text style={[type.label, styles.ink]}>{t(`activity.kinds.${k}`)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[type.label, styles.muted]}>{t('activity.duration')}</Text>
      <Segmented options={DURATIONS.map((d) => ({ value: d, label: `${d}′` }))} value={minutes} onChange={setMinutes} />
      <Text style={[type.label, styles.muted]}>{t('activity.intensity')}</Text>
      <Segmented
        options={INTENSITIES.map((i) => ({ value: i, label: t(`activity.intensities.${i}`), hint: t(`activity.talk.${i}`) }))}
        value={intensity}
        onChange={setIntensity}
      />
      {met !== null ? (
        <View style={styles.preview}>
          <Text style={[type.body, styles.ink]}>
            {t('activity.preview', {
              kcal: formatNumber(activityKcal({ met, hours: minutes / 60, bmrKcal })),
              met: formatNumber(met, 1),
            })}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setFormula(!formula)}>
            <Text style={[type.label, styles.brand]}>{t('activity.how')}</Text>
          </Pressable>
          {formula ? (
            <Text style={[type.caption, styles.ink]}>{t('activity.formula', { bmr: formatNumber(bmrKcal) })}</Text>
          ) : null}
        </View>
      ) : null}
      <Text style={[type.label, styles.muted]}>{t('activity.when')}</Text>
      <Segmented options={BANDS.map((b) => ({ value: b, label: t(`activity.bands.${b}`) }))} value={band} onChange={setBand} />
      <Button
        label={t('activity.add')}
        disabled={kind === null}
        onPress={() => kind && met !== null && onAdd({ kind, intensity, minutes, met, timeBand: band })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '23%',
    minHeight: 84,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    padding: space.xs,
  },
  selected: { borderColor: color.brand, backgroundColor: color.green50 },
  preview: { backgroundColor: color.green50, borderRadius: radius.chip, padding: space.md, gap: space.xs },
  ink: { color: color.ink, textAlign: 'center' },
  muted: { color: color.inkMuted },
  brand: { color: color.brand },
});
