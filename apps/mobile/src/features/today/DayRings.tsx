import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { color, space, type } from '@/lib/theme';
import { AREAS, type Area } from './day-logged';

/** Colours of the six parts (Today v3 prototype). */
const AREA_COLOR: Record<Area, string> = {
  meals: '#E08A4F',
  activity: '#3E8A55',
  water: '#5B8DB8',
  body: '#C9A227',
  sleep: '#3D4C8C',
  weight: '#6B5E55',
};
const PENDING = '#ECE7DB';
const SIZE = 150;
const OUTER = 66;
const INNER = 48;

interface Props {
  areas: Record<Area, boolean>;
  done: number;
  movementMinutes: number;
  movementGoalMin: number;
}

/** Signature S2: the outer ring is "day logged" in six parts; the inner ring is movement minutes vs the goal. */
export function DayRings({ areas, done, movementMinutes, movementGoalMin }: Props) {
  const { t } = useTranslation();
  const outer = 2 * Math.PI * OUTER;
  const segment = outer / AREAS.length - 6;
  const inner = 2 * Math.PI * INNER;
  const share = Math.min(movementMinutes / movementGoalMin, 1);
  return (
    <View style={styles.row}>
      <View
        accessible
        accessibilityLabel={t('rings.label', {
          done,
          minutes: movementMinutes,
          goal: movementGoalMin,
        })}
        style={styles.ring}
      >
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {AREAS.map((area, i) => (
            <Circle
              key={area}
              cx={75}
              cy={75}
              r={OUTER}
              fill="none"
              stroke={areas[area] ? AREA_COLOR[area] : PENDING}
              strokeWidth={12}
              strokeDasharray={`${segment} ${outer - segment}`}
              strokeDashoffset={-i * (outer / AREAS.length)}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
            />
          ))}
          <Circle cx={75} cy={75} r={INNER} fill="none" stroke="#E3EFE6" strokeWidth={10} />
          {movementMinutes > 0 ? (
            <Circle
              cx={75}
              cy={75}
              r={INNER}
              fill="none"
              stroke={color.accent}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${share * inner} ${inner}`}
              transform="rotate(-90 75 75)"
            />
          ) : null}
        </Svg>
        <View style={styles.center}>
          <Text style={[type.display, styles.ink]}>{`${done}/6`}</Text>
          <Text style={[type.caption, styles.muted]}>{t('rings.logged')}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {AREAS.map((area) => (
          <View key={area} style={styles.item}>
            <View
              style={[
                styles.dot,
                {
                  borderColor: AREA_COLOR[area],
                  backgroundColor: areas[area] ? AREA_COLOR[area] : PENDING,
                },
              ]}
            />
            <Text style={[type.label, styles.ink]}>
              {areas[area] ? `${t(`rings.areas.${area}`)} ✓` : t(`rings.areas.${area}`)}
            </Text>
          </View>
        ))}
        <View style={styles.item}>
          <View
            style={[styles.dot, { backgroundColor: color.accent, borderColor: color.accent }]}
          />
          <Text style={[type.label, styles.ink]}>{t('rings.movement')}</Text>
        </View>
        <Text style={[type.caption, styles.muted]}>
          {t('rings.minutes', { minutes: movementMinutes, goal: movementGoalMin })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  ring: { width: SIZE, height: SIZE },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
