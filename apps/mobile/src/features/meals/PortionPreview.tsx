import { RANGE_ZONES } from '@kawsay/core/day/range-state';
import { refinedFlourLimits } from '@kawsay/core/day/refined-flour';
import { addedSugarLimits } from '@kawsay/core/day/added-sugar';
import {
  IMPACT_GAUGES,
  portionImpact,
  type GaugeAmounts,
  type ImpactGauge,
} from '@kawsay/core/day/portion-impact';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Pill } from '@/components/data-display/Pill';
import { oneSidedPosition, twoSidedPosition } from '@/components/data-display/gauge-zones';
import { ZoneGauge } from '@/components/data-display/ZoneGauge';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';

/** What the preview needs from the day: its targets, what was eaten so far and the flour limit. */
export interface DayContext {
  targets: { targetKcal: number; proteinG: number; fatG: number; carbsG: number };
  eaten: GaugeAmounts;
  refinedFlourShare: number | null;
}

const MACRO_METRIC = {
  calories: 'calories',
  protein: 'protein',
  fat: 'fat',
  carbs: 'carbs',
} as const;
const UNIT: Record<ImpactGauge, string> = {
  calories: 'kcal',
  protein: 'g',
  fat: 'g',
  carbs: 'g',
  addedSugar: 'g',
  refinedFlour: 'g',
};

/** What a portion adds, from the item's nutrients per 100 g and the grams eaten. */
export function portionAmounts(
  per100g: Record<string, number | null> | null,
  grams: number,
): GaugeAmounts {
  const of = (key: string) => ((per100g?.[key] ?? 0) * grams) / 100;
  return {
    kcal: of('energyKcal'),
    proteinG: of('proteinG'),
    fatG: of('fatG'),
    carbsG: of('carbsTotalG'),
    addedSugarG: of('addedSugarG'),
    refinedFlourG: of('refinedFlourCarbsG'),
  };
}

/**
 * Portion impact preview (F05, ADR 0020; Picker.dc.html): the six gauges small, a grey needle for the day now and
 * a dark one for "after this portion", "now → after" with the delta, a summary with the calories after and a chip
 * for every gauge that would go over, plus "too much sugar for one meal". It follows the portion as it changes.
 */
export function PortionPreview({ day, portion }: { day: DayContext; portion: GaugeAmounts }) {
  const { t } = useTranslation();
  const share = day.refinedFlourShare ?? undefined;
  const impact = portionImpact({ ...day, portion, refinedFlourShare: share });
  const sugar = addedSugarLimits(day.targets.targetKcal);
  const flour = refinedFlourLimits(day.targets.carbsG, share);
  const position = (gauge: ImpactGauge, value: number) => {
    if (gauge === 'addedSugar') return oneSidedPosition(value, sugar.greenMaxG, sugar.yellowMaxG);
    if (gauge === 'refinedFlour') return oneSidedPosition(value, flour.limitG, flour.maxG);
    const metric = MACRO_METRIC[gauge];
    const target =
      day.targets[
        ({ calories: 'targetKcal', protein: 'proteinG', fat: 'fatG', carbs: 'carbsG' } as const)[
          gauge
        ]
      ];
    return twoSidedPosition((value / target) * 100, RANGE_ZONES[metric]);
  };
  const calories = impact.gauges.calories;
  return (
    <View style={styles.wrap}>
      <View style={[styles.summary, impact.alerts.length > 0 && styles.summaryAlert]}>
        <View style={styles.row}>
          <Text style={[type.label, styles.muted]}>{t('preview.title')}</Text>
          <Text style={[type.title, styles.ink]}>
            {t('preview.delta', { kcal: formatNumber(calories.delta) })}
          </Text>
        </View>
        <Text style={[type.label, styles.ink]}>
          {t('preview.kcalAfter', {
            after: formatNumber(calories.after),
            target: formatNumber(day.targets.targetKcal),
          })}
        </Text>
        <View style={styles.chips}>
          {impact.alerts.map((gauge) => (
            <Pill
              key={gauge}
              tone={impact.gauges[gauge].overAfter === 2 ? 'far' : 'near'}
              text={t(impact.gauges[gauge].overAfter === 2 ? 'preview.veryHigh' : 'preview.over', {
                name: t(`preview.names.${gauge}`),
              })}
            />
          ))}
          {impact.sugarHeavy ? <Pill tone="peach" text={t('preview.sugarHeavy')} /> : null}
          {impact.alerts.length === 0 && !impact.sugarHeavy ? (
            <Pill tone="in" text={t('preview.allFine')} />
          ) : null}
        </View>
      </View>
      <View style={styles.grid}>
        {IMPACT_GAUGES.map((gauge) => {
          const g = impact.gauges[gauge];
          const name = t(`preview.names.${gauge}`);
          const unit = UNIT[gauge];
          const fromTo = t('preview.fromTo', {
            now: formatNumber(g.now),
            after: formatNumber(g.after),
            unit: unit === 'kcal' ? '' : ` ${unit}`,
          });
          return (
            <View key={gauge} style={styles.card}>
              <Text style={[type.caption, styles.name]} numberOfLines={1}>
                {name}
              </Text>
              <ZoneGauge
                kind={
                  gauge === 'addedSugar' || gauge === 'refinedFlour' ? 'one-sided' : 'two-sided'
                }
                position={position(gauge, g.after)}
                before={position(gauge, g.now)}
                value=""
                unit=""
                compact
                accessibilityLabel={`${name}: ${fromTo}`}
              />
              <Text style={[type.caption, styles.ink, styles.center]}>{fromTo}</Text>
              <Text style={[type.caption, styles.delta]}>
                {`+${formatNumber(g.delta)}${unit === 'kcal' ? '' : ` ${unit}`}`}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[type.caption, styles.muted, styles.center]}>{t('preview.legend')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm + 2 },
  summary: {
    gap: space.xs + 2,
    padding: space.md,
    borderRadius: radius.inner + 2,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  summaryAlert: { borderColor: color.coral300, borderWidth: 1.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  card: {
    flexBasis: '30%',
    flexGrow: 1,
    padding: space.sm,
    borderRadius: radius.inner,
    backgroundColor: color.surface2,
    alignItems: 'stretch',
    gap: 2,
  },
  name: { color: color.inkMuted, fontFamily: type.label.fontFamily },
  delta: { color: color.blue800, textAlign: 'center', fontFamily: type.label.fontFamily },
  center: { textAlign: 'center' },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
