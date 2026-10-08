import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import { color, radius, space, touch, type } from '@/lib/theme';
import { latestCheckIns, type CheckIn, type CheckInKind } from './checkins-db';
import { Bristol, Face, Gas, SCALE_PALETTE } from './icons';

interface Props {
  rows: readonly CheckIn[];
  onCheckIn: (kind: CheckInKind, value: string) => void;
  onDelete: (id: string) => void;
}

const BRISTOL = ['1', '2', '3', '4', '5', '6', '7'] as const;
const STEPS = ['1', '2', '3', '4', '5'] as const;
type Scale = 'stress' | 'energy' | 'mood';
/** Stress reads backwards: its highest step is the red one. */
const SCALES: readonly { kind: Scale; inverted: boolean }[] = [
  { kind: 'stress', inverted: true },
  { kind: 'energy', inverted: false },
  { kind: 'mood', inverted: false },
];
const BLOATING = [
  { value: 'better', level: 4 },
  { value: 'usual', level: 2 },
  { value: 'worse', level: 0 },
] as const;

/** Body and mood (F10): bathroom, bloating vs usual, the day's stress peak, energy and mood, one or two taps each. */
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
    tone: number,
    selected: boolean,
    onPress: () => void,
  ) => {
    const [bg, ink] = SCALE_PALETTE[tone] ?? SCALE_PALETTE[2];
    return (
      <Pressable
        key={label}
        accessibilityRole="button"
        accessibilityLabel={`${question}: ${label}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={[styles.face, { backgroundColor: bg }, selected && { borderColor: ink }]}
      >
        <Face level={level} ink={ink} />
        <Text style={[type.caption, { color: ink }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

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

      <Text style={[type.heading, styles.ink]}>{t('checkins.bloating')}</Text>
      <View style={styles.scale}>
        {BLOATING.map(({ value, level }) =>
          face(
            t('checkins.bloating'),
            t(`checkins.bloatingValues.${value}`),
            level,
            level,
            latest.bloating === value,
            () => onCheckIn('bloating', value),
          ),
        )}
      </View>

      {SCALES.map(({ kind, inverted }) => (
        <View key={kind} style={styles.block}>
          <Text style={[type.heading, styles.ink]}>{t(`checkins.${kind}`)}</Text>
          <View style={styles.scale}>
            {STEPS.map((step, i) =>
              face(
                t(`checkins.${kind}`),
                t(`checkins.${kind}Values.${step}`),
                i,
                inverted ? 4 - i : i,
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
  add: { borderStyle: 'dashed', borderColor: color.accent },
  on: { borderColor: color.brand, backgroundColor: color.green50 },
  scale: { flexDirection: 'row', gap: space.xs },
  face: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: 'transparent',
  },
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
  accent: { color: color.accent },
});
