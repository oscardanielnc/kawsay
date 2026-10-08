import { TodayScreen } from '@/features/today/TodayScreen';
import { deviceTimeZone } from '@/lib/time-zone';

export default function TodayRoute() {
  return <TodayScreen now={new Date()} timeZone={deviceTimeZone()} />;
}
