import type { Intensity } from '@kawsay/core/energy/activity';
import { exerciseEnergy, type Exercise } from '@kawsay/core/energy/routine';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Segmented } from '@/components/forms/Segmented';
import { Stepper } from '@/components/forms/Stepper';
import { Toggle } from '@/components/forms/Toggle';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { NamedExercise } from './routines-db';

interface Props {
  item: NamedExercise;
  restSeconds: number;
  bmrKcal: number;
  onChange: (item: NamedExercise) => void;
  onMeasureLap: () => void;
}

const LEVELS: readonly Intensity[] = ['light', 'medium', 'hard'];

/** One exercise: the amounts its kind measures, per side, effort, and its kcal and minutes (F18). */
export function ExerciseEditor({ item, restSeconds, bmrKcal, onChange, onMeasureLap }: Props) {
  const { t } = useTranslation();
  const e = item.exercise;
  const set = (patch: Partial<Exercise>) =>
    onChange({ ...item, exercise: { ...e, ...patch } as Exercise });
  const step = (
    label: string,
    value: number,
    unit: string,
    key: string,
    delta: number,
    min: number,
  ) => (
    <Stepper
      label={label}
      value={`${formatNumber(value)}${unit}`}
      onDecrement={() => set({ [key]: Math.max(min, value - delta) })}
      onIncrement={() => set({ [key]: value + delta })}
    />
  );
  const energy = exerciseEnergy(e, { restSeconds, bmrKcal });

  return (
    <>
      <TextInput
        accessibilityLabel={t('routines.exerciseName')}
        value={item.name}
        onChangeText={(name) => onChange({ ...item, name })}
        style={[type.body, styles.input]}
      />
      {e.kind === 'stairs' ? (
        <>
          {step(t('routines.laps'), e.laps, '', 'laps', 1, 1)}
          {step(t('routines.lapTime'), e.lapSeconds, ' s', 'lapSeconds', 5, 10)}
          <Button variant="secondary" label={t('routines.measureLap')} onPress={onMeasureLap} />
        </>
      ) : null}
      {e.kind === 'mobility' ? step(t('routines.minutes'), e.minutes, '', 'minutes', 1, 1) : null}
      {e.kind === 'weights' || e.kind === 'bodyweight' || e.kind === 'isometric'
        ? step(t('routines.sets'), e.sets, '', 'sets', 1, 1)
        : null}
      {e.kind === 'isometric'
        ? step(t('routines.seconds'), e.seconds, ' s', 'seconds', 5, 5)
        : null}
      {e.kind === 'weights' || e.kind === 'bodyweight' ? (
        <>
          {step(t('routines.reps'), e.reps, '', 'reps', 1, 1)}
          {step(t('routines.secondsPerRep'), e.secondsPerRep, ' s', 'secondsPerRep', 1, 1)}
        </>
      ) : null}
      {e.kind === 'weights' || e.kind === 'bodyweight' || e.kind === 'isometric' ? (
        <Toggle
          label={t('routines.perSide')}
          value={e.perSide ?? false}
          onChange={(perSide) => set({ perSide })}
        />
      ) : null}
      <Text style={[type.label, styles.muted]}>{t('routines.effort')}</Text>
      <Segmented
        options={LEVELS.map((level) => ({
          value: level,
          label: t(`routines.efforts.${level}`),
          hint: t(`activity.talk.${level}`),
        }))}
        value={e.intensity ?? 'medium'}
        onChange={(intensity) => set({ intensity })}
      />
      <Text style={[type.body, styles.preview]}>
        {t('routines.exercisePreview', {
          kcal: formatNumber(energy.kcal),
          minutes: formatNumber(energy.minutes, 1),
          met: formatNumber(energy.met, 1),
          code: energy.code,
        })}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: color.surface,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    minHeight: 48,
    color: color.ink,
  },
  muted: { color: color.inkMuted },
  preview: {
    color: color.ink,
    backgroundColor: color.green50,
    borderRadius: radius.chip,
    padding: space.md,
  },
});
