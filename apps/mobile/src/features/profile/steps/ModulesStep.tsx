import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { color, radius, space, type } from '@/lib/theme';
import { Segmented } from '@/components/forms/Segmented';
import { Toggle } from '@/components/forms/Toggle';
import type { StepProps } from './BodyStep';

/** Six always-on modules and three optional ones (F01, F04, F12, F13). */
export function ModulesStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const always = t('profile.always', { returnObjects: true });
  const weekdays = t('profile.weekdays', { returnObjects: true });
  return (
    <>
      <Text style={[type.label, styles.muted]}>{t('profile.alwaysOn')}</Text>
      <View style={styles.chips}>
        {always.map((name) => (
          <Text key={name} style={[type.label, styles.chip]}>
            {name}
          </Text>
        ))}
      </View>
      <Text style={[type.label, styles.muted]}>{t('profile.optional')}</Text>
      <Toggle
        label={t('profile.waist')}
        description={t('profile.waistHint')}
        value={draft.waistEnabled}
        onChange={(waistEnabled) => update({ waistEnabled })}
      />
      {draft.waistEnabled ? (
        <Segmented
          options={weekdays.map((label, value) => ({ value, label }))}
          value={draft.waistReminderDay}
          onChange={(waistReminderDay) => update({ waistReminderDay })}
        />
      ) : null}
      <Toggle
        label={t('profile.symptoms')}
        description={t('profile.symptomsHint')}
        value={draft.symptomsEnabled}
        onChange={(symptomsEnabled) => update({ symptomsEnabled })}
      />
      <Toggle
        label={t('profile.intimate')}
        description={t('profile.intimateHint')}
        value={draft.intimateEnabled}
        onChange={(intimateEnabled) => update({ intimateEnabled })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    backgroundColor: color.green100,
    color: color.brand,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  muted: { color: color.inkMuted },
});
