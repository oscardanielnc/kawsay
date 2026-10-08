import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/components/feedback/ComingSoon';

export function CalendarScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.calendar')} />;
}
