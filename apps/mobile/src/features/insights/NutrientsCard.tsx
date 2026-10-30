import type { NutrientRow, weeklyNutrients } from '@kawsay/core/insights/weekly-nutrients';
import type { WeeklyNutrient } from '@kawsay/core/nutrition/references';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import type { FoodPick } from './types';
import { formatNumber } from '@/lib/format';
import { color, font, radius, space, type } from '@/lib/theme';

const UNIT: Record<WeeklyNutrient, string> = {
  fiberG: 'g',
  ironMg: 'mg',
  zincMg: 'mg',
  calciumMg: 'mg',
  potassiumMg: 'mg',
  vitaminARaeUg: 'µg',
  vitaminCMg: 'mg',
  thiaminMg: 'mg',
  riboflavinMg: 'mg',
  niacinMg: 'mg',
  folateUg: 'µg',
  vitaminB12Ug: 'µg',
  sodiumMg: 'mg',
};
const LOOK = {
  green: { bar: color.blue300, pill: color.blue50, ink: color.blue800 },
  yellow: { bar: color.amber300, pill: color.amber50, ink: color.amber800 },
  red: { bar: color.coral300, pill: color.coral50, ink: color.coral800 },
  incomplete: { bar: color.line, pill: color.surface2, ink: color.inkMuted },
} as const;
/** Nutrients with a known caveat about their source data (F19). */
const CAVEATS = ['vitaminARaeUg', 'folateUg', 'ironMg'] as const;
const isCaveat = (key: WeeklyNutrient): key is (typeof CAVEATS)[number] =>
  (CAVEATS as readonly string[]).includes(key);
/** Bars span 0–150% of the reference, with a tick at 100%. */
const BAR_MAX = 150;

const amount = (value: number) =>
  formatNumber(value, value < 10 && !Number.isInteger(value) ? 1 : 0);
const share = (value: number) => `${formatNumber(value * 100)} %`;

interface Props {
  nutrients: ReturnType<typeof weeklyNutrients> | null;
  sources: Partial<Record<WeeklyNutrient, FoodPick[]>>;
  richest: Partial<Record<WeeklyNutrient, FoodPick[]>>;
}

/** "Vitamins, minerals and fibre" (F19): reds first, a 0–150% bar each; tap → sources and richest foods. */
export function NutrientsCard({ nutrients, sources, richest }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<NutrientRow | null>(null);
  const name = (key: WeeklyNutrient) => t(`insights.nutrients.names.${key}`);
  const isLimit = (key: WeeklyNutrient) => key === 'sodiumMg';
  const values = (row: NutrientRow) => ({
    intake: amount(row.intake),
    reference: amount(row.reference),
    unit: UNIT[row.key],
  });

  let body;
  if (!nutrients)
    body = <Text style={[type.body, styles.muted]}>{t('insights.nutrients.noProfile')}</Text>;
  else if (nutrients.status === 'need-days')
    body = (
      <Text style={[type.body, styles.muted]}>
        {t('insights.nutrients.needDays', { count: nutrients.countedDays })}
      </Text>
    );
  else
    body = nutrients.rows.map((row) => {
      const look = LOOK[row.tone];
      const incomplete = row.tone === 'incomplete';
      const badge = incomplete
        ? t('insights.nutrients.incomplete')
        : isLimit(row.key)
          ? `${amount(row.intake)} ${UNIT[row.key]}`
          : `${formatNumber(row.percent)} %`;
      return (
        <Pressable
          key={row.key}
          accessibilityRole="button"
          accessibilityLabel={`${name(row.key)}: ${badge}`}
          onPress={() => setOpen(row)}
          style={styles.row}
        >
          <View style={styles.top}>
            <Text style={[type.label, styles.ink, styles.grow]}>{name(row.key)}</Text>
            <View style={[styles.pill, { backgroundColor: look.pill }]}>
              <Text style={[type.caption, styles.bold, { color: look.ink }]}>{badge}</Text>
            </View>
          </View>
          <Text style={[type.caption, styles.muted]}>
            {incomplete
              ? t('insights.nutrients.incompleteHint', { coverage: share(row.coverage) })
              : t(
                  isLimit(row.key) ? 'insights.nutrients.limit' : 'insights.nutrients.of',
                  values(row),
                )}
          </Text>
          <View style={styles.track}>
            {incomplete ? null : (
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(BAR_MAX, row.percent) / (BAR_MAX / 100)}%`,
                    backgroundColor: look.bar,
                  },
                ]}
              />
            )}
            <View style={styles.tick} />
          </View>
        </Pressable>
      );
    });

  return (
    <Card>
      <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
        {t('insights.nutrients.title')}
      </Text>
      {body}
      <Text style={[type.caption, styles.muted]}>{t('insights.nutrients.disclaimer')}</Text>
      <Sheet title={open ? name(open.key) : null} onDone={() => setOpen(null)}>
        {open ? (
          <>
            <Text style={[styles.big, { color: LOOK[open.tone].ink }]}>
              {isLimit(open.key)
                ? `${amount(open.intake)} ${UNIT[open.key]}`
                : `${formatNumber(open.percent)} %`}
            </Text>
            <Text style={[type.body, styles.ink]}>
              {t(
                isLimit(open.key)
                  ? 'insights.nutrients.averageLimit'
                  : 'insights.nutrients.average',
                values(open),
              )}
            </Text>
            <Text style={[type.caption, styles.muted]}>
              {t('insights.nutrients.coverage', { coverage: share(open.coverage) })}
            </Text>
            <Picks
              title={t('insights.nutrients.sources')}
              picks={sources[open.key] ?? []}
              unit={UNIT[open.key]}
            />
            {richest[open.key]?.length ? (
              <Picks
                title={t('insights.nutrients.richest')}
                picks={richest[open.key] ?? []}
                unit={UNIT[open.key]}
              />
            ) : null}
            {isCaveat(open.key) ? (
              <Text style={[type.caption, styles.muted]}>
                {`ⓘ ${t(`insights.nutrients.caveats.${open.key}`)}`}
              </Text>
            ) : null}
            <Text style={[type.caption, styles.muted]}>{t('insights.nutrients.disclaimer')}</Text>
          </>
        ) : null}
      </Sheet>
    </Card>
  );
}

function Picks({
  title,
  picks,
  unit,
}: {
  title: string;
  picks: readonly FoodPick[];
  unit: string;
}) {
  const { t } = useTranslation();
  if (picks.length === 0) return null;
  return (
    <View style={styles.picks}>
      <Text style={[type.label, styles.ink]}>{title}</Text>
      {picks.map((p) => (
        <View key={p.name} style={styles.pick}>
          <Text style={[type.body, styles.ink, styles.grow]} numberOfLines={1}>
            {p.portion ? `${p.name} · ${p.portion}` : p.name}
          </Text>
          {p.eaten ? (
            <View style={[styles.pill, { backgroundColor: color.blue50 }]}>
              <Text style={[type.caption, { color: color.blue800 }]}>
                {t('insights.nutrients.eaten')}
              </Text>
            </View>
          ) : null}
          <Text style={[type.label, styles.muted]}>{`${amount(p.amount)} ${unit}`}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 2, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: color.line },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  pill: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill },
  bold: { fontFamily: font.label },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    marginTop: space.xs,
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.pill },
  tick: {
    position: 'absolute',
    left: `${(100 / BAR_MAX) * 100}%`,
    top: -3,
    bottom: -3,
    width: 2,
    backgroundColor: color.ink,
    opacity: 0.35,
  },
  big: { fontFamily: font.title, fontSize: 36, lineHeight: 40 },
  picks: { gap: space.xs, marginTop: space.sm },
  pick: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
