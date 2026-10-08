import { waistToHeight } from '@kawsay/core/body/waist-to-height';
import { weekday, weekStart, type LocalDate } from '@kawsay/core/shared/local-date';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Stepper } from '@/components/forms/Stepper';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, space, type } from '@/lib/theme';
import { waistSegments } from './chart';
import type { Waist } from './waist-db';

interface Props {
  day: LocalDate;
  /** Recent weeks, oldest first. */
  waists: readonly Waist[];
  heightCm: number;
  /** 0 = Monday … 6 = Sunday. */
  reminderDay: number | null;
  onSave: (cm: number) => void;
}

const WEEKS = 12;
const STEP_CM = 0.5;
const FIRST_GUESS_CM = 90;
const W = 300;
const H = 90;
const PAD = 8;
const TONE_TEXT = {
  green: color.successText,
  yellow: color.warningText,
  red: color.dangerText,
} as const;

/** Weekly waist (F04): one input on the reminder day, the waist-to-height ratio, and weekly points with gaps. */
export function WaistCard({ day, waists, heightCm, reminderDay, onSave }: Props) {
  const { t } = useTranslation();
  const week = weekStart(day);
  const thisWeek = waists.find((w) => w.weekStart === week);
  const last = waists.at(-1);
  const [editing, setEditing] = useState<number | null>(null);
  const draft = editing ?? last?.cm ?? FIRST_GUESS_CM;
  const asking = !thisWeek || editing !== null;
  const due = !thisWeek && reminderDay !== null && weekday(day) === reminderDay;
  const ratio = thisWeek ? waistToHeight({ waistCm: thisWeek.cm, heightCm }) : null;

  const { weeks, segments } = waistSegments(waists, week, WEEKS);
  const values = waists.filter((w) => weeks.includes(w.weekStart)).map((w) => w.cm);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const x = (weekOf: LocalDate) => PAD + (weeks.indexOf(weekOf) / (WEEKS - 1)) * (W - 2 * PAD);
  const y = (cm: number) => PAD + ((max - cm) / (max - min)) * (H - 2 * PAD);

  return (
    <Card title={t('waist.title')}>
      {due ? <Text style={[type.heading, styles.accent]}>{t('waist.due')}</Text> : null}
      {asking ? (
        <>
          <Stepper
            label={t('waist.thisWeek')}
            value={t('waist.cm', { cm: formatNumber(draft, 1) })}
            onDecrement={() => setEditing(Math.max(40, draft - STEP_CM))}
            onIncrement={() => setEditing(Math.min(200, draft + STEP_CM))}
          />
          <Text style={[type.caption, styles.muted]}>{t('waist.rule')}</Text>
          <Button
            label={t('waist.save')}
            onPress={() => {
              onSave(draft);
              setEditing(null);
            }}
          />
        </>
      ) : thisWeek && ratio ? (
        <View style={styles.row}>
          <View style={styles.grow}>
            <Text style={[type.display, styles.ink]}>
              {t('waist.cm', { cm: formatNumber(thisWeek.cm, 1) })}
            </Text>
            <Text style={[type.label, { color: TONE_TEXT[ratio.tone] }]}>
              {t('waist.ratio', {
                ratio: formatNumber(ratio.ratio, 2),
                band: t(`waist.bands.${ratio.band}`),
              })}
            </Text>
          </View>
          <Button variant="link" label={t('waist.edit')} onPress={() => setEditing(thisWeek.cm)} />
        </View>
      ) : null}
      {values.length > 0 ? (
        <View
          accessible
          accessibilityLabel={t('waist.chart', { count: values.length, weeks: WEEKS })}
        >
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {segments.map((run) => (
              <Polyline
                key={run[0]?.weekStart}
                points={run.map((w) => `${x(w.weekStart)},${y(w.cm)}`).join(' ')}
                fill="none"
                stroke={color.brand}
                strokeWidth={2}
              />
            ))}
            {segments.flat().map((w) => (
              <Circle
                key={w.weekStart}
                cx={x(w.weekStart)}
                cy={y(w.cm)}
                r={3.5}
                fill={color.brand}
              />
            ))}
          </Svg>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  accent: { color: color.accent },
});
