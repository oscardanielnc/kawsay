import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pill } from '@/components/data-display/Pill';
import { ZoneGauge } from '@/components/data-display/ZoneGauge';
import { color, radius, shadow, space, type } from '@/lib/theme';
import {
  gaugeReadings,
  type DayEaten,
  type DayTargetsShown,
  type GaugeKey,
  type GaugeReading,
} from './gauge-readings';

export type { DayEaten, DayTargetsShown } from './gauge-readings';

interface Props {
  targets: DayTargetsShown;
  eaten: DayEaten;
  /** Today is open: calories below range read grey "N left · the day goes on" (design). */
  dayOpen: boolean;
  /** Personal refined-flour limit, share of the carbohydrate target (F24); null = default. */
  refinedFlourShare?: number | null;
  /** Tapping a gauge opens its detail (F26). */
  onOpen?: (key: GaugeKey) => void;
}

/** One gauge card: name, arc with its needle, the amount, the state pill and the range under it. */
const GaugeCard = memo(function GaugeCard({
  gauge,
  onOpen,
}: {
  gauge: GaugeReading;
  onOpen?: (key: GaugeKey) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${gauge.name}: ${gauge.value} ${gauge.unit}, ${gauge.state}. ${gauge.range}`}
      onPress={onOpen && (() => onOpen(gauge.key))}
      style={styles.card}
    >
      <Text style={[type.label, styles.name]} numberOfLines={1}>
        {gauge.name}
      </Text>
      <ZoneGauge
        zones={gauge.scale.zones}
        position={gauge.position}
        overflow={gauge.overflow}
        value={gauge.value}
        unit={gauge.unit}
      />
      <View style={styles.pill}>
        <Pill tone={gauge.tone} text={gauge.state} />
      </View>
      <Text style={[type.caption, styles.range]} numberOfLines={1}>
        {gauge.range}
      </Text>
    </Pressable>
  );
});

/**
 * The day in six gauges (Amanecer, Main.dc.html): calories, protein, fat and carbohydrates two-sided around their
 * range; added sugar (F22) and refined flours (F24) one-sided under a ceiling. Blue in range, amber near, coral far.
 */
export function TodayGauges({ targets, eaten, dayOpen, refinedFlourShare = null, onOpen }: Props) {
  const { t } = useTranslation();
  const gauges = gaugeReadings({ targets, eaten, dayOpen, refinedFlourShare, t });
  return (
    <View accessibilityLabel={t('ranges.title')} style={styles.grid}>
      {gauges.map((gauge) => (
        <GaugeCard key={gauge.key} gauge={gauge} onOpen={onOpen} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingTop: space.md + 2,
    paddingBottom: space.md,
    gap: space.xs,
    alignItems: 'stretch',
    ...shadow,
  },
  name: { color: color.inkMuted, fontFamily: type.section.fontFamily },
  pill: { marginTop: space.sm + 2, alignItems: 'center' },
  range: { color: color.inkMuted, textAlign: 'center' },
});
