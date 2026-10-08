import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { saveProfile } from '@/features/profile/profile-db';
import { createTestDb } from '@/lib/db/test-db';
import type { Db, RecordEnv } from '@/lib/db/types';

// The routes run on a real in-memory SQLite (same migrations as the phone) instead of the native one.
let mockDb: Db;
const mockEnv: RecordEnv = {
  now: (() => {
    let now = Date.UTC(2026, 9, 8, 12);
    return () => (now += 1000);
  })(),
  randomBytes: (() => {
    let seed = 0;
    return (n: number) => new Uint8Array(n).fill(++seed % 256);
  })(),
};
jest.mock('@/lib/db/DatabaseProvider', () => {
  const actual = jest.requireActual<typeof import('@/lib/db/DatabaseProvider')>('@/lib/db/DatabaseProvider');
  return {
    ...actual,
    DatabaseProvider: ({ children }: { children: ReactNode }) => (
      <actual.DatabaseScope db={mockDb} env={mockEnv}>
        {children}
      </actual.DatabaseScope>
    ),
  };
});

beforeEach(async () => {
  mockDb = await createTestDb();
});

async function tap(name: string | RegExp, times = 1) {
  for (let i = 0; i < times; i++) await fireEvent.press(screen.getByRole('button', { name }));
}

describe('navigation (design N1, F01)', () => {
  it('a fresh install opens on the onboarding', async () => {
    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByRole('header', { name: 'Kawsay' })).toBeOnTheScreen();
  });

  it('finishing the onboarding stores the profile and opens Today; Profile shows the status', async () => {
    await renderRouter('./app', { initialUrl: '/' });
    await screen.findByRole('header', { name: 'Kawsay' });
    await tap('Empezar');
    await tap('Hombre');
    await tap('Más Estatura', 5);
    await tap('Más Peso de hoy', 20);
    await tap('Siguiente', 4);
    await tap('Empezar a registrar');
    expect(await screen.findByRole('header', { name: 'Hoy' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Perfil'));
    expect(await screen.findByText('27.7')).toBeOnTheScreen();
    expect(screen.getByText('Sobrepeso')).toBeOnTheScreen();
  });

  it('with a profile it opens on Today and shows the five tabs in Spanish', async () => {
    await saveProfile(mockDb, mockEnv, {
      sex: 'female',
      heightCm: 160,
      ageYears: 35,
      ageSetOn: '2026-10-08',
      goalWeightKg: null,
      goalDate: null,
      climate: 'warm',
      proteinGPerKg: 1.6,
      fatShare: 0.25,
      movementGoalMin: 30,
      usualSleepStart: '23:00',
      usualSleepEnd: '07:00',
      usualNapStart: null,
      usualNapEnd: null,
      waistEnabled: false,
      waistReminderDay: null,
      symptomsEnabled: false,
      intimateEnabled: false,
    });
    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByRole('header', { name: 'Hoy' })).toBeOnTheScreen();
    await waitFor(() => {
      for (const tab of ['Calendario', 'Registrar', 'Análisis', 'Perfil']) {
        expect(screen.getByText(tab)).toBeOnTheScreen();
      }
    });
  });
});
