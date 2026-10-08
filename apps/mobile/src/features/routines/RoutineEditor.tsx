import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityIcon } from '@/components/data-display/ActivityIcon';
import { Stepper } from '@/components/forms/Stepper';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { RoutineInput } from './routines-db';
import { routineTotals } from './session';

interface Props {
  draft: RoutineInput;
  bmrKcal: number;
  onChange: (draft: RoutineInput) => void;
  onEditExercise: (index: number) => void;
  onAddExercise: () => void;
  onDelete?: () => void;
}

/** Name, rest between sets, exercises with their kcal and minutes, the total and an ⓘ with each MET (F18). */
export function RoutineEditor({ draft, bmrKcal, onChange, onEditExercise, onAddExercise, onDelete }: Props) {
  const { t } = useTranslation();
  const [formula, setFormula] = useState(false);
  const totals = routineTotals({ id: draft.id ?? '', ...draft }, bmrKcal);
  return (
    <>
      <Text style={[type.label, styles.muted]}>{t('routines.name')}</Text>
      <TextInput
        accessibilityLabel={t('routines.name')}
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name })}
        style={[type.body, styles.input]}
      />
      <Stepper
        label={t('routines.rest')}
        hint={t('routines.restHint')}
        value={`${draft.restSeconds} s`}
        onDecrement={() => onChange({ ...draft, restSeconds: Math.max(0, draft.restSeconds - 15) })}
        onIncrement={() => onChange({ ...draft, restSeconds: draft.restSeconds + 15 })}
      />
      {draft.exercises.map((item, index) => {
        const energy = totals.perExercise[index];
        const label = `${item.name}. ${t(`routines.kinds.${item.exercise.kind}`)}`;
        return (
          <Pressable key={index} accessibilityRole="button" accessibilityLabel={label} onPress={() => onEditExercise(index)} style={styles.row}>
            <ActivityIcon kind={item.exercise.kind === 'stairs' ? 'stairs' : item.exercise.kind} />
            <View style={styles.grow}>
              <Text style={[type.heading, styles.ink]}>{item.name}</Text>
              <Text style={[type.caption, styles.muted]}>{t(`routines.kinds.${item.exercise.kind}`)}</Text>
            </View>
            {energy ? (
              <Text style={[type.label, styles.ink]}>
                {t('routines.rowEnergy', { kcal: formatNumber(energy.kcal), minutes: formatNumber(energy.minutes, 1) })}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      <Button variant="secondary" label={t('routines.addExercise')} onPress={onAddExercise} />
      <View style={styles.total}>
        <Text style={[type.title, styles.ink]}>
          {t('routines.total', { kcal: formatNumber(totals.kcal), minutes: formatNumber(totals.minutes) })}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => setFormula(!formula)}>
          <Text style={[type.label, styles.brand]}>{t('routines.how')}</Text>
        </Pressable>
        {formula ? (
          <>
            <Text style={[type.caption, styles.ink]}>{t('routines.formula', { bmr: formatNumber(bmrKcal) })}</Text>
            {draft.exercises.map((item, index) => (
              <Text key={index} style={[type.caption, styles.ink]}>
                {`${item.name} · MET ${formatNumber(totals.perExercise[index]?.met ?? 0, 1)} · ${totals.perExercise[index]?.code ?? ''}`}
              </Text>
            ))}
          </>
        ) : null}
      </View>
      {onDelete ? <Button variant="link" label={t('routines.delete')} onPress={onDelete} /> : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
  grow: { flex: 1 },
  total: { backgroundColor: color.green50, borderRadius: radius.card, padding: space.md, gap: space.xs },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.brand },
});
