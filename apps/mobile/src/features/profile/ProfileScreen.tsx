import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/components/feedback/ComingSoon';

export function ProfileScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.profile')} />;
}
