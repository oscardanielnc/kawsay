import { router } from 'expo-router';
import { useState } from 'react';
import { OnboardingScreen } from '@/features/profile/OnboardingScreen';
import { saveProfile, type ProfileInput } from '@/features/profile/profile-db';
import { saveWeight } from '@/features/weight/weight-db';
import { useDb } from '@/lib/db/DatabaseProvider';
import { inTransaction } from '@/lib/db/transaction';
import { deviceTimeZone } from '@/lib/time-zone';
import { today } from '@/lib/today';

/** First use: the profile and today's weight are stored together, then the app opens on Today. */
export default function OnboardingRoute() {
  const { db, env } = useDb();
  const [day] = useState(today);
  const finish = async ({ profile, weightKg }: { profile: ProfileInput; weightKg: number }) => {
    await inTransaction(db, async () => {
      await saveProfile(db, env, profile);
      await saveWeight(db, env, { date: day, kg: weightKg, timeZone: deviceTimeZone() });
    });
    router.replace('/');
  };
  return <OnboardingScreen today={day} onFinish={(result) => void finish(result)} />;
}
