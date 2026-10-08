import { weightTrend, type TrendPoint } from '@kawsay/core/body/weight-trend';
import { addDays, daysBetween, type LocalDate } from '@kawsay/core/shared/local-date';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Stepper } from '@/components/forms/Stepper';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, space, type } from '@/lib/theme';

interface Props {
  day: LocalDate;
  /** Weights up to `day`, oldest first. */
  weights: readonly { date: LocalDate; kg: number }[];
  onSave: (kg: number) => void;
}

const CHART_DAYS = 30;
const STEP_KG = 0.1;
/** Before the first weigh-in the stepper starts here. */
const FIRST_GUESS_KG = 70;
const W = 300;
const H = 110;
const PAD = 8;
const round1 = (kg: number) => Math.round(kg * 10) / 10;
const kg = (value: number) => `${formatNumber(value, 1)} kg`;

function TrendChart({ points, day }: { points: readonly TrendPoint[]; day: LocalDate }) {
  const { t } = useTranslation();
  const from = addDays(day, -(CHART_DAYS - 1));
  const shown = points.filter((p) => p.date >= from);
  const first = shown[0];
  const last = shown.at(-1);
  if (!first || !last) return null;
  const values = shown.flatMap((p) => [p.kg, p.trendKg]);
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const x = (date: LocalDate) => PAD + (daysBetween(from, date) / (CHART_DAYS - 1)) * (W - 2 * PAD);
  const y = (value: number) => PAD + ((max - value) / (max - min)) * (H - 2 * PAD);
  return (
    <View
      accessible
      accessibilityLabel={t('weight.chart', {
        from: formatNumber(first.trendKg, 1),
        to: kg(last.trendKg),
        days: CHART_DAYS,
      })}
    >
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {shown.map((p) => (
          <Circle key={p.date} cx={x(p.date)} cy={y(p.kg)} r={3} fill={color.noData} />
        ))}
        <Polyline
          points={shown.map((p) => `${x(p.date)},${y(p.trendKg)}`).join(' ')}
          fill="none"
          stroke={color.brand}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[type.caption, styles.muted]}>{t('weight.legend')}</Text>
    </View>
  );
}

/** Weight (F03): one per day, the measuring rule, and the raw days next to the moving trend. */
export function WeightCard({ day, weights, onSave }: Props) {
  const { t } = useTranslation();
  const points = weightTrend(weights);
  const todays = points.find((p) => p.date === day);
  const lastKg = points.at(-1)?.kg ?? FIRST_GUESS_KG;
  const [editing, setEditing] = useState<number | null>(null);
  const draft = editing ?? lastKg;
  const asking = !todays || editing !== null;

  return (
    <Card title={t('weight.title')}>
      {asking ? (
        <>
          <Stepper
            label={t('weight.today')}
            value={kg(draft)}
            onDecrement={() => setEditing(Math.max(30, round1(draft - STEP_KG)))}
            onIncrement={() => setEditing(Math.min(300, round1(draft + STEP_KG)))}
          />
          <Text style={[type.caption, styles.muted]}>{t('weight.rule')}</Text>
          <Button
            label={t('weight.save')}
            onPress={() => {
              onSave(draft);
              setEditing(null);
            }}
          />
        </>
      ) : (
        <View style={styles.row}>
          <View style={styles.grow}>
            <Text style={[type.display, styles.ink]}>{kg(todays.kg)}</Text>
            <Text style={[type.label, styles.brand]}>
              {t('weight.trend', { kg: kg(todays.trendKg) })}
            </Text>
          </View>
          <Button variant="link" label={t('weight.edit')} onPress={() => setEditing(todays.kg)} />
        </View>
      )}
      <TrendChart points={points} day={day} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.brand },
});
