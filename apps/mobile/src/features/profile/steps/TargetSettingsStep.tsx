import { FAT_SHARE, PROTEIN_G_PER_KG } from '@kawsay/core/targets/macros';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/lib/format';
import { Stepper } from '@/components/forms/Stepper';
import type { StepProps } from './BodyStep';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;

/** Protein 1.2–2.2 g/kg, fat 20–35 %, daily movement (ADR 0009 ranges, WHO movement). */
export function TargetSettingsStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const protein = (delta: number) =>
    update({ proteinGPerKg: clamp(round(draft.proteinGPerKg + delta, 1), PROTEIN_G_PER_KG.min, PROTEIN_G_PER_KG.max) });
  const fat = (delta: number) =>
    update({ fatShare: clamp(round(draft.fatShare + delta, 2), FAT_SHARE.min, FAT_SHARE.max) });
  const movement = (delta: number) => update({ movementGoalMin: clamp(draft.movementGoalMin + delta, 10, 180) });
  return (
    <>
      <Stepper
        label={t('profile.protein')}
        hint={t('profile.proteinHint')}
        value={t('profile.proteinValue', { value: formatNumber(draft.proteinGPerKg, 1) })}
        onDecrement={() => protein(-0.1)}
        onIncrement={() => protein(0.1)}
      />
      <Stepper
        label={t('profile.fat')}
        hint={t('profile.fatHint')}
        value={t('profile.percent', { value: formatNumber(draft.fatShare * 100) })}
        onDecrement={() => fat(-0.01)}
        onIncrement={() => fat(0.01)}
      />
      <Stepper
        label={t('profile.movement')}
        hint={t('profile.movementHint')}
        value={t('profile.minutes', { count: draft.movementGoalMin })}
        onDecrement={() => movement(-5)}
        onIncrement={() => movement(5)}
      />
    </>
  );
}
