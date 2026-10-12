import { drunkGlasses, GLASS_ML } from '@kawsay/core/day/drinks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';
import { Sheet } from '@/components/feedback/Sheet';
import { Toggle } from '@/components/forms/Toggle';
import { Card } from '@/components/layout/Card';
import { formatNumber } from '@/lib/format';
import { color, radius, space, touch, type } from '@/lib/theme';
import { bucketLayers, type BucketGlasses, type BucketKind } from './bucket';
import type { Drink, DrinkKind } from './hydration-db';

/** A caloric drink from the catalog; tapping it logs it in the current meal (F10 ↔ F05). */
export interface CaloricDrink {
  kind: 'dish' | 'food';
  id: string;
  name: string;
}

interface Props {
  drinks: readonly Drink[];
  /** Caloric drinks logged in meals: one entry, two views. `from` is the meal's name. */
  fromMeals: readonly { name: string; from: string; volumeMl: number }[];
  goalGlasses: number;
  sweated: boolean;
  urine: string | null;
  caloricDrinks: readonly CaloricDrink[];
  onAdd: (kind: DrinkKind) => void;
  onDelete: (id: string) => void;
  onAddCaloric: (drink: CaloricDrink) => void;
  onUrine: (value: string) => void;
  onSweated: (on: boolean) => void;
}

const KINDS: readonly DrinkKind[] = ['water', 'zero-calorie', 'alcohol'];
const BUCKET_KINDS: readonly BucketKind[] = ['water', 'zero-calorie', 'alcohol', 'caloric'];
/** Water blue, coffee brown, wine for alcohol, juice orange for every caloric drink. */
const KIND_COLOR: Record<BucketKind, string> = {
  water: '#4FA3D9',
  'zero-calorie': '#7A4A26',
  alcohol: '#9B2D4F',
  caloric: '#F0A23B',
};
const URINE = [
  { value: 'clear', bg: '#FFF6C8' },
  { value: 'yellow', bg: '#F6D55C' },
  { value: 'dark', bg: '#C98A1B' },
] as const;

const asGlasses = (ml: number) => ml / GLASS_ML;
const glassText = (n: number) => formatNumber(n, n % 1 ? 1 : 0);

/** Pail outline in a 100 × 112 box: open top at y 28, curved bottom down to y 108. */
const BODY = 'M8 28 L92 28 L82 101 Q50 112 18 101 Z';
const TOP = 28;
const BOTTOM = 108;
/** Two pressed rings around the pail, as on a metal bucket. */
const RINGS = [52, 80];

/** The day's drinks as layers in a bucket sized to the goal; full and proportional once the goal is passed. */
function Bucket({ glasses, goalGlasses }: { glasses: BucketGlasses; goalGlasses: number }) {
  const { capacity, layers } = bucketLayers(glasses, goalGlasses);
  const y = (share: number) => BOTTOM - share * (BOTTOM - TOP);
  const marks = Math.ceil(capacity);
  const ticks = marks <= 24 ? Array.from({ length: marks - 1 }, (_, i) => (i + 1) / capacity) : [];
  const surface = layers.at(-1);
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 112">
      <Defs>
        <ClipPath id="bucket-body">
          <Path d={BODY} />
        </ClipPath>
      </Defs>
      <Path d="M12 34 Q50 -12 88 34" fill="none" stroke={color.inkMuted} strokeWidth={3} />
      <Rect x={5} y={30} width={7} height={9} rx={2} fill={color.inkMuted} />
      <Rect x={88} y={30} width={7} height={9} rx={2} fill={color.inkMuted} />
      <Path d={BODY} fill={color.surface} />
      <G clipPath="url(#bucket-body)">
        {layers.map((layer) => (
          <Rect
            key={layer.kind}
            x={0}
            y={y(layer.to)}
            width={100}
            height={y(layer.from) - y(layer.to)}
            fill={KIND_COLOR[layer.kind]}
          />
        ))}
        {surface ? (
          <Rect
            x={0}
            y={y(surface.to)}
            width={100}
            height={2}
            fill={color.onDark}
            opacity={0.45}
          />
        ) : null}
        {RINGS.map((ring) => (
          <Line
            key={ring}
            x1={0}
            x2={100}
            y1={ring}
            y2={ring}
            stroke={color.ink}
            strokeOpacity={0.12}
            strokeWidth={3}
          />
        ))}
        {ticks.map((share) => (
          <Line
            key={share}
            x1={74}
            x2={92}
            y1={y(share)}
            y2={y(share)}
            stroke={color.ink}
            strokeOpacity={0.2}
            strokeWidth={1}
          />
        ))}
      </G>
      <Path d={BODY} fill="none" stroke={color.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={4} y={24} width={92} height={7} rx={3.5} fill={color.ink} />
    </Svg>
  );
}

/**
 * Hydration (F10): a bucket of the day's goal on the left, filled bottom-up with caloric drinks, alcohol, coffee or
 * tea and water; − / + per drink on the right. Then urine colour and the sweat switch.
 */
export function HydrationSection(props: Props) {
  const { drinks, fromMeals, goalGlasses, sweated, urine, caloricDrinks } = props;
  const { t } = useTranslation();
  const [caloric, setCaloric] = useState(false);
  const glasses = drunkGlasses([
    ...drinks.map((d) => ({ ml: d.volumeMl, alcohol: d.kind === 'alcohol' })),
    ...fromMeals.map((d) => ({ ml: d.volumeMl, alcohol: false })),
  ]);
  const kindName = (k: BucketKind) => t(`hydration.kinds.${k}`);
  const sumOf = (k: DrinkKind) =>
    asGlasses(drinks.filter((d) => d.kind === k).reduce((ml, d) => ml + d.volumeMl, 0));
  const byKind: BucketGlasses = {
    water: sumOf('water'),
    'zero-calorie': sumOf('zero-calorie'),
    alcohol: sumOf('alcohol'),
    caloric: asGlasses(fromMeals.reduce((ml, d) => ml + d.volumeMl, 0)),
  };
  const contents = BUCKET_KINDS.map((k) =>
    [kindName(k), glassText(byKind[k]), k === 'alcohol' ? t('hydration.notCounted') : null]
      .filter(Boolean)
      .join(' '),
  ).join(', ');

  return (
    <Card title={t('hydration.title')}>
      <Text style={[type.heading, styles.ink]}>
        {t('hydration.progress', { glasses: glassText(glasses), goal: goalGlasses })}
      </Text>
      <View style={styles.split}>
        <View
          accessible
          accessibilityLabel={t('hydration.bucket', { goal: goalGlasses, contents })}
          style={styles.bucket}
        >
          <Bucket glasses={byKind} goalGlasses={goalGlasses} />
        </View>
        <View style={styles.controls}>
          {KINDS.map((k) => {
            const ofKind = drinks.filter((d) => d.kind === k);
            const last = ofKind.at(-1);
            return (
              <View key={k} style={styles.control}>
                <View style={[styles.dot, { backgroundColor: KIND_COLOR[k] }]} />
                <Text style={[type.label, styles.ink, styles.grow]} numberOfLines={1}>
                  {kindName(k)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('hydration.remove', { kind: kindName(k) })}
                  accessibilityState={{ disabled: !last }}
                  disabled={!last}
                  onPress={() => last && props.onDelete(last.id)}
                  style={[styles.step, !last && styles.off]}
                >
                  <Text style={[type.heading, styles.ink]}>−</Text>
                </Pressable>
                <Text style={[type.heading, styles.ink, styles.count]}>{ofKind.length}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('hydration.add', { kind: kindName(k) })}
                  onPress={() => props.onAdd(k)}
                  style={[styles.step, { borderColor: KIND_COLOR[k] }]}
                >
                  <Text style={[type.heading, { color: KIND_COLOR[k] }]}>+</Text>
                </Pressable>
              </View>
            );
          })}
          <View style={styles.control}>
            <View style={[styles.dot, { backgroundColor: KIND_COLOR.caloric }]} />
            <Text style={[type.label, styles.ink, styles.grow]} numberOfLines={1}>
              {kindName('caloric')}
            </Text>
            <Text style={[type.heading, styles.ink, styles.count]}>
              {glassText(byKind.caloric)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('hydration.addCaloric')}
              onPress={() => setCaloric(true)}
              style={[styles.step, { borderColor: KIND_COLOR.caloric }]}
            >
              <Text style={[type.heading, styles.accent]}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {fromMeals.map((d, i) => (
        <Text key={`${d.name}-${i}`} style={[type.caption, styles.muted]}>
          {t('hydration.fromMeal', {
            name: d.name,
            meal: d.from,
            glasses: glassText(asGlasses(d.volumeMl)),
          })}
        </Text>
      ))}
      <Text style={[type.heading, styles.ink]}>{t('hydration.urine')}</Text>
      <View style={styles.urine}>
        {URINE.map(({ value, bg }) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: urine === value }}
            onPress={() => props.onUrine(value)}
            style={[
              styles.urineOption,
              { backgroundColor: bg },
              urine === value && styles.selected,
            ]}
          >
            <Text style={[type.label, styles.ink]}>{t(`hydration.urineValues.${value}`)}</Text>
          </Pressable>
        ))}
      </View>
      <Toggle
        label={t('hydration.sweated')}
        description={t('hydration.sweatedHint')}
        value={sweated}
        onChange={props.onSweated}
      />
      <Text style={[type.caption, styles.muted]}>{t('hydration.note')}</Text>
      <Sheet title={caloric ? t('hydration.caloricTitle') : null} onDone={() => setCaloric(false)}>
        <Text style={[type.caption, styles.muted]}>{t('hydration.caloricHint')}</Text>
        {caloricDrinks.map((d) => (
          <Pressable
            key={`${d.kind}:${d.id}`}
            accessibilityRole="button"
            onPress={() => {
              props.onAddCaloric(d);
              setCaloric(false);
            }}
            style={styles.row}
          >
            <Text style={[type.heading, styles.ink]}>{d.name}</Text>
          </Pressable>
        ))}
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  split: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bucket: { width: '32%', aspectRatio: 100 / 112 },
  controls: { flex: 1, gap: space.xs },
  control: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: touch },
  dot: { width: 12, height: 12, borderRadius: radius.pill },
  grow: { flex: 1 },
  step: {
    width: touch - 4,
    height: touch - 4,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
  },
  off: { opacity: 0.35 },
  count: { minWidth: 28, textAlign: 'center' },
  urine: { flexDirection: 'row', gap: space.sm },
  urineOption: {
    flex: 1,
    minHeight: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: color.ink },
  row: {
    minHeight: touch,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  accent: { color: color.accent },
});
