import { addDays } from '@kawsay/core/shared/local-date';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { TREND_DAYS } from '@/compose/day';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { getProfile, saveProfile, type ProfileInput } from '@/features/profile/profile-db';
import { latestWaist } from '@/features/waist/waist-db';
import { saveWeight, weightsBetween } from '@/features/weight/weight-db';
import { useDb } from '@/lib/db/DatabaseProvider';
import { inTransaction } from '@/lib/db/transaction';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';
import { useLoad } from '@/lib/use-load';
import { useReloadOnFocus } from '@/lib/use-reload-on-focus';

export default function ProfileRoute() {
  const { db, env } = useDb();
  const [day] = useState(today);
  const { data, reload } = useLoad(
    useCallback(async () => {
      const [profile, weights, waist] = await Promise.all([
        getProfile(db),
        weightsBetween(db, addDays(day, -TREND_DAYS), day),
        latestWaist(db),
      ]);
      return { profile, weights, waist };
    }, [db, day]),
  );
  useReloadOnFocus(reload);
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
      waistCm={data.waist?.cm ?? null}
      onExport={() => router.push('/export')}
      onSave={(change) => void save(change)}
    />
  );
}
