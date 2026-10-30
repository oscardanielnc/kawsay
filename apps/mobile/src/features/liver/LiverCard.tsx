import type { Tone } from '@kawsay/core/shared/tone';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Pill, type PillTone } from '@/components/data-display/Pill';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import type { LiverTile, LiverWeek } from './types';
import { formatDuration, formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { LabResult } from './labs-db';

const PILL: Record<Tone, PillTone> = { green: 'in', yellow: 'near', red: 'far' };
const DOT: Record<Tone, string> = {
  green: color.blue500,
  yellow: '#E9A93B',
  red: '#E8705F',
};
const BAR: Record<Tone, string> = {
  green: color.blue300,
  yellow: color.amber300,
  red: color.coral300,
};
const BAR_HEIGHT = 72;

interface Props {
  week: LiverWeek;
  onAddLab: (lab: Omit<LabResult, 'id'>) => void;
  /** Day the lab form proposes. */
  today: string;
}

/**
 * The Liver card (F25, Analysis.dc.html): sugar first in its peach block, then six tiles, FIB-4 and the footer.
 * Everything from logged data on the phone; it never diagnoses.
 */
export function LiverCard({ week, onAddLab, today }: Props) {
  const { t } = useTranslation();
  const [lab, setLab] = useState<{ ast: string; alt: string; platelets: string } | null>(null);
  const sugar = week.sugar;
  const tallest = Math.max(sugar.maxG * 1.2, ...sugar.days.map((d) => d.grams), 1);
  const weekday = (date: string) =>
    new Date(`${date}T12:00:00Z`)
      .toLocaleDateString('es-PE', { weekday: 'short', timeZone: 'UTC' })
      .slice(0, 1)
      .toUpperCase();
  type TileKey = 'movement' | 'strength' | 'alcohol' | 'sleep' | 'waist' | 'weight';
  const tile = (key: TileKey, data: LiverTile, value: string, target: string) => (
    <View key={key} style={styles.tile}>
      <View style={styles.tileHead}>
        <Text style={[type.label, styles.soft, styles.grow]}>{t(`liver.tiles.${key}`)}</Text>
        <View
          accessibilityLabel={data.zone ? t(`liver.zones.${data.zone}`) : t('liver.noData')}
          style={[styles.dot, { backgroundColor: data.zone ? DOT[data.zone] : color.noData }]}
        />
      </View>
      <Text style={[type.heading, data.value === null ? styles.muted : styles.ink]}>
        {data.value === null ? t('liver.noData') : value}
      </Text>
      <Text style={[type.caption, styles.soft]}>{target}</Text>
    </View>
  );
  const values = Object.values(lab ?? {}).map(Number);
  const labValid = lab !== null && values.every((v) => v > 0);
  return (
    <Card
      title={t('liver.title')}
      action={
        <Pill
          tone={week.inRange >= 5 ? 'in' : 'near'}
          text={t('liver.inRange', { n: week.inRange })}
        />
      }
    >
      <Text style={[type.label, styles.soft]}>{t('liver.subtitle')}</Text>
      <View style={styles.sugar}>
        <View style={styles.row}>
          <Text style={[type.section, styles.peach, styles.grow]}>{t('liver.sugarTitle')}</Text>
          <Pill tone={PILL[sugar.zone]} text={t(`liver.zones.${sugar.zone}`)} />
        </View>
        <View style={styles.baseline}>
          <Text style={[type.number, styles.ink]}>{`${formatNumber(sugar.averageG)} g`}</Text>
          <Text style={[type.label, styles.soft]}>
            {t('liver.sugarTarget', {
              ideal: formatNumber(sugar.idealG),
              max: formatNumber(sugar.maxG),
            })}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={t('liver.sugarBars', {
            days: sugar.days.map((d) => formatNumber(d.grams)).join(', '),
          })}
          style={styles.bars}
        >
          <View style={[styles.limit, { bottom: 18 + (sugar.idealG / tallest) * BAR_HEIGHT }]} />
          {sugar.days.map((d, i) => (
            <View key={sugar.dates[i]} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (d.grams / tallest) * BAR_HEIGHT),
                    backgroundColor: BAR[d.zone],
                  },
                ]}
              />
              <Text style={[type.caption, styles.soft]}>{weekday(sugar.dates[i]!)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chips}>
          <Pill
            tone={PILL[week.sugaryDrinks.zone]}
            text={t('liver.sugaryDrinks', { count: week.sugaryDrinks.count })}
          />
          {sugar.topDay !== null ? (
            <Pill
              tone="peach"
              text={t('liver.topDay', {
                day: new Date(`${sugar.dates[sugar.topDay]}T12:00:00Z`).toLocaleDateString(
                  'es-PE',
                  {
                    weekday: 'long',
                    timeZone: 'UTC',
                  },
                ),
                grams: formatNumber(sugar.days[sugar.topDay]!.grams),
              })}
            />
          ) : null}
        </View>
        <Text style={[type.label, styles.soft]}>{t('liver.sugarWhy')}</Text>
      </View>
      <View style={styles.tiles}>
        {tile(
          'movement',
          week.movement,
          `${formatNumber(week.movement.value ?? 0)} min`,
          t('liver.targets.movement'),
        )}
        {tile(
          'strength',
          week.strengthDays,
          t('liver.days', { n: week.strengthDays.value ?? 0 }),
          t('liver.targets.strength'),
        )}
        {tile(
          'alcohol',
          week.alcohol,
          `${formatNumber(week.alcohol.value ?? 0)} g`,
          week.alcohol.unknown
            ? t('liver.alcoholUnknown', { n: week.alcohol.unknown })
            : t('liver.targets.alcohol'),
        )}
        {tile('sleep', week.sleep, formatDuration(week.sleep.value ?? 0), t('liver.targets.sleep'))}
        {tile(
          'waist',
          week.waistRatio,
          formatNumber(week.waistRatio.value ?? 0, 2),
          t('liver.targets.waist'),
        )}
        {tile(
          'weight',
          week.weightChange,
          `${(week.weightChange.value ?? 0) > 0 ? '+' : ''}${formatNumber(week.weightChange.value ?? 0, 1)} kg`,
          t('liver.targets.weight'),
        )}
      </View>
      <View style={styles.fib}>
        <View style={styles.grow}>
          <Text style={[type.heading, styles.ink]}>{t('liver.fib4')}</Text>
          <Text style={[type.caption, styles.soft]}>
            {week.fib4
              ? t(`liver.fib4Bands.${week.fib4.band}`, { value: formatNumber(week.fib4.value, 2) })
              : t('liver.fib4Missing')}
          </Text>
        </View>
        <Button
          variant="secondary"
          label={t('liver.addLab')}
          onPress={() => setLab({ ast: '', alt: '', platelets: '' })}
        />
      </View>
      <Text style={[type.caption, styles.muted]}>{t('liver.footer')}</Text>
      <Sheet
        title={lab ? t('liver.labTitle') : null}
        onDone={() => setLab(null)}
        footer={
          <Button
            label={t('liver.labSave')}
            disabled={!labValid}
            onPress={() => {
              if (!lab) return;
              onAddLab({
                date: today,
                ast: Number(lab.ast),
                alt: Number(lab.alt),
                platelets: Number(lab.platelets),
              });
              setLab(null);
            }}
          />
        }
      >
        <Text style={[type.caption, styles.soft]}>{t('liver.labHint')}</Text>
        {(['ast', 'alt', 'platelets'] as const).map((field) => (
          <TextInput
            key={field}
            accessibilityLabel={t(`liver.lab.${field}`)}
            placeholder={t(`liver.lab.${field}`)}
            placeholderTextColor={color.inkMuted}
            keyboardType="decimal-pad"
            value={lab?.[field] ?? ''}
            onChangeText={(text) =>
              setLab((current) =>
                current ? { ...current, [field]: text.replace(',', '.') } : current,
              )
            }
            style={[type.body, styles.input]}
          />
        ))}
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  sugar: {
    gap: space.sm + 2,
    padding: space.md + 2,
    borderRadius: radius.inner + 2,
    backgroundColor: '#FFF8F1',
    borderWidth: 1,
    borderColor: '#FBE3CF',
  },
  bars: {
    height: BAR_HEIGHT + 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
  },
  limit: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderTopColor: color.blue300,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '100%', borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 4,
    padding: space.md,
    borderRadius: radius.inner,
    backgroundColor: color.surface2,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  fib: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B9C8DC',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
    color: color.ink,
  },
  ink: { color: color.ink },
  soft: { color: color.inkSoft },
  muted: { color: color.inkMuted },
  peach: { color: color.peach800 },
});
