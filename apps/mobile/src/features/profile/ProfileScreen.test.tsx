import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { addDays } from '@kawsay/core/shared/local-date';
import '@/lib/i18n';
import type { Profile } from './profile-db';
import { ProfileScreen } from './ProfileScreen';

const today = '2026-10-08';
const profile: Profile = {
  id: 'p1',
  updatedAt: 1,
  deletedAt: null,
  sex: 'male',
  heightCm: 170,
  ageYears: 30,
  ageSetOn: '2026-10-08',
  goalWeightKg: null,
  goalDate: null,
  climate: 'temperate',
  proteinGPerKg: 1.8,
  fatShare: 0.3,
  movementGoalMin: 30,
  usualSleepStart: '23:00',
  usualSleepEnd: '07:00',
  usualNapStart: null,
  usualNapEnd: null,
  waistEnabled: false,
  waistReminderDay: null,
  symptomsEnabled: false,
  intimateEnabled: false,
  expenditureFactor: 1,
};
const steady = [{ date: '2026-10-08', kg: 80 }];

describe('ProfileScreen (F01)', () => {
  it('80 kg and 170 cm show BMI 27.7, "Sobrepeso", and −8.0 kg to the green range', async () => {
    await render(<ProfileScreen today={today} profile={profile} weights={steady} onSave={jest.fn()} />);
    const status = screen.getByLabelText('Tu estado hoy');
    expect(within(status).getByText('27.7')).toBeOnTheScreen();
    expect(within(status).getByText('Sobrepeso')).toBeOnTheScreen();
    expect(within(status).getByText(/−8\.0 kg/)).toBeOnTheScreen();
  });

  it('BMI uses the weight trend: one heavy day barely moves it', async () => {
    const weights = [
      ...Array.from({ length: 20 }, (_, i) => ({ date: addDays('2026-09-18', i), kg: 80 })),
      { date: '2026-10-08', kg: 83 },
    ];
    await render(<ProfileScreen today={today} profile={profile} weights={weights} onSave={jest.fn()} />);
    expect(within(screen.getByLabelText('Tu estado hoy')).getByText('27.8')).toBeOnTheScreen();
  });

  it('shows the daily target from the stored settings', async () => {
    await render(
      <ProfileScreen
        today={today}
        profile={{ ...profile, proteinGPerKg: 1.6, fatShare: 0.25 }}
        weights={steady}
        onSave={jest.fn()}
      />,
    );
    expect(screen.getByText('2,393 kcal')).toBeOnTheScreen();
  });

  it('editing the climate saves it and keeps the protein and fat settings', async () => {
    const onSave = jest.fn();
    await render(<ProfileScreen today={today} profile={profile} weights={steady} onSave={onSave} />);
    await fireEvent.press(screen.getByRole('button', { name: /Clima/ }));
    await fireEvent.press(screen.getByRole('button', { name: /Frío/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    const [[saved]] = onSave.mock.calls as [[{ profile: Record<string, unknown> }]];
    expect(saved.profile).toMatchObject({ climate: 'cold', proteinGPerKg: 1.8, fatShare: 0.3 });
  });
});
