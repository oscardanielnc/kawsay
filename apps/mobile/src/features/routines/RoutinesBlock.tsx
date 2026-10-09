import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIcon } from '@/components/data-display/ActivityIcon';
import { Sheet } from '@/components/feedback/Sheet';
import { Segmented } from '@/components/forms/Segmented';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import { ExerciseEditor } from './ExerciseEditor';
import { LapStopwatch } from './LapStopwatch';
import { LogRoutine, type LogChoice } from './LogRoutine';
import { RoutineEditor } from './RoutineEditor';
import type { Routine, RoutineInput } from './routines-db';
import { routineTotals, sessionOf } from './session';
import { EXERCISE_TEMPLATES, ROUTINE_TEMPLATES, routineFromTemplate } from './templates';

/** Order of the kinds in "+ Exercise". */
const KIND_ORDER = ['weights', 'bodyweight', 'circuit', 'isometric', 'stairs', 'mobility'] as const;

type Band = 'early' | 'morning' | 'midday' | 'afternoon' | 'night';
const BANDS: readonly Band[] = ['early', 'morning', 'midday', 'afternoon', 'night'];

export interface LoggedSession {
  routine: Routine;
  minutes: number;
  met: number;
  share: number;
  timeBand: Band;
}

interface Props {
  routines: readonly Routine[];
  bmrKcal: number;
  defaultBand: Band;
  onLog: (session: LoggedSession) => void;
  onSave: (routine: RoutineInput) => void;
  onDelete: (id: string) => void;
}

type Mode =
  | { kind: 'log'; routine: Routine; choice: LogChoice; band: Band }
  | { kind: 'manage' }
  | { kind: 'new' }
  | { kind: 'edit'; draft: RoutineInput }
  | { kind: 'templates'; draft: RoutineInput }
  | { kind: 'exercise'; draft: RoutineInput; index: number }
  | { kind: 'stopwatch'; draft: RoutineInput; index: number };

const NEW_ROUTINE: RoutineInput = { name: '', restSeconds: 75, exercises: [] };

/** "Your routines" (F18): one-tap chips to log, and the manager and editor behind "Manage". */
export function RoutinesBlock({ routines, bmrKcal, defaultBand, onLog, onSave, onDelete }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode | null>(null);
  const close = () => setMode(null);

  let title: string | null = null;
  let body = null;
  let footer = null;
  if (mode?.kind === 'log') {
    const { routine, choice, band } = mode;
    title = routine.name;
    body = (
      <>
        <LogRoutine
          routine={routine}
          bmrKcal={bmrKcal}
          onChange={(next) => setMode({ ...mode, choice: next })}
        />
        <Text style={[type.label, styles.muted]}>{t('activity.when')}</Text>
        <Segmented
          options={BANDS.map((b) => ({ value: b, label: t(`activity.bands.${b}`) }))}
          value={band}
          onChange={(b) => setMode({ ...mode, band: b })}
        />
      </>
    );
    footer = (
      <Button
        label={t('routines.save')}
        onPress={() => {
          const session = sessionOf(routine, choice, bmrKcal);
          const planned = routineTotals(routine, bmrKcal).minutes;
          const share =
            'completion' in choice
              ? choice.completion
              : 'rounds' in choice
                ? choice.rounds
                : planned
                  ? session.minutes / planned
                  : 1;
          onLog({ routine, minutes: session.minutes, met: session.met, share, timeBand: band });
          close();
        }}
      />
    );
  } else if (mode?.kind === 'manage') {
    title = t('routines.title');
    body = (
      <>
        {routines.map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={[type.heading, styles.ink, styles.grow]}>{r.name}</Text>
            <Button
              variant="link"
              label={t('routines.edit')}
              accessibilityLabel={t('routines.editNamed', { name: r.name })}
              onPress={() => setMode({ kind: 'edit', draft: r })}
            />
          </View>
        ))}
        <Button
          variant="secondary"
          label={t('routines.create')}
          onPress={() => setMode({ kind: 'new' })}
        />
      </>
    );
    footer = <View />;
  } else if (mode?.kind === 'new') {
    title = t('routines.newTitle');
    body = (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('routines.empty')}
          onPress={() => setMode({ kind: 'edit', draft: NEW_ROUTINE })}
          style={styles.row}
        >
          <Text style={[type.title, styles.accent]}>+</Text>
          <View style={styles.grow}>
            <Text style={[type.heading, styles.ink]}>{t('routines.empty')}</Text>
            <Text style={[type.caption, styles.muted]}>{t('routines.emptyHint')}</Text>
          </View>
        </Pressable>
        <Text style={[type.label, styles.muted]}>{t('routines.fromTemplate')}</Text>
        {ROUTINE_TEMPLATES.map((template) => {
          const minutes = routineTotals(
            { id: '', ...template, exercises: [...template.exercises] },
            bmrKcal,
          ).minutes;
          const summary = t(
            template.byRounds ? 'routines.templateRounds' : 'routines.templateSummary',
            {
              count: template.exercises.length,
              minutes: formatNumber(minutes),
            },
          );
          return (
            <Pressable
              key={template.name}
              accessibilityRole="button"
              accessibilityLabel={`${template.name}. ${summary}`}
              onPress={() => setMode({ kind: 'edit', draft: routineFromTemplate(template) })}
              style={styles.row}
            >
              <ActivityIcon kind={template.exercises[0]?.exercise.kind ?? 'weights'} />
              <View style={styles.grow}>
                <Text style={[type.heading, styles.ink]}>{template.name}</Text>
                <Text style={[type.caption, styles.muted]}>{summary}</Text>
              </View>
            </Pressable>
          );
        })}
      </>
    );
    footer = <View />;
  } else if (mode?.kind === 'edit') {
    const { draft } = mode;
    title = t('routines.editTitle');
    body = (
      <RoutineEditor
        draft={draft}
        bmrKcal={bmrKcal}
        onChange={(next) => setMode({ kind: 'edit', draft: next })}
        onEditExercise={(index) => setMode({ kind: 'exercise', draft, index })}
        onAddExercise={() => setMode({ kind: 'templates', draft })}
        {...(draft.id && {
          onDelete: () => {
            onDelete(draft.id ?? '');
            close();
          },
        })}
      />
    );
    footer = (
      <Button
        label={t('routines.saveRoutine')}
        disabled={!draft.name.trim() || draft.exercises.length === 0}
        onPress={() => {
          onSave({ ...draft, name: draft.name.trim() });
          close();
        }}
      />
    );
  } else if (mode?.kind === 'templates') {
    const { draft } = mode;
    title = t('routines.addExerciseTitle');
    body = KIND_ORDER.map((kind) => (
      <View key={kind} style={styles.group}>
        <Text style={[type.label, styles.muted]}>{t(`routines.kinds.${kind}`)}</Text>
        {EXERCISE_TEMPLATES.filter((template) => template.exercise.kind === kind).map(
          (template) => (
            <Pressable
              key={template.name}
              accessibilityRole="button"
              accessibilityLabel={`${template.name}. ${t(`routines.kinds.${kind}`)}`}
              onPress={() =>
                setMode({
                  kind: 'edit',
                  draft: {
                    ...draft,
                    exercises: [
                      ...draft.exercises,
                      { name: template.name, exercise: { ...template.exercise } },
                    ],
                  },
                })
              }
              style={styles.row}
            >
              <ActivityIcon kind={kind} />
              <Text style={[type.heading, styles.ink, styles.grow]}>{template.name}</Text>
              <Text style={[type.title, styles.accent]}>+</Text>
            </Pressable>
          ),
        )}
      </View>
    ));
    footer = <View />;
  } else if (mode?.kind === 'exercise' || mode?.kind === 'stopwatch') {
    const { draft, index } = mode;
    const item = draft.exercises[index];
    const replace = (next: typeof item) =>
      next && { ...draft, exercises: draft.exercises.map((e, i) => (i === index ? next : e)) };
    title = item?.name ?? '';
    const stairs = item?.exercise.kind === 'stairs' ? item.exercise : null;
    if (mode.kind === 'stopwatch' && item && stairs) {
      body = (
        <LapStopwatch
          onDone={(lapSeconds) =>
            setMode({
              kind: 'exercise',
              draft: replace({ ...item, exercise: { ...stairs, lapSeconds } }) ?? draft,
              index,
            })
          }
        />
      );
      footer = <View />;
    } else if (item) {
      body = (
        <ExerciseEditor
          item={item}
          restSeconds={draft.restSeconds}
          bmrKcal={bmrKcal}
          onChange={(next) => setMode({ kind: 'exercise', draft: replace(next) ?? draft, index })}
          onMeasureLap={() => setMode({ kind: 'stopwatch', draft, index })}
        />
      );
      footer = (
        <View style={styles.footer}>
          <Button
            variant="secondary"
            label={t('routines.removeExercise')}
            onPress={() =>
              setMode({
                kind: 'edit',
                draft: { ...draft, exercises: draft.exercises.filter((_, i) => i !== index) },
              })
            }
          />
          <View style={styles.grow}>
            <Button label={t('common.done')} onPress={() => setMode({ kind: 'edit', draft })} />
          </View>
        </View>
      );
    }
  }

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Text style={[type.label, styles.muted, styles.grow]}>{t('routines.title')}</Text>
        <Button
          variant="link"
          label={t('routines.manage')}
          onPress={() => setMode({ kind: 'manage' })}
        />
      </View>
      <View style={styles.chips}>
        {routines.map((r) => {
          const minutes = routineTotals(r, bmrKcal).minutes;
          return (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityLabel={`${r.name}, ${formatNumber(minutes)}′`}
              onPress={() =>
                setMode({ kind: 'log', routine: r, choice: { completion: 1 }, band: defaultBand })
              }
              style={styles.chip}
            >
              <ActivityIcon kind={r.exercises[0]?.exercise.kind ?? 'weights'} size={28} />
              <Text style={[type.label, styles.ink]}>{r.name}</Text>
              <Text style={[type.caption, styles.muted]}>{formatNumber(minutes)}′</Text>
            </Pressable>
          );
        })}
      </View>
      <Sheet title={title} onDone={close} footer={footer}>
        {body}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  group: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    paddingRight: space.md,
    paddingLeft: 4,
    minHeight: 40,
  },
  footer: { flexDirection: 'row', gap: space.sm },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  accent: { color: color.accent },
});
