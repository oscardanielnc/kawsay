import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import { color, radius, space, touch, type } from '@/lib/theme';
import { latestCheckIns, type CheckIn, type CheckInKind } from './checkins-db';
import { Face } from '@/components/data-display/Face';
import { Bristol, Gas } from './icons';

interface Props {
  rows: readonly CheckIn[];
  onCheckIn: (kind: CheckInKind, value: string) => void;
  onDelete: (id: string) => void;
}

const BRISTOL = ['1', '2', '3', '4', '5', '6', '7'] as const;
type Scale = 'stress' | 'energy' | 'mood';
/**
 * Stored steps from left to right: the most negative face is always on the left (F10). Stress is stored 1 none …
 * 5 highest, so it reads backwards.
 */
const SCALES: readonly { kind: Scale; steps: readonly string[] }[] = [
  { kind: 'stress', steps: ['5', '4', '3', '2', '1'] },
  { kind: 'energy', steps: ['1', '2', '3', '4', '5'] },
  { kind: 'mood', steps: ['1', '2', '3', '4', '5'] },
];

/** Body and mood (F10): bathroom, the day's stress peak, energy and mood, one or two taps each. */
export function CheckInsSection({ rows, onCheckIn, onDelete }: Props) {
  const { t } = useTranslation();
  const [bathroomSheet, setBathroomSheet] = useState(false);
  const latest = latestCheckIns(rows);
  const visits = rows.filter((r) => r.kind === 'bathroom' && r.value !== 'none');
  const none = rows.find((r) => r.kind === 'bathroom' && r.value === 'none');
  const visitName = (value: string) =>
    value === 'gas'
      ? t('checkins.gas')
      : t(`checkins.bristol.${value as (typeof BRISTOL)[number]}`);
  const visit = (value: string) => {
    onCheckIn('bathroom', value);
    setBathroomSheet(false);
  };

  const face = (
    question: string,
    label: string,
    level: number,
    selected: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={`${question}: ${label}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.face}
    >
      <View style={selected && styles.picked}>
        <Face level={level} on={selected} />
      </View>
      <Text style={[type.caption, selected ? styles.ink : styles.muted]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Card title={t('checkins.title')}>
      <Text style={[type.heading, styles.ink]}>{t('checkins.bathroom')}</Text>
      <View style={styles.chips}>
        {visits.map((v) => (
          <Pressable
            key={v.id}
            accessibilityRole="button"
            accessibilityLabel={t('checkins.remove', { name: visitName(v.value) })}
            onPress={() => onDelete(v.id)}
            style={styles.chip}
          >
            {v.value === 'gas' ? <Gas /> : <Bristol type={Number(v.value)} />}
            <Text style={[type.label, styles.ink]}>{visitName(v.value)}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => setBathroomSheet(true)}
          style={[styles.chip, styles.add]}
        >
          <Text style={[type.label, styles.accent]}>{t('checkins.addVisit')}</Text>
        </Pressable>
        {visits.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: none !== undefined }}
            onPress={() => (none ? onDelete(none.id) : onCheckIn('bathroom', 'none'))}
            style={[styles.chip, none && styles.on]}
          >
            <Text style={[type.label, styles.ink]}>{t('checkins.none')}</Text>
          </Pressable>
        ) : null}
      </View>

      {SCALES.map(({ kind, steps }) => (
        <View key={kind} style={styles.block}>
          <Text style={[type.heading, styles.ink]}>{t(`checkins.${kind}`)}</Text>
          <View style={styles.scale}>
            {steps.map((step, i) =>
              face(
                t(`checkins.${kind}`),
                t(`checkins.${kind}Values.${step as '1'}`),
                i,
                latest[kind] === step,
                () => onCheckIn(kind, step),
              ),
            )}
          </View>
          {kind === 'stress' ? (
            <Text style={[type.caption, styles.muted]}>{t('checkins.stressHint')}</Text>
          ) : null}
        </View>
      ))}

      <Sheet
        title={bathroomSheet ? t('checkins.visitTitle') : null}
        onDone={() => setBathroomSheet(false)}
      >
        <View style={styles.grid}>
          {BRISTOL.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={t('checkins.bristolLabel', {
                n,
                name: t(`checkins.bristol.${n}`),
              })}
              onPress={() => visit(n)}
              style={styles.tile}
            >
              <Bristol type={Number(n)} />
              <Text
                style={[type.caption, styles.ink]}
              >{`${n} · ${t(`checkins.bristol.${n}`)}`}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={() => visit('gas')} style={styles.tile}>
            <Gas />
            <Text style={[type.caption, styles.ink]}>{t('checkins.gas')}</Text>
          </Pressable>
        </View>
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
  },
  add: { borderStyle: 'dashed', borderColor: color.blue700 },
  on: { borderColor: color.blue700, backgroundColor: color.blue50 },
  scale: { flexDirection: 'row', gap: space.xs },
  face: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 2 },
  picked: { transform: [{ scale: 1.14 }] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '30%',
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.sm,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  accent: { color: color.blue700 },
});
