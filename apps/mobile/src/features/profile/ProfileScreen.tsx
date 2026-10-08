import { referenceWeightKg } from '@kawsay/core/targets/macros';
import type { LocalDate } from '@kawsay/core/shared/local-date';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatNumber, formatShortDate } from '@/lib/format';
import { color, space, type } from '@/lib/theme';
import { Card } from '@/components/layout/Card';
import { Sheet } from '@/components/feedback/Sheet';
import { SettingsRow } from './components/SettingsRow';
import { StatusCard } from './components/StatusCard';
import { TargetCard } from './components/TargetCard';
import { profileToDraft, toProfileInput, type Draft } from './draft';
import type { Profile, ProfileInput } from './profile-db';
import { profileTargets, trendWeightKg, usualSleepHours } from './profile-targets';
import { BodyStep } from './steps/BodyStep';
import { GoalStep } from './steps/GoalStep';
import { ModulesStep } from './steps/ModulesStep';
import { ClimateBlock, SleepBlock } from './steps/PlaceSleepStep';
import { TargetSettingsStep } from './steps/TargetSettingsStep';

type Editor = 'body' | 'goal' | 'targets' | 'climate' | 'sleep' | 'modules' | 'about';

interface Props {
  today: LocalDate;
  profile: Profile;
  weights: readonly { date: LocalDate; kg: number }[];
  /** `weightKg` only when the body editor changed today's weight. */
  onSave: (change: { profile: ProfileInput; weightKg?: number }) => void;
}

/** Profile tab (F01): status today, daily target, and the settings that feed every target. */
export function ProfileScreen({ today, profile, weights, onSave }: Props) {
  const { t } = useTranslation();
  const weightKg = trendWeightKg(weights) ?? 0;
  const [editor, setEditor] = useState<Editor | null>(null);
  const [draft, setDraft] = useState<Draft>(() => profileToDraft(profile, today, weightKg));
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const open = (next: Editor) => {
    setDraft(profileToDraft(profile, today, weightKg));
    setEditor(next);
  };
  const done = () => {
    if (editor && editor !== 'about') {
      onSave({ profile: toProfileInput(draft, today), ...(editor === 'body' && { weightKg: draft.weightKg }) });
    }
    setEditor(null);
  };

  const climateName = t(`profile.${profile.climate}`);
  const rows: { key: Editor; icon: string; summary: string }[] = [
    {
      key: 'body',
      icon: '🧍',
      summary: t('profile.bodySummary', {
        sex: t(`profile.${profile.sex}`),
        age: draft.ageYears,
        cm: profile.heightCm,
        kg: formatNumber(weightKg, 1),
      }),
    },
    {
      key: 'goal',
      icon: '🎯',
      summary:
        profile.goalWeightKg === null || profile.goalDate === null
          ? t('profile.maintainSummary')
          : t('profile.goalSummary', { kg: formatNumber(profile.goalWeightKg, 1), date: formatShortDate(profile.goalDate) }),
    },
    {
      key: 'targets',
      icon: '⚙️',
      summary: t('profile.targetsSummary', {
        protein: formatNumber(profile.proteinGPerKg, 1),
        fat: formatNumber(profile.fatShare * 100),
        minutes: profile.movementGoalMin,
      }),
    },
    { key: 'climate', icon: climateName.split(' ')[0] ?? '', summary: climateName },
    {
      key: 'sleep',
      icon: '🌙',
      summary: `${profile.usualSleepStart} → ${profile.usualSleepEnd}${profile.usualNapStart ? ` · ${t('profile.napShort', { time: profile.usualNapStart })}` : ''}`,
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[type.title, styles.ink]}>
          {t('tabs.profile')}
        </Text>
        <Text style={[type.caption, styles.muted]}>{t('profile.localOnly')}</Text>
        <StatusCard weightKg={weightKg} heightCm={profile.heightCm} goalWeightKg={profile.goalWeightKg} />
        <TargetCard
          targets={profileTargets(profile, today, weightKg)}
          movementGoalMin={profile.movementGoalMin}
          awakeHours={24 - usualSleepHours(profile)}
          proteinGPerKg={profile.proteinGPerKg}
          fatShare={profile.fatShare}
          referenceWeightKg={referenceWeightKg({ weightKg, heightCm: profile.heightCm })}
        />
        <Card title={t('profile.you')}>
          {rows.map((row) => (
            <SettingsRow key={row.key} icon={row.icon} title={t(`profile.editors.${row.key}`)} summary={row.summary} onPress={() => open(row.key)} />
          ))}
        </Card>
        <Card title={t('profile.logging')}>
          <SettingsRow icon="🧩" title={t('profile.editors.modules')} summary={t('profile.modulesSummary', { waist: t(profile.waistEnabled ? 'profile.yes' : 'profile.no'), symptoms: t(profile.symptomsEnabled ? 'profile.yes' : 'profile.no'), intimate: t(profile.intimateEnabled ? 'profile.yes' : 'profile.no') })} onPress={() => open('modules')} />
        </Card>
        <Card title={t('profile.yourData')}>
          <SettingsRow icon="📚" title={t('profile.editors.about')} summary={t('profile.aboutSummary')} onPress={() => open('about')} />
        </Card>
      </ScrollView>
      <Sheet title={editor ? t(`profile.editors.${editor}`) : null} onDone={done}>
        {editor === 'body' ? <BodyStep draft={draft} update={update} /> : null}
        {editor === 'goal' ? <GoalStep draft={draft} update={update} today={today} /> : null}
        {editor === 'targets' ? <TargetSettingsStep draft={draft} update={update} /> : null}
        {editor === 'climate' ? <ClimateBlock draft={draft} update={update} /> : null}
        {editor === 'sleep' ? <SleepBlock draft={draft} update={update} /> : null}
        {editor === 'modules' ? <ModulesStep draft={draft} update={update} /> : null}
        {editor === 'about' ? <Text style={[type.body, styles.ink]}>{t('profile.aboutBody')}</Text> : null}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
