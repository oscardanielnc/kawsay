import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, radius, space, type } from '@/lib/theme';
import { AREAS, type Area } from './day-logged';

/** Colour and icon of each part (Today v3 prototype colours). */
const AREA_LOOK: Record<Area, { tint: string; icon: string }> = {
  meals: { tint: '#E08A4F', icon: '🍽️' },
  activity: { tint: '#3E8A55', icon: '🏃' },
  water: { tint: '#5B8DB8', icon: '💧' },
  body: { tint: '#C9A227', icon: '🙂' },
  sleep: { tint: '#3D4C8C', icon: '🌙' },
  weight: { tint: '#6B5E55', icon: '⚖️' },
};
const PENDING = '#ECE7DB';

interface Props {
  areas: Record<Area, boolean>;
  done: number;
  movementMinutes: number;
  movementGoalMin: number;
  /** Jumps to the section of a part. */
  onPick: (area: Area) => void;
}

/**
 * "Your day logged" (replaces the rings, 2026-10-12): a checklist of the six parts, done ones tinted with ✓, pending
 * ones dashed and tappable, over a six-step bar; movement minutes as a progress bar against the daily goal.
 */
export function DayChecklist({ areas, done, movementMinutes, movementGoalMin, onPick }: Props) {
  const { t } = useTranslation();
  const share = Math.min(movementMinutes / movementGoalMin, 1);
  const left = Math.max(0, Math.ceil(movementGoalMin - movementMinutes));
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
          {t('rings.title')}
        </Text>
        <Text style={[type.label, styles.muted]}>{t('rings.count', { done })}</Text>
      </View>
      <View style={styles.steps}>
        {AREAS.map((area) => (
          <View
            key={area}
            style={[styles.step, { backgroundColor: areas[area] ? AREA_LOOK[area].tint : PENDING }]}
          />
        ))}
      </View>
      <View style={styles.chips}>
        {AREAS.map((area) => {
          const { tint, icon } = AREA_LOOK[area];
          const isDone = areas[area];
          const name = t(`rings.areas.${area}`);
          return (
            <Pressable
              key={area}
              accessibilityRole="button"
              accessibilityLabel={t(isDone ? 'rings.done' : 'rings.pending', { area: name })}
              onPress={() => onPick(area)}
              style={[
                styles.chip,
                isDone
                  ? { backgroundColor: `${tint}1F`, borderColor: `${tint}55` }
                  : styles.pendingChip,
              ]}
            >
              <Text importantForAccessibility="no">{icon}</Text>
              <Text
                style={[type.label, isDone ? styles.ink : styles.muted, styles.grow]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text style={[type.label, { color: isDone ? tint : color.accent }]}>
                {isDone ? '✓' : '›'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.movement}>
        <View style={styles.row}>
          <Text style={[type.label, styles.ink]}>{`🏃 ${t('rings.movement')}`}</Text>
          <Text style={[type.label, styles.muted]}>
            <Text style={styles.minutes}>{movementMinutes}</Text>
            {` / ${movementGoalMin} min`}
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
        <Text style={[type.caption, left === 0 ? styles.success : styles.muted]}>
          {left === 0 ? t('rings.movementDone') : t('rings.movementLeft', { minutes: left })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card + 2,
    padding: space.lg,
    gap: space.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  steps: { flexDirection: 'row', gap: space.xs },
  step: { flex: 1, height: 6, borderRadius: radius.pill },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm - 2 },
  chip: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm - 2,
    minHeight: 44,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.chip + 2,
    borderWidth: 1.5,
  },
  pendingChip: { borderStyle: 'dashed', borderColor: '#D5CFC0', backgroundColor: color.surface },
  grow: { flex: 1 },
  movement: {
    marginTop: space.xs,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.line,
    gap: space.xs,
  },
  minutes: { fontFamily: font.title, fontSize: 18, color: color.ink },
  bar: { height: 10, borderRadius: radius.pill, backgroundColor: '#F1ECE1', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: color.accent },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  success: { color: color.successText },
});
