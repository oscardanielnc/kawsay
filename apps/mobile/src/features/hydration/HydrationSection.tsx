import { drunkGlasses, GLASS_ML } from '@kawsay/core/day/drinks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Sheet } from '@/components/feedback/Sheet';
import { Segmented } from '@/components/forms/Segmented';
import { Toggle } from '@/components/forms/Toggle';
import { Card } from '@/components/layout/Card';
import { formatNumber } from '@/lib/format';
import { color, radius, space, touch, type } from '@/lib/theme';
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
const KIND_COLOR: Record<DrinkKind, string> = {
  water: '#5B8DB8',
  'zero-calorie': '#8A5A2B',
  alcohol: '#C46A9A',
};
const URINE = [
  { value: 'clear', bg: '#FFF6C8' },
  { value: 'yellow', bg: '#F6D55C' },
  { value: 'dark', bg: '#C98A1B' },
] as const;

function Glass({ fill, dashed }: { fill: string | null; dashed?: boolean }) {
  return (
    <Svg width={26} height={32} viewBox="0 0 24 24">
      <Path
        d="M6 3h12l-1.5 17h-9z"
        fill={fill ?? 'none'}
        stroke={fill ?? color.inkMuted}
        strokeWidth={1.8}
        strokeDasharray={dashed ? '3 2' : undefined}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Hydration (F10): glasses by drink type, caloric drinks through meals, urine colour and the sweat switch. */
export function HydrationSection(props: Props) {
  const { drinks, fromMeals, goalGlasses, sweated, urine, caloricDrinks } = props;
  const { t } = useTranslation();
  const [kind, setKind] = useState<DrinkKind>('water');
  const [caloric, setCaloric] = useState(false);
  const glasses = drunkGlasses([
    ...drinks.map((d) => ({ ml: d.volumeMl, alcohol: d.kind === 'alcohol' })),
    ...fromMeals.map((d) => ({ ml: d.volumeMl, alcohol: false })),
  ]);
  const kindName = (k: DrinkKind) => t(`hydration.kinds.${k}`);

  return (
    <Card title={t('hydration.title')}>
      <Text style={[type.heading, styles.ink]}>
        {t('hydration.progress', {
          glasses: formatNumber(glasses, glasses % 1 ? 1 : 0),
          goal: goalGlasses,
        })}
      </Text>
      <Segmented
        options={KINDS.map((k) => ({ value: k, label: kindName(k) }))}
        value={kind}
        onChange={setKind}
      />
      <View style={styles.glasses}>
        {drinks.map((d) => (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            accessibilityLabel={t(
              d.kind === 'alcohol' ? 'hydration.removeAlcohol' : 'hydration.remove',
              {
                kind: kindName(d.kind),
              },
            )}
            onPress={() => props.onDelete(d.id)}
            style={styles.glass}
          >
            <Glass fill={KIND_COLOR[d.kind]} />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('hydration.add', { kind: kindName(kind) })}
          onPress={() => props.onAdd(kind)}
          style={styles.glass}
        >
          <Glass fill={null} dashed />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCaloric(true)}
          style={styles.caloric}
        >
          <Text style={[type.label, styles.accent]}>{t('hydration.caloric')}</Text>
        </Pressable>
      </View>
      {fromMeals.map((d, i) => (
        <Text key={`${d.name}-${i}`} style={[type.caption, styles.muted]}>
          {t('hydration.fromMeal', {
            name: d.name,
            meal: d.from,
            glasses: formatNumber(d.volumeMl / GLASS_ML, (d.volumeMl / GLASS_ML) % 1 ? 1 : 0),
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
  glasses: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
  glass: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
  caloric: { minHeight: touch, justifyContent: 'center', paddingHorizontal: space.sm },
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
