import { shiftTime, type ClockTime } from '@kawsay/core/shared/clock-time';
import { clockHours } from '@kawsay/core/sleep/sleep-session';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Stepper } from '@/components/forms/Stepper';
import { Toggle } from '@/components/forms/Toggle';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatDuration } from '@/lib/format';
import { color, radius, space, touch, type } from '@/lib/theme';
import type { SleepKind, SleepSession } from './sleep-db';

/** What the section asks to store; with `id` it edits that session. */
export interface SleepChange {
  id?: string;
  kind: SleepKind;
  start: ClockTime;
  end: ClockTime;
  quality: number | null;
  nightmares: boolean;
}

interface Props {
  sessions: readonly SleepSession[];
  usualNight: { start: ClockTime; end: ClockTime };
  usualNap: { start: ClockTime; end: ClockTime } | null;
  onSave: (change: SleepChange) => void;
  onDelete: (id: string) => void;
}

/** A session on screen: saved, or a draft prefilled from the usual schedule that saves on its first change. */
interface Shown extends SleepChange {
  key: string;
  draftOf?: 'usualNap' | number;
}

const STEP_MIN = 15;
const QUALITY = [1, 2, 3, 4, 5] as const;
const NIGHT_INK = '#3D4C8C';
const NEW_NAP = { start: '14:00', end: '14:30' };

function Moon({ on }: { on: boolean }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M19 14A7 7 0 1 1 10 5a5.5 5.5 0 0 0 9 9z"
        fill={on ? NIGHT_INK : 'none'}
        stroke={on ? NIGHT_INK : color.inkMuted}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

/** Sleep (F11): night and naps prefilled from the usual schedule, editable times, quality moons, nightmares. */
export function SleepSection({ sessions, usualNight, usualNap, onSave, onDelete }: Props) {
  const { t } = useTranslation();
  const [addedNaps, setAddedNaps] = useState<number[]>([]);
  const [usualNapDismissed, setUsualNapDismissed] = useState(false);

  const shown: Shown[] = sessions.map((s) => ({ ...s, key: s.id }));
  if (!sessions.some((s) => s.kind === 'night')) {
    shown.unshift({ key: 'night', kind: 'night', ...usualNight, quality: null, nightmares: false });
  }
  if (usualNap && !usualNapDismissed && !sessions.some((s) => s.kind === 'nap')) {
    shown.push({
      key: 'usual-nap',
      kind: 'nap',
      ...usualNap,
      quality: null,
      nightmares: false,
      draftOf: 'usualNap',
    });
  }
  for (const n of addedNaps) {
    shown.push({
      key: `nap-${n}`,
      kind: 'nap',
      ...NEW_NAP,
      quality: null,
      nightmares: false,
      draftOf: n,
    });
  }
  const total = shown.reduce((sum, s) => sum + clockHours(s), 0);

  const change = (s: Shown, patch: Partial<SleepChange>) => {
    const { draftOf } = s;
    onSave({
      ...(s.id !== undefined && { id: s.id }),
      kind: s.kind,
      start: s.start,
      end: s.end,
      quality: s.quality,
      nightmares: s.nightmares,
      ...patch,
    });
    if (typeof draftOf === 'number') setAddedNaps((naps) => naps.filter((n) => n !== draftOf));
  };
  const remove = (s: Shown) => {
    if (s.id) onDelete(s.id);
    else if (s.draftOf === 'usualNap') setUsualNapDismissed(true);
    else setAddedNaps((naps) => naps.filter((n) => n !== s.draftOf));
  };

  return (
    <Card title={t('sleep.title')}>
      <Text style={[type.heading, styles.ink]}>
        {t('sleep.total', { hours: formatDuration(total) })}
      </Text>
      {shown.map((s) => {
        const hours = clockHours(s);
        const unfinished = hours === 0 && s.start !== s.end;
        return (
          <View key={s.key} style={styles.session}>
            <View style={styles.top}>
              <Text style={[type.heading, styles.ink, styles.grow]}>
                {t(`sleep.kinds.${s.kind}`)}
              </Text>
              <Text style={[type.label, styles.muted]}>
                {t('sleep.hours', { hours: formatDuration(hours) })}
              </Text>
              {s.kind === 'nap' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('sleep.removeNap')}
                  onPress={() => remove(s)}
                  style={styles.remove}
                >
                  <Text style={[type.title, styles.muted]}>×</Text>
                </Pressable>
              ) : null}
            </View>
            <Stepper
              label={t('sleep.fellAsleep')}
              value={s.start}
              onDecrement={() => change(s, { start: shiftTime(s.start, -STEP_MIN) })}
              onIncrement={() => change(s, { start: shiftTime(s.start, STEP_MIN) })}
            />
            <Stepper
              label={t('sleep.wokeUp')}
              value={s.end}
              onDecrement={() => change(s, { end: shiftTime(s.end, -STEP_MIN) })}
              onIncrement={() => change(s, { end: shiftTime(s.end, STEP_MIN) })}
            />
            {unfinished ? (
              <Text style={[type.caption, styles.accent]}>{t('sleep.endBeforeStart')}</Text>
            ) : null}
            <Text style={[type.label, styles.muted]}>
              {t('sleep.quality')} ·{' '}
              <Text style={s.quality ? styles.night : styles.accent}>
                {s.quality ? t(`sleep.qualityValues.${s.quality as 1}`) : t('sleep.tapMoon')}
              </Text>
            </Text>
            <View style={styles.moons}>
              {QUALITY.map((q) => (
                <Pressable
                  key={q}
                  accessibilityRole="button"
                  accessibilityLabel={t('sleep.qualityLabel', {
                    name: t(`sleep.qualityValues.${q}`),
                  })}
                  accessibilityState={{ selected: s.quality === q }}
                  onPress={() => change(s, { quality: q })}
                  style={styles.moon}
                >
                  <Moon on={s.quality !== null && q <= s.quality} />
                </Pressable>
              ))}
            </View>
            <Toggle
              label={t('sleep.nightmares')}
              value={s.nightmares}
              onChange={(nightmares) => change(s, { nightmares })}
            />
          </View>
        );
      })}
      <Button
        variant="link"
        label={t('sleep.addNap')}
        onPress={() => setAddedNaps((naps) => [...naps, (naps.at(-1) ?? 0) + 1])}
      />
      <Text style={[type.caption, styles.muted]}>{t('sleep.note')}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  session: {
    gap: space.xs,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  remove: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
  moons: { flexDirection: 'row', gap: space.xs },
  moon: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  night: { color: NIGHT_INK },
  accent: { color: color.accent },
});
