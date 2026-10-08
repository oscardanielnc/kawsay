import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';
import { Segmented } from '@/components/forms/Segmented';
import { Stepper } from '@/components/forms/Stepper';
import { Toggle } from '@/components/forms/Toggle';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { Routine } from './routines-db';
import { plannedAmount, sessionOf } from './session';

export type LogChoice = { completion: number } | { done: number[] };

const SHARES = [1, 0.75, 0.5, 0.25] as const;

/** "How much did you do?": 100 / 75 / 50 / 25 % or the amount per exercise, with the live kcal and minutes (F18). */
export function LogRoutine({
  routine,
  bmrKcal,
  onChange,
}: {
  routine: Routine;
  bmrKcal: number;
  onChange: (choice: LogChoice) => void;
}) {
  const { t } = useTranslation();
  const [share, setShare] = useState(1);
  const [adjust, setAdjust] = useState(false);
  const [done, setDone] = useState(() => routine.exercises.map((e) => plannedAmount(e.exercise)));
  const choice: LogChoice = adjust ? { done } : { completion: share };
  const session = sessionOf(routine, choice, bmrKcal);
  const update = (next: { share?: number; adjust?: boolean; done?: number[] }) => {
    const nextShare = next.share ?? share;
    const nextAdjust = next.adjust ?? adjust;
    const nextDone = next.done ?? done;
    setShare(nextShare);
    setAdjust(nextAdjust);
    setDone(nextDone);
    onChange(nextAdjust ? { done: nextDone } : { completion: nextShare });
  };
  const unit = (kind: string) =>
    t(
      kind === 'stairs'
        ? 'routines.unitLaps'
        : kind === 'mobility'
          ? 'routines.unitMinutes'
          : 'routines.unitSets',
    );

  return (
    <>
      <Text style={[type.label, styles.muted]}>{t('routines.howMuch')}</Text>
      {adjust ? null : (
        <Segmented
          options={SHARES.map((s) => ({ value: s, label: `${s * 100}%` }))}
          value={share}
          onChange={(s) => update({ share: s })}
        />
      )}
      <Toggle
        label={t('routines.adjust')}
        description={t('routines.adjustHint')}
        value={adjust}
        onChange={(a) => update({ adjust: a })}
      />
      {adjust
        ? routine.exercises.map((item, i) => (
            <Stepper
              key={i}
              label={item.name}
              value={`${done[i] ?? 0} ${unit(item.exercise.kind)}`}
              onDecrement={() =>
                update({ done: done.map((d, j) => (j === i ? Math.max(0, d - 1) : d)) })
              }
              onIncrement={() => update({ done: done.map((d, j) => (j === i ? d + 1 : d)) })}
            />
          ))
        : null}
      <Text style={[type.heading, styles.preview]}>
        {t('routines.logPreview', {
          kcal: formatNumber(session.kcal),
          minutes: formatNumber(session.minutes),
        })}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  muted: { color: color.inkMuted },
  preview: {
    color: color.ink,
    backgroundColor: color.green50,
    borderRadius: radius.chip,
    padding: space.md,
  },
});
