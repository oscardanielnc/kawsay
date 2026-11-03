import { contributions, type ContributionEntry } from '@kawsay/core/day/contributions';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigGauge } from '@/components/data-display/BigGauge';
import { FoodIcon } from '@/components/data-display/FoodIcon';
import { Pill } from '@/components/data-display/Pill';
import { ZONE_COLOR } from '@/components/data-display/gauge-zones';
import { Sheet } from '@/components/feedback/Sheet';
import { formatNumber } from '@/lib/format';
import { fractionLabel } from '@/lib/portion';
import { color, radius, space, type } from '@/lib/theme';
import {
  gaugeReadings,
  GAUGE_KEYS,
  type DayEaten,
  type DayTargetsShown,
  type GaugeKey,
} from './gauge-readings';

type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface Props {
  /** The gauge shown; null hides the sheet. */
  open: GaugeKey | null;
  onSwitch: (key: GaugeKey) => void;
  onClose: () => void;
  targets: DayTargetsShown;
  eaten: DayEaten;
  dayOpen: boolean;
  refinedFlourShare: number | null;
  /** The day's meal entries, with what each adds to every gauge. */
  entries: readonly ContributionEntry[];
  /** The day's meals in order, to name where a food was eaten ("Almuerzo y cena"). */
  mealOrder: readonly Meal[];
  /** Pending entries (F23): logged by name, not counted yet. */
  pending: readonly { name: string }[];
  /** Sugary drinks of the week ending on this day (F22); null while loading. */
  sugaryDrinksWeek: number | null;
  onCompletePending: () => void;
}

/** Up to one decimal under 10, so "8.5 g" of sugar does not read as "9 g". */
const amountText = (value: number) => formatNumber(value, value < 10 && value % 1 !== 0 ? 1 : 0);

/**
 * Gauge detail (F26): the gauge large with every limit labelled, the value and its state, and what added to it,
 * largest first. Chips switch the metric without closing. Numbers come from the catalog, on the phone (ADR 0008).
 */
export function GaugeDetailSheet({
  open,
  onSwitch,
  onClose,
  targets,
  eaten,
  dayOpen,
  refinedFlourShare,
  entries,
  mealOrder,
  pending,
  sugaryDrinksWeek,
  onCompletePending,
}: Props) {
  const { t } = useTranslation();
  const readings = gaugeReadings({ targets, eaten, dayOpen, refinedFlourShare, t });
  const reading = readings.find((r) => r.key === open) ?? null;
  if (!reading)
    return (
      <Sheet title={null} onDone={onClose}>
        {null}
      </Sheet>
    );

  const { rows, total, omitted } = contributions(entries, reading.metric, mealOrder);
  const mealsText = (meals: readonly string[]) => {
    const names = meals.map((m, i) => {
      const name = t(`meals.slots.${m as Meal}`);
      return i === 0 ? name : name.toLowerCase();
    });
    return names.length < 2
      ? (names[0] ?? '')
      : t('gaugeDetail.and', { first: names.slice(0, -1).join(', '), last: names.at(-1)! });
  };
  const portionText = (p: { servings: number | null; grams: number | null }) =>
    p.servings !== null
      ? t(p.servings > 1 ? 'gaugeDetail.servingMany' : 'gaugeDetail.servingOne', {
          portion: fractionLabel(p.servings),
        })
      : t('gaugeDetail.grams', { grams: formatNumber(p.grams ?? 0) });
  const unit = reading.unit;

  return (
    <Sheet title={reading.name} onDone={onClose}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {GAUGE_KEYS.map((key) => {
          const selected = key === reading.key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onSwitch(key)}
              style={[styles.chip, selected && styles.chipOn]}
            >
              <Text style={[type.label, selected ? styles.chipOnInk : styles.ink]}>
                {readings.find((r) => r.key === key)!.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <BigGauge
        scale={reading.scale}
        position={reading.position}
        accessibilityLabel={t('gaugeDetail.gauge', {
          name: reading.name,
          value: reading.value,
          unit,
          limits: reading.limits.map((l) => formatNumber(l)).join(', '),
          min: formatNumber(reading.scale.min),
          max: formatNumber(reading.scale.max),
        })}
      />
      <View style={styles.centre}>
        <View style={styles.reading}>
          <Text style={[type.number, styles.ink, styles.value]}>
            {reading.overflow ? `${reading.value}+` : reading.value}
          </Text>
          <Text style={[type.label, styles.muted]}>{unit}</Text>
        </View>
        <Pill tone={reading.tone} text={reading.state} />
        <Text style={[type.caption, styles.muted, styles.center]}>{reading.meta}</Text>
        <View style={styles.legend} importantForAccessibility="no-hide-descendants">
          {(['green', 'yellow', 'red'] as const).map((tone) => (
            <View key={tone} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: ZONE_COLOR[tone] }]} />
              <Text style={[type.caption, styles.muted]}>
                {t(
                  `gaugeDetail.legend.${({ green: 'in', yellow: 'near', red: 'far' } as const)[tone]}`,
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {reading.key === 'sugar' && sugaryDrinksWeek !== null ? (
        <Pill
          tone={sugaryDrinksWeek === 0 ? 'in' : sugaryDrinksWeek <= 2 ? 'near' : 'far'}
          text={t('gaugeDetail.sugaryDrinks', { count: sugaryDrinksWeek })}
        />
      ) : null}

      <View style={styles.listHead}>
        <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
          {t('gaugeDetail.top')}
        </Text>
        {rows.length > 0 ? (
          <Text style={[type.caption, styles.muted]}>
            {t('gaugeDetail.sub', { count: rows.length, total: amountText(total), unit })}
          </Text>
        ) : null}
      </View>
      {rows.length === 0 ? (
        <Text style={[type.body, styles.muted]}>{t('gaugeDetail.empty')}</Text>
      ) : null}
      {rows.map((row, i) => {
        const where = `${mealsText(row.meals)} · ${row.portions.map(portionText).join(' + ')}`;
        const pct = Math.round(row.share * 100);
        const amount = `${amountText(row.amount)} ${unit}`;
        return (
          <View
            key={row.id}
            accessible
            accessibilityLabel={t('gaugeDetail.row', { name: row.name, where, amount, pct })}
            style={[styles.row, i === 0 && styles.first]}
          >
            <FoodIcon icon={row.icon} size={36} />
            <View style={styles.rowText}>
              <Text style={[type.label, styles.ink]} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={[type.caption, styles.muted]} numberOfLines={1}>
                {where}
              </Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${row.share * 100}%` }]} />
              </View>
            </View>
            <View style={styles.amount}>
              <Text style={[type.label, styles.ink]}>{amount}</Text>
              <Text style={[type.caption, styles.muted]}>{`${pct} %`}</Text>
            </View>
          </View>
        );
      })}
      {omitted > 0 ? (
        <Text style={[type.caption, styles.muted]}>
          {t('gaugeDetail.omitted', { count: omitted, name: reading.name.toLowerCase() })}
        </Text>
      ) : null}
      {pending.length > 0 ? (
        <View style={styles.pending}>
          <Text style={[type.caption, styles.peach, styles.flex]}>
            {t('gaugeDetail.pending', {
              count: pending.length,
              names: pending.map((p) => p.name).join(', '),
            })}
          </Text>
          <Pressable accessibilityRole="button" onPress={onCompletePending} style={styles.complete}>
            <Text style={[type.label, styles.brand]}>{t('meals.complete')}</Text>
          </Pressable>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chips: { gap: space.xs + 2 },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: color.chip,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: color.ink },
  chipOnInk: { color: color.white },
  centre: { alignItems: 'center', gap: space.xs + 2, marginTop: -space.sm },
  reading: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  value: { fontSize: 30, lineHeight: 34 },
  legend: { flexDirection: 'row', gap: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  listHead: { gap: 2, marginTop: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingVertical: space.xs,
  },
  first: { backgroundColor: color.blue50, borderRadius: radius.inner, paddingHorizontal: space.sm },
  rowText: { flex: 1, gap: 2 },
  bar: { height: 4, borderRadius: 2, backgroundColor: color.line, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: color.blue500 },
  amount: { alignItems: 'flex-end' },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.inner,
    backgroundColor: color.peach50,
  },
  complete: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  peach: { color: color.peach800 },
  brand: { color: color.blue700 },
});
