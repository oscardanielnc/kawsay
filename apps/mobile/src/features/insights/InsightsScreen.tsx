import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/components/feedback/ComingSoon';

export function InsightsScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.insights')} />;
}
