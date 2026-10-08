import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { formatNumber } from '@/lib/format';
import { color, type } from '@/lib/theme';
import { Segmented } from '../components/Segmented';
import { Stepper } from '../components/Stepper';
import type { Draft } from '../draft';

export interface StepProps {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Sex, age, height and today's weight: the BMR inputs (F01). Also used to edit "Body" in Profile. */
export function BodyStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={[type.label, { color: color.ink }]}>
        {t('profile.sex')} <Text style={{ color: color.inkMuted }}>({t('profile.sexWhy')})</Text>
      </Text>
      <Segmented
        options={[
          { value: 'male', label: t('profile.male') },
          { value: 'female', label: t('profile.female') },
        ]}
        value={draft.sex}
        onChange={(sex) => update({ sex })}
      />
      <Stepper
        label={t('profile.age')}
        value={t('profile.ageValue', { count: draft.ageYears })}
        onDecrement={() => update({ ageYears: Math.max(14, draft.ageYears - 1) })}
        onIncrement={() => update({ ageYears: Math.min(100, draft.ageYears + 1) })}
      />
      <Stepper
        label={t('profile.height')}
        value={t('profile.heightValue', { count: draft.heightCm })}
        onDecrement={() => update({ heightCm: Math.max(120, draft.heightCm - 1) })}
        onIncrement={() => update({ heightCm: Math.min(220, draft.heightCm + 1) })}
      />
      <Stepper
        label={t('profile.weightToday')}
        hint={t('profile.weighRule')}
        value={t('profile.kg', { value: formatNumber(draft.weightKg, 1) })}
        onDecrement={() => update({ weightKg: Math.max(30, round1(draft.weightKg - 0.5)) })}
        onIncrement={() => update({ weightKg: Math.min(300, round1(draft.weightKg + 0.5)) })}
      />
    </>
  );
}
