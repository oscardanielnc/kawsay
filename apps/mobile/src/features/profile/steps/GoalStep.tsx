import { addDays, type LocalDate } from '@kawsay/core/shared/local-date';
import { MAX_WEEKLY_LOSS_SHARE } from '@kawsay/core/targets/day-target';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { formatNumber, formatShortDate } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import { Button } from '../components/Button';
import { Segmented } from '../components/Segmented';
import { Stepper } from '../components/Stepper';
import { draftPace, goalWeightOf } from '../draft';
import type { StepProps } from './BodyStep';

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Lose or maintain; goal weight and weeks with the live pace and the 1%-a-week warning (F01). */
export function GoalStep({ draft, update, today }: StepProps & { today: LocalDate }) {
  const { t } = useTranslation();
  const goalKg = goalWeightOf(draft);
  const pace = draftPace(draft);
  const maxKg = formatNumber(MAX_WEEKLY_LOSS_SHARE * draft.weightKg, 1);
  const dateIn = (weeks: number) => formatShortDate(addDays(today, weeks * 7));

  return (
    <>
      <Segmented
        options={[
          { value: 'lose', label: t('profile.lose') },
          { value: 'maintain', label: t('profile.maintain') },
        ]}
        value={draft.goal}
        onChange={(goal) => update({ goal, goalWeightKg: goal === 'lose' ? goalKg : draft.goalWeightKg })}
      />
      {draft.goal === 'maintain' ? (
        <Text style={[type.body, styles.muted]}>{t('profile.maintainNote')}</Text>
      ) : (
        <>
          <Stepper
            label={t('profile.goalWeight')}
            value={t('profile.kg', { value: formatNumber(goalKg, 1) })}
            onDecrement={() => update({ goalWeightKg: Math.max(30, round1(goalKg - 0.5)) })}
            onIncrement={() => update({ goalWeightKg: Math.min(draft.weightKg, round1(goalKg + 0.5)) })}
          />
          <Stepper
            label={t('profile.inHowLong')}
            hint={t('profile.until', { date: dateIn(draft.weeks) })}
            value={t('profile.weeksValue', { count: draft.weeks })}
            onDecrement={() => update({ weeks: Math.max(1, draft.weeks - 1) })}
            onIncrement={() => update({ weeks: Math.min(260, draft.weeks + 1) })}
          />
          <View style={styles.pace}>
            <Text style={[type.body, styles.ink]}>{t('profile.pace')}</Text>
            <Text style={[type.title, styles.ink]}>
              {t('profile.paceValue', { value: formatNumber(pace.kgPerWeek, 2) })}
            </Text>
          </View>
          {pace.tooFast && pace.suggestedWeeks !== null ? (
            <View style={styles.caveat}>
              <Text style={[type.body, styles.warning]}>{t('profile.tooFast', { max: maxKg })}</Text>
              <Button
                variant="secondary"
                label={t('profile.useWeeks', {
                  weeks: pace.suggestedWeeks,
                  date: dateIn(pace.suggestedWeeks),
                })}
                onPress={() => update({ weeks: pace.suggestedWeeks ?? draft.weeks })}
              />
            </View>
          ) : (
            <Text style={[type.caption, styles.muted]}>{t('profile.safePace', { max: maxKg })}</Text>
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pace: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: color.green50,
    borderRadius: radius.chip,
    padding: space.md,
  },
  caveat: { backgroundColor: '#FBF3DC', borderRadius: radius.chip, padding: space.md, gap: space.sm },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  warning: { color: color.warningText },
});
