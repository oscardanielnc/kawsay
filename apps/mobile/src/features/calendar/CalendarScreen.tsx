import type { DayColour } from '@kawsay/core/day/day-colour';
import { rangeState } from '@kawsay/core/day/range-state';
import {
  addMonths,
  monthDays,
  weekday,
  type LocalDate,
  type LocalMonth,
} from '@kawsay/core/shared/local-date';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/layout/GradientBackground';
import Svg, { Circle, G, Line, Polyline, Rect } from 'react-native-svg';
import { Segmented } from '@/components/forms/Segmented';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, touch, type, screenPadding, tabBarSpace } from '@/lib/theme';

/** One past (or today's) day of the month, computed by the route. */
export interface CalendarDay {
  date: LocalDate;
  colour: DayColour;
  kcal: number;
  targetKcal: number | null;
  proteinG: number;
  targetProteinG: number | null;
  movementMinutes: number;
  /** An activity, "No physical activity", or nothing logged (F14). */
  activity: 'logged' | 'none' | 'missing';
  glasses: number;
  bloating: string | null;
  weightKg: number | null;
  trendKg: number | null;
}

interface Props {
  month: LocalMonth;
  today: LocalDate;
  days: readonly CalendarDay[];
  onMonth: (month: LocalMonth) => void;
  onOpenDay: (date: LocalDate) => void;
}

const BAND: Record<DayColour, { bg: string; mark: string; ink: string }> = {
  green: { bg: color.blue300, mark: '✓', ink: color.blue800 },
  yellow: { bg: color.amber300, mark: '•', ink: color.amber800 },
  red: { bg: color.coral300, mark: '×', ink: color.coral800 },
  grey: { bg: color.line, mark: '', ink: color.inkMuted },
};
const COLOURS: readonly DayColour[] = ['green', 'yellow', 'red', 'grey'];
type Metric = 'kcal' | 'protein' | 'movement' | 'drinks' | 'weight';
const METRICS: readonly Metric[] = ['kcal', 'protein', 'movement', 'drinks', 'weight'];
const W = 310;
const H = 120;
const PAD = 6;

/** "L M M J V S D" from the locale: 5–11 October 2026 run Monday to Sunday. */
function weekdayLetters(locale: string): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
  return [5, 6, 7, 8, 9, 10, 11].map((d) =>
    format.format(new Date(Date.UTC(2026, 9, d, 12))).toUpperCase(),
  );
}

function zone(metric: 'calories' | 'protein', value: number, target: number | null, open: boolean) {
  if (target === null) return null;
  return rangeState({ metric, value, target, dayOpen: open });
}

function MonthChart({
  month,
  days,
  metric,
}: {
  month: LocalMonth;
  days: readonly CalendarDay[];
  metric: Metric;
}) {
  const { t } = useTranslation();
  const all = monthDays(month);
  const slot = (W - 2 * PAD) / all.length;
  const x = (date: LocalDate) => PAD + all.indexOf(date) * slot;
  const name = t(`calendar.metrics.${metric}`);

  if (metric === 'weight') {
    const raw = days.filter((d) => d.weightKg !== null);
    const trend = days.filter((d) => d.trendKg !== null);
    const values = [...raw.map((d) => d.weightKg ?? 0), ...trend.map((d) => d.trendKg ?? 0)];
    const first = trend[0]?.trendKg;
    const last = trend.at(-1)?.trendKg;
    const label =
      first != null && last != null
        ? t('calendar.chart.weight', { from: formatNumber(first, 1), to: formatNumber(last, 1) })
        : t('calendar.chart.empty', { name });
    if (values.length === 0)
      return (
        <Text accessibilityLabel={label} style={[type.caption, styles.muted]}>
          {label}
        </Text>
      );
    const min = Math.min(...values) - 0.3;
    const max = Math.max(...values) + 0.3;
    const y = (v: number) => PAD + ((max - v) / (max - min)) * (H - 2 * PAD);
    return (
      <View accessible accessibilityLabel={label}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          {raw.map((d) => (
            <Circle
              key={d.date}
              cx={x(d.date) + slot / 2}
              cy={y(d.weightKg ?? 0)}
              r={3}
              fill={color.noData}
            />
          ))}
          <Polyline
            points={trend.map((d) => `${x(d.date) + slot / 2},${y(d.trendKg ?? 0)}`).join(' ')}
            fill="none"
            stroke={color.blue700}
            strokeWidth={2.5}
          />
        </Svg>
      </View>
    );
  }

  const valueOf = (d: CalendarDay) =>
    metric === 'kcal'
      ? d.kcal
      : metric === 'protein'
        ? d.proteinG
        : metric === 'movement'
          ? d.movementMinutes
          : d.glasses;
  const targetOf = (d: CalendarDay) =>
    metric === 'kcal' ? d.targetKcal : metric === 'protein' ? d.targetProteinG : null;
  const inGreen = (d: CalendarDay) =>
    metric === 'kcal' || metric === 'protein'
      ? zone(metric === 'kcal' ? 'calories' : 'protein', valueOf(d), targetOf(d), false) === 'green'
      : false;
  const logged = days.filter((d) => valueOf(d) > 0);
  const max = Math.max(1, ...days.map((d) => Math.max(valueOf(d), targetOf(d) ?? 0))) * 1.1;
  const y = (v: number) => H - PAD - (v / max) * (H - 2 * PAD);
  const total = days.reduce((sum, d) => sum + valueOf(d), 0);
  const label =
    metric === 'kcal' || metric === 'protein'
      ? t('calendar.chart.inRange', {
          name,
          count: logged.filter(inGreen).length,
          days: logged.length,
        })
      : metric === 'movement'
        ? t('calendar.chart.movement', { minutes: formatNumber(total) })
        : t('calendar.chart.drinks', {
            glasses: formatNumber(logged.length ? total / logged.length : 0, 1),
          });
  return (
    <View accessible accessibilityLabel={label}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {days.map((d) => {
          const v = valueOf(d);
          const target = targetOf(d);
          return (
            <G key={d.date}>
              {v > 0 ? (
                <Rect
                  x={x(d.date) + 1}
                  y={y(v)}
                  width={Math.max(2, slot - 2)}
                  height={H - PAD - y(v)}
                  rx={2}
                  fill={inGreen(d) ? color.blue700 : color.noData}
                />
              ) : null}
              {target ? (
                <Line
                  x1={x(d.date)}
                  x2={x(d.date) + slot}
                  y1={y(target)}
                  y2={y(target)}
                  stroke={color.blue700}
                  strokeWidth={1.5}
                />
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/** Calendar (F14, signature S1): the month as a woven blanket of day bands, a day summary and the monthly chart. */
export function CalendarScreen({ month, today, days, onMonth, onOpenDay }: Props) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<LocalDate | null>(null);
  const [metric, setMetric] = useState<Metric>('kcal');
  const byDate = new Map(days.map((d) => [d.date, d]));
  const all = monthDays(month);
  const lead = weekday(all[0] ?? `${month}-01`);
  const isCurrent = today.startsWith(month);
  const dayName = (date: LocalDate) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  const monthName = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-15T12:00:00Z`));
  const count = (c: DayColour) => days.filter((d) => d.colour === c).length;
  const shown = (selected ? byDate.get(selected) : undefined) ?? byDate.get(today) ?? days.at(-1);

  const zoneLabel = (z: ReturnType<typeof zone>, value: number, unit: string) => {
    const text =
      z === 'green'
        ? t('calendar.zone.green')
        : z === 'yellow'
          ? t('calendar.zone.yellow')
          : z === 'red'
            ? t('calendar.zone.red')
            : t('calendar.zone.open');
    return `${formatNumber(value)} ${unit} · ${text}`;
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('calendar.previous')}
              onPress={() => onMonth(addMonths(month, -1))}
              style={styles.arrow}
            >
              <Text style={[type.title, styles.brand]}>‹</Text>
            </Pressable>
            <Text accessibilityRole="header" style={[type.display, styles.ink, styles.grow]}>
              {monthName}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('calendar.next')}
              accessibilityState={{ disabled: isCurrent }}
              disabled={isCurrent}
              onPress={() => onMonth(addMonths(month, 1))}
              style={[styles.arrow, isCurrent && styles.dim]}
            >
              <Text style={[type.title, styles.brand]}>›</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {weekdayLetters(i18n.language).map((w, i) => (
              <Text
                key={`${w}-${i}`}
                style={[type.caption, styles.muted, styles.cell, styles.weekday]}
              >
                {w}
              </Text>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <View key={`lead-${i}`} style={styles.cell} />
            ))}
            {all.map((date) => {
              const d = byDate.get(date);
              const n = Number(date.slice(8));
              if (!d || date > today) {
                return (
                  <View key={date} style={[styles.cell, styles.band, styles.future]}>
                    <Text style={[type.caption, styles.muted]}>{n}</Text>
                  </View>
                );
              }
              const band = BAND[d.colour];
              return (
                <Pressable
                  key={date}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayName(date)}: ${t(`calendar.status.${d.colour}`)}`}
                  accessibilityState={{ selected: shown?.date === date }}
                  onPress={() => setSelected(date)}
                  style={[
                    styles.cell,
                    styles.band,
                    { backgroundColor: band.bg },
                    shown?.date === date && styles.selected,
                  ]}
                >
                  <Text style={[type.label, { color: band.ink }]}>{n}</Text>
                  <Text style={[type.caption, { color: band.ink }]}>{band.mark}</Text>
                  {date === today ? <View style={styles.todayDot} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Text style={[type.label, styles.muted]}>
            {COLOURS.map((c) => `${count(c)} ${t(`calendar.counter.${c}`)}`).join(' · ')}
          </Text>

          {shown ? (
            <Card title={`${dayName(shown.date)} · ${t(`calendar.status.${shown.colour}`)}`}>
              {shown.colour === 'grey' && shown.kcal === 0 ? (
                <Text style={[type.body, styles.ink]}>{t('calendar.unlogged')}</Text>
              ) : (
                <>
                  <Row
                    label={t('calendar.metrics.kcal')}
                    value={zoneLabel(
                      zone('calories', shown.kcal, shown.targetKcal, shown.date === today),
                      shown.kcal,
                      'kcal',
                    )}
                  />
                  <Row
                    label={t('calendar.metrics.protein')}
                    value={zoneLabel(
                      zone('protein', shown.proteinG, shown.targetProteinG, shown.date === today),
                      shown.proteinG,
                      'g',
                    )}
                  />
                  <Row
                    label={t('calendar.activity')}
                    value={
                      shown.activity === 'logged'
                        ? t('calendar.minutes', { minutes: formatNumber(shown.movementMinutes) })
                        : t(`calendar.activityValues.${shown.activity}`)
                    }
                  />
                  <Row
                    label={t('calendar.metrics.drinks')}
                    value={t('calendar.glasses', {
                      glasses: formatNumber(shown.glasses, shown.glasses % 1 ? 1 : 0),
                    })}
                  />
                  <Row
                    label={t('calendar.bloating')}
                    value={
                      shown.bloating
                        ? t(`checkins.bloatingValues.${shown.bloating as 'usual'}`)
                        : '—'
                    }
                  />
                </>
              )}
              <Button label={t('calendar.open')} onPress={() => onOpenDay(shown.date)} />
            </Card>
          ) : null}

          <Card title={t('calendar.chartTitle')}>
            <Segmented
              options={METRICS.map((m) => ({ value: m, label: t(`calendar.metrics.${m}`) }))}
              value={metric}
              onChange={setMetric}
            />
            <MonthChart month={month} days={days} metric={metric} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={[type.label, styles.muted, styles.grow]}>{label}</Text>
      <Text style={[type.label, styles.ink]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: screenPadding, paddingBottom: tabBarSpace, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  arrow: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.3 },
  grow: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, padding: 2 },
  weekday: { textAlign: 'center' },
  band: {
    minHeight: touch + 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: color.surface2,
  },
  future: { borderStyle: 'dashed', borderColor: color.line, backgroundColor: 'transparent' },
  selected: { borderColor: color.ink },
  todayDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.blue700,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28 },
  ink: { color: color.ink },
  muted: { color: color.inkSoft },
  brand: { color: color.blue700 },
});
