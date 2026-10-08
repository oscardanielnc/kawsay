import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { color, type } from '@/lib/theme';
import { Card } from '@/components/layout/Card';
import { Segmented } from '@/components/forms/Segmented';
import { Stepper } from '@/components/forms/Stepper';
import { Toggle } from '@/components/forms/Toggle';
import { shiftTime } from '../draft';
import type { StepProps } from './BodyStep';

const STEP_MIN = 15;

/** Climate where the user lives: it changes the drinks goal only (F01, F10). */
export function ClimateBlock({ draft, update }: StepProps) {
  const { t } = useTranslation();
  return (
    <>
      <Segmented
        options={[
          { value: 'warm', label: t('profile.warm'), hint: t('profile.warmHint') },
          { value: 'temperate', label: t('profile.temperate'), hint: t('profile.baseHint') },
          { value: 'cold', label: t('profile.cold'), hint: t('profile.baseHint') },
        ]}
        value={draft.climate}
        onChange={(climate) => update({ climate })}
      />
      <Text style={[type.caption, { color: color.inkMuted }]}>{t('profile.climateNote')}</Text>
    </>
  );
}

/** Usual night and optional nap, which prefill sleep every day (F11). */
export function SleepBlock({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const time = (label: string, value: string, set: (v: string) => void) => (
    <Stepper
      label={label}
      value={value}
      onDecrement={() => set(shiftTime(value, -STEP_MIN))}
      onIncrement={() => set(shiftTime(value, STEP_MIN))}
    />
  );
  return (
    <>
      {time(t('profile.fallAsleep'), draft.sleepStart, (sleepStart) => update({ sleepStart }))}
      {time(t('profile.wakeUp'), draft.sleepEnd, (sleepEnd) => update({ sleepEnd }))}
      <Toggle label={t('profile.napToggle')} value={draft.nap} onChange={(nap) => update({ nap })} />
      {draft.nap ? (
        <>
          {time(t('profile.napFrom'), draft.napStart, (napStart) => update({ napStart }))}
          {time(t('profile.napTo'), draft.napEnd, (napEnd) => update({ napEnd }))}
        </>
      ) : null}
      <Text style={[type.caption, { color: color.inkMuted }]}>{t('profile.sleepNote')}</Text>
    </>
  );
}

export function PlaceSleepStep(props: StepProps) {
  const { t } = useTranslation();
  return (
    <>
      <Card title={t('profile.climate')}>
        <ClimateBlock {...props} />
      </Card>
      <Card title={t('profile.sleep')}>
        <SleepBlock {...props} />
      </Card>
    </>
  );
}
