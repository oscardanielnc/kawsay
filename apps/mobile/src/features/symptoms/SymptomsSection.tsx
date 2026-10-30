import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '@/components/feedback/Sheet';
import { Segmented } from '@/components/forms/Segmented';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { color, radius, space, touch, type } from '@/lib/theme';
import type { Symptom, SymptomScale } from './symptoms-db';

interface Props {
  symptoms: readonly Symptom[];
  /** The day's answer per symptom id. */
  answers: Record<string, string>;
  /** Symptoms whose episode reached yesterday: its days so far and yesterday's answer (F13). */
  ongoing?: Record<string, { days: number; value: string }>;
  onAnswer: (symptomId: string, value: string | null) => void;
  onCreate: (symptom: { name: string; scale: SymptomScale }) => void;
}

const SCALES: readonly SymptomScale[] = ['yes-no', 'zero-five', 'size'];
const OPTIONS: Record<Exclude<SymptomScale, 'yes-no'>, readonly string[]> = {
  'zero-five': ['0', '1', '2', '3', '4', '5'],
  size: ['small', 'medium', 'large'],
};

/** Your symptoms (F13): one chip per symptom, answered in one or two taps; "+ Create" in a few seconds. */
export function SymptomsSection({ symptoms, answers, ongoing = {}, onAnswer, onCreate }: Props) {
  const { t } = useTranslation();
  const [gone, setGone] = useState<string[]>([]);
  const asked = symptoms.filter(
    (s) => ongoing[s.id] && answers[s.id] === undefined && !gone.includes(s.id),
  );
  const [asking, setAsking] = useState<Symptom | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [scale, setScale] = useState<SymptomScale>('yes-no');
  const valueName = (s: Symptom, value: string) =>
    s.scale === 'size' ? t(`symptoms.sizes.${value as 'small'}`) : value;

  const tap = (s: Symptom) => {
    if (s.scale === 'yes-no') onAnswer(s.id, answers[s.id] ? null : 'yes');
    else setAsking(s);
  };

  return (
    <Card title={t('symptoms.title')}>
      {asked.map((s) => (
        <View key={s.id} style={styles.still}>
          <Text style={[type.heading, styles.ink]}>{t('symptoms.still', { name: s.name })}</Text>
          <Text style={[type.caption, styles.muted]}>
            {t('symptoms.stillDay', { day: ongoing[s.id]!.days + 1 })}
          </Text>
          <View style={styles.chips}>
            <Button
              label={t('symptoms.stillYes')}
              onPress={() => onAnswer(s.id, ongoing[s.id]!.value)}
            />
            <Button
              variant="secondary"
              label={t('symptoms.gone')}
              onPress={() => setGone((ids) => [...ids, s.id])}
            />
          </View>
        </View>
      ))}
      <View style={styles.chips}>
        {symptoms.map((s) => {
          const value = answers[s.id];
          const label =
            value && s.scale !== 'yes-no' ? `${s.name} · ${valueName(s, value)}` : s.name;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityState={{ selected: value !== undefined }}
              onPress={() => tap(s)}
              style={[styles.chip, value !== undefined && styles.on]}
            >
              <Text style={[type.label, styles.ink]}>{label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => setCreating(true)}
          style={[styles.chip, styles.add]}
        >
          <Text style={[type.label, styles.accent]}>{t('symptoms.create')}</Text>
        </Pressable>
      </View>

      <Sheet title={asking ? asking.name : null} onDone={() => setAsking(null)}>
        {asking && asking.scale !== 'yes-no' ? (
          <View style={styles.chips}>
            {OPTIONS[asking.scale].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`${asking.name}: ${valueName(asking, value)}`}
                accessibilityState={{ selected: answers[asking.id] === value }}
                onPress={() => {
                  onAnswer(asking.id, value);
                  setAsking(null);
                }}
                style={[styles.option, answers[asking.id] === value && styles.on]}
              >
                <Text style={[type.heading, styles.ink]}>{valueName(asking, value)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {asking && answers[asking.id] !== undefined ? (
          <Button
            variant="link"
            label={t('symptoms.clear')}
            onPress={() => {
              onAnswer(asking.id, null);
              setAsking(null);
            }}
          />
        ) : null}
      </Sheet>

      <Sheet
        title={creating ? t('symptoms.createTitle') : null}
        onDone={() => setCreating(false)}
        footer={
          <Button
            label={t('symptoms.save')}
            disabled={name.trim() === ''}
            onPress={() => {
              onCreate({ name: name.trim(), scale });
              setName('');
              setScale('yes-no');
              setCreating(false);
            }}
          />
        }
      >
        <TextInput
          accessibilityLabel={t('symptoms.name')}
          placeholder={t('symptoms.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoFocus
          style={[type.body, styles.input]}
        />
        <Text style={[type.label, styles.muted]}>{t('symptoms.scale')}</Text>
        <Segmented
          options={SCALES.map((value) => ({ value, label: t(`symptoms.scales.${value}`) }))}
          value={scale}
          onChange={setScale}
        />
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  still: {
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  chip: {
    minHeight: touch,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
  },
  option: {
    minWidth: touch + 8,
    minHeight: touch,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
  },
  on: { borderColor: color.blue700, backgroundColor: color.blue50 },
  add: { borderStyle: 'dashed', borderColor: color.blue700 },
  input: {
    minHeight: touch,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
    color: color.ink,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  accent: { color: color.blue700 },
});
