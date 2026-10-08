import { addDays } from '@kawsay/core/shared/local-date';
import { useCallback, useState } from 'react';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { getProfile, saveProfile, type ProfileInput } from '@/features/profile/profile-db';
import { saveWeight, weightsBetween } from '@/features/weight/weight-db';
import { useDb } from '@/lib/db/DatabaseProvider';
import { inTransaction } from '@/lib/db/transaction';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';
import { useLoad } from '@/lib/use-load';

/** Days of weights read for the trend: the EMA forgets older days (0.9^120 < 0.000004). */
const TREND_DAYS = 120;

export default function ProfileRoute() {
  const { db, env } = useDb();
  const [day] = useState(today);
  const { data, reload } = useLoad(
    useCallback(async () => {
      const [profile, weights] = await Promise.all([
        getProfile(db),
        weightsBetween(db, addDays(day, -TREND_DAYS), day),
      ]);
      return { profile, weights };
    }, [db, day]),
  );
  const save = async ({ profile, weightKg }: { profile: ProfileInput; weightKg?: number }) => {
    await inTransaction(db, async () => {
      await saveProfile(db, env, profile);
      if (weightKg !== undefined)
        await saveWeight(db, env, { date: day, kg: weightKg, timeZone: deviceTimeZone() });
    });
    reload();
  };
  if (!data?.profile) return null;
  return (
    <ProfileScreen
      today={day}
      profile={data.profile}
      weights={data.weights}
      onSave={(change) => void save(change)}
    />
  );
}
