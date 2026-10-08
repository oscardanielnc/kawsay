import type { LocalDate } from '@kawsay/core/shared/local-date';
import { referenceWeightKg } from '@kawsay/core/targets/macros';
import { sleepHours } from '@kawsay/core/profile/profile';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, radius, space, type } from '@/lib/theme';
import { Button } from '@/components/primitives/Button';
import { Card } from '@/components/layout/Card';
import { TargetCard } from './components/TargetCard';
import { draftTargets, initialDraft, toProfileInput, type Draft } from './draft';
import type { ProfileInput } from './profile-db';
import { BodyStep } from './steps/BodyStep';
import { GoalStep } from './steps/GoalStep';
import { ModulesStep } from './steps/ModulesStep';
import { PlaceSleepStep } from './steps/PlaceSleepStep';

interface Props {
  today: LocalDate;
  onFinish: (result: { profile: ProfileInput; weightKg: number }) => void;
}

const LAST = 5;

/**
 * First use (F01): welcome → body → goal → climate and sleep → what to log → daily target. The account step
 * arrives with F02; until then the profile lives on the phone only.
 */
export function OnboardingScreen({ today, onFinish }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const canGoOn = step !== 1 || draft.sex !== null;

  let title = '';
  let body: ReactNode;
  if (step === 0) {
    body = (
      <View style={styles.welcome}>
        <Text accessibilityRole="header" style={[type.display, styles.ink]}>
          {t('onboarding.welcome.title')}
        </Text>
        <Text style={[type.heading, styles.ink]}>{t('onboarding.welcome.tagline')}</Text>
        <Text style={[type.body, styles.muted]}>{t('onboarding.welcome.body')}</Text>
      </View>
    );
  } else if (step === 1) {
    title = t('onboarding.body.title');
    body = (
      <>
        <Text style={[type.body, styles.muted]}>{t('onboarding.body.intro')}</Text>
        <Card>
          <BodyStep draft={draft} update={update} />
        </Card>
      </>
    );
  } else if (step === 2) {
    title = t('onboarding.goal.title');
    body = (
      <Card>
        <GoalStep draft={draft} update={update} today={today} />
      </Card>
    );
  } else if (step === 3) {
    title = t('onboarding.place.title');
    body = <PlaceSleepStep draft={draft} update={update} />;
  } else if (step === 4) {
    title = t('onboarding.modules.title');
    body = (
      <>
        <Card>
          <ModulesStep draft={draft} update={update} />
        </Card>
        <Text style={[type.caption, styles.muted]}>{t('onboarding.modules.later')}</Text>
      </>
    );
  } else {
    title = t('onboarding.target.title');
    body = (
      <>
        <TargetCard
          targets={draftTargets(draft)}
          movementGoalMin={draft.movementGoalMin}
          awakeHours={
            24 -
            sleepHours(
              { start: draft.sleepStart, end: draft.sleepEnd },
              draft.nap ? { start: draft.napStart, end: draft.napEnd } : null,
            )
          }
          proteinGPerKg={1.6}
          fatShare={0.25}
          referenceWeightKg={referenceWeightKg({
            weightKg: draft.weightKg,
            heightCm: draft.heightCm,
          })}
        />
        <Text style={[type.caption, styles.caveat]}>{t('profile.notMedical')}</Text>
      </>
    );
  }

  const next = () =>
    step < LAST
      ? setStep(step + 1)
      : onFinish({ profile: toProfileInput(draft, today), weightKg: draft.weightKg });

  return (
    <SafeAreaView style={styles.screen}>
      {step > 0 ? (
        <View
          style={styles.dots}
          accessibilityLabel={t('onboarding.progress', { step, total: LAST })}
        >
          {Array.from({ length: LAST }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i + 1 === step && styles.dotNow, i + 1 <= step && styles.dotDone]}
            />
          ))}
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>
        {title ? (
          <Text accessibilityRole="header" style={[type.title, styles.ink]}>
            {title}
          </Text>
        ) : null}
        {body}
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 ? (
          <Button
            variant="secondary"
            label={t('onboarding.back')}
            onPress={() => setStep(step - 1)}
          />
        ) : null}
        <View style={styles.grow}>
          <Button
            label={t(
              step === 0
                ? 'onboarding.start'
                : step < LAST
                  ? 'onboarding.next'
                  : 'onboarding.finish',
            )}
            disabled={!canGoOn}
            onPress={next}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md },
  welcome: { paddingTop: 96, alignItems: 'center', gap: space.sm },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: space.md },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: '#D9D4C8' },
  dotNow: { width: 22 },
  dotDone: { backgroundColor: color.brand },
  footer: { flexDirection: 'row', gap: space.sm, padding: space.lg },
  grow: { flex: 1 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  caveat: {
    color: color.ink,
    backgroundColor: '#FBF3DC',
    borderRadius: radius.chip,
    padding: space.md,
  },
});
