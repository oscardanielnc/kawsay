import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/components/feedback/ComingSoon';

export function LogScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.log')} />;
}
