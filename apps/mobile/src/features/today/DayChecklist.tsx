import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/layout/Card';
import { color, font, radius, space, type } from '@/lib/theme';
import { AREAS, type Area } from './day-logged';

/** Pending steps and borders: a pale blue that reads as "not yet" without alarm (Amanecer). */
const PENDING_STEP = '#DCE6F3';
const PENDING_BORDER = '#9DB3D1';
const TRACK = '#E3EAF4';

interface Props {
  areas: Record<Area, boolean>;
  done: number;
  movementMinutes: number;
  movementGoalMin: number;
  /** Jumps to the section of a part. */
  onPick: (area: Area) => void;
}

/**
 * "Tu día registrado" (Amanecer): six steps, done parts as blue "✓" pills, pending ones dashed and tappable; the
 * day's movement minutes as a bar against the daily goal.
 */
export function DayChecklist({ areas, done, movementMinutes, movementGoalMin, onPick }: Props) {
  const { t } = useTranslation();
  const share = Math.min(movementMinutes / movementGoalMin, 1);
  const left = Math.max(0, Math.ceil(movementGoalMin - movementMinutes));
  return (
    <Card
      title={t('rings.title')}
      action={<Text style={[type.label, styles.count]}>{t('rings.count', { done })}</Text>}
    >
      <View style={styles.steps}>
        {AREAS.map((area) => (
          <View
            key={area}
            style={[styles.step, { backgroundColor: areas[area] ? color.blue500 : PENDING_STEP }]}
          />
        ))}
      </View>
      <View style={styles.chips}>
        {AREAS.map((area) => {
          const isDone = areas[area];
          const name = t(`rings.areas.${area}`);
          return (
            <Pressable
              key={area}
              accessibilityRole="button"
              accessibilityLabel={t(isDone ? 'rings.done' : 'rings.pending', { area: name })}
              onPress={() => onPick(area)}
              style={[styles.chip, isDone ? styles.doneChip : styles.pendingChip]}
            >
              <Text style={[type.label, isDone ? styles.doneInk : styles.pendingInk]}>
                {isDone ? `✓ ${name}` : `${name} ›`}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.movement}>
        <View style={styles.row}>
          <Text style={[type.label, styles.ink]}>{t('rings.movement')}</Text>
          <Text style={[type.label, styles.muted]}>
            {left === 0
              ? t('rings.movementDone')
              : t('rings.movementOf', {
                  minutes: movementMinutes,
                  goal: movementGoalMin,
                  left,
                })}
          </Text>
        </View>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('rings.movement')}
          accessibilityValue={{
            min: 0,
            max: movementGoalMin,
            now: Math.min(movementMinutes, movementGoalMin),
          }}
          style={styles.bar}
        >
          <View style={[styles.fill, { width: `${share * 100}%` }]} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  count: { color: color.blue700, fontFamily: font.strong },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  steps: { flexDirection: 'row', gap: space.xs },
  step: { flex: 1, height: 6, borderRadius: radius.pill },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: space.md - 2,
    borderRadius: radius.pill,
  },
  doneChip: { backgroundColor: color.blue50 },
  pendingChip: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: PENDING_BORDER },
  doneInk: { color: color.blue800 },
  pendingInk: { color: color.inkSoft },
  movement: { gap: space.xs + 2, marginTop: space.xs },
  bar: { height: 10, borderRadius: radius.pill, backgroundColor: TRACK, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: color.blue500 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
