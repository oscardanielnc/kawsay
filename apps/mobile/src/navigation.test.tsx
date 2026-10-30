import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { addDays } from '@kawsay/core/shared/local-date';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import catalog from '@kawsay/catalog/catalog.json';
import { setNoActivity } from '@/features/activity/activity-db';
import { addIntimate } from '@/features/private/private-db';
import { saveProfile } from '@/features/profile/profile-db';
import { saveWeight } from '@/features/weight/weight-db';
import { loadCatalog } from '@/lib/db/catalog';
import { createTestDb } from '@/lib/db/test-db';
import type { Db, RecordEnv } from '@/lib/db/types';
import type { AccountState } from '@/lib/sync/account';
import { today } from '@/lib/today';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: () => Promise.resolve(3),
  authenticateAsync: () => Promise.resolve({ success: true }),
}));

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
  const actual = jest.requireActual<typeof import('@/lib/db/DatabaseProvider')>(
    '@/lib/db/DatabaseProvider',
  );
  return {
    ...actual,
    DatabaseProvider: ({ children }: { children: ReactNode }) => (
      <actual.DatabaseScope db={mockDb} env={mockEnv}>
        {children}
      </actual.DatabaseScope>
    ),
  };
});

// Sync talks to the network; the routes get a stand-in that keeps the account state in memory.
let mockStartAccount: AccountState = { kind: 'local-only' };
jest.mock('@/lib/sync/SyncProvider', () => {
  const actual =
    jest.requireActual<typeof import('@/lib/sync/SyncProvider')>('@/lib/sync/SyncProvider');
  const { useState } = jest.requireActual<typeof import('react')>('react');
  return {
    ...actual,
    SyncProvider: ({ children }: { children: ReactNode }) => {
      const [account, setAccount] = useState<AccountState>(mockStartAccount);
      return (
        <actual.SyncScope
          value={{
            account,
            status: 'idle',
            pending: 0,
            signIn: (email) => {
              setAccount({ kind: 'signed-in', userId: 'u1', email, lastSyncedAt: null });
              return Promise.resolve('ok');
            },
            useWithoutAccount: () => {
              setAccount({ kind: 'local-only' });
              return Promise.resolve();
            },
            signOut: () => {
              setAccount({ kind: 'local-only' });
              return Promise.resolve();
            },
            syncNow: () => Promise.resolve(),
            analyze: () => Promise.reject(new Error('offline')),
          }}
        >
          {children}
        </actual.SyncScope>
      );
    },
  };
});

beforeEach(async () => {
  mockStartAccount = { kind: 'local-only' };
  mockDb = await createTestDb();
  await loadCatalog(mockDb, catalog);
});

const profileInput = {
  sex: 'female' as const,
  heightCm: 160,
  ageYears: 35,
  ageSetOn: '2026-10-08',
  goalWeightKg: null,
  goalDate: null,
  climate: 'warm' as const,
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
};

/**
 * renderRouter switches to fake timers; the app reads SQLite in real time, so a findBy on fake timers gives up in a
 * few real milliseconds. Real timers again once the router has mounted.
 */
async function renderApp(options: Parameters<typeof renderRouter>[1]) {
  const view = await renderRouter('./app', options);
  jest.useRealTimers();
  return view;
}

async function tap(name: string | RegExp, times = 1) {
  for (let i = 0; i < times; i++) await fireEvent.press(screen.getByRole('button', { name }));
}

describe('navigation (design N1, F01)', () => {
  it('the first open asks to sign in; using the phone alone goes on to the onboarding (F02)', async () => {
    mockStartAccount = { kind: 'undecided' };
    await renderApp({ initialUrl: '/' });
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
    await tap('Usar sin cuenta por ahora');
    expect(await screen.findByRole('button', { name: 'Empezar' })).toBeOnTheScreen();
  });

  it('signing in on the first open goes to Today when the history brought a profile (F02)', async () => {
    mockStartAccount = { kind: 'undecided' };
    await saveProfile(mockDb, mockEnv, profileInput);
    await saveWeight(mockDb, mockEnv, { date: today(), kg: 70, timeZone: 'America/Lima' });
    await renderApp({ initialUrl: '/' });
    await fireEvent.changeText(await screen.findByLabelText('Correo'), 'oscar@kawsay.test');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secret');
    await tap('Entrar');
    expect(await screen.findByRole('header', { name: 'Hoy' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Perfil'));
    await tap(/Cuenta y sincronización/);
    expect(await screen.findByText('Entraste como oscar@kawsay.test')).toBeOnTheScreen();
  });

  it('a fresh install opens on the onboarding', async () => {
    await renderApp({ initialUrl: '/' });
    expect(await screen.findByRole('header', { name: 'Kawsay' })).toBeOnTheScreen();
  });

  it('finishing the onboarding stores the profile and opens Today; Profile shows the status', async () => {
    await renderApp({ initialUrl: '/' });
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
    await saveProfile(mockDb, mockEnv, profileInput);
    await renderApp({ initialUrl: '/' });
    expect(await screen.findByRole('header', { name: 'Hoy' })).toBeOnTheScreen();
    await waitFor(() => {
      for (const tab of ['Calendario', 'Análisis', 'Perfil']) {
        expect(screen.getByText(tab)).toBeOnTheScreen();
      }
      expect(screen.getByRole('button', { name: 'Registrar' })).toBeOnTheScreen();
    });
  });

  it('a dish added on Today appears as a chip in its meal, and survives reopening the app (F05)', async () => {
    await saveProfile(mockDb, mockEnv, profileInput);
    const first = await renderApp({ initialUrl: '/' });
    await tap('Agregar a Almuerzo');
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'lomo');
    await tap(/Lomo saltado/);
    await tap('Agregar 1 ración');
    expect(await screen.findByRole('button', { name: '1 Lomo saltado' })).toBeOnTheScreen();
    await first.unmount();
    await renderApp({ initialUrl: '/' });
    expect(await screen.findByRole('button', { name: '1 Lomo saltado' })).toBeOnTheScreen();
  });

  it('30 min of stairs raises the day target immediately: the green range of calories moves up (F08)', async () => {
    await saveProfile(mockDb, mockEnv, profileInput);
    await saveWeight(mockDb, mockEnv, { date: today(), kg: 70, timeZone: 'America/Lima' });
    await renderApp({ initialUrl: '/' });
    const greenFrom = async () => {
      const track = await screen.findByLabelText(/^Calorías: /);
      const label = String(track.props.accessibilityLabel);
      return Number(/Rango ([\d,]+)/.exec(label)?.[1]?.replace(',', ''));
    };
    const before = await greenFrom();
    await tap('+ Agregar actividad');
    await tap('Escaleras');
    await tap('Agregar');
    expect(await screen.findByText('Escaleras')).toBeOnTheScreen();
    await waitFor(async () => expect(await greenFrom()).toBeGreaterThan(before));
    expect(screen.getByRole('button', { name: 'Actividad: registrado' })).toBeOnTheScreen();
  });

  it('hydration, body and sleep fill their parts of the day checklist, and a breakfast juice shows in hydration (F10, F11, F05)', async () => {
    await saveProfile(mockDb, mockEnv, profileInput);
    await saveWeight(mockDb, mockEnv, { date: today(), kg: 70, timeZone: 'America/Lima' });
    await renderApp({ initialUrl: '/' });
    expect(await screen.findByText('1 de 6')).toBeOnTheScreen();
    await tap('Clara');
    expect(await screen.findByRole('button', { name: 'Agua: registrado' })).toBeOnTheScreen();
    await tap('Calidad Buena');
    expect(await screen.findByRole('button', { name: 'Sueño: registrado' })).toBeOnTheScreen();
    await tap('No fui hoy');
    await tap('Máximo estrés que sentiste hoy: Poco');
    await tap('Energía: Buena');
    await tap('Ánimo: Bien');
    expect(
      await screen.findByRole('button', { name: 'Cuerpo y ánimo: registrado' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('4 de 6')).toBeOnTheScreen();
    await tap('Agregar a Desayuno');
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'jugo de papaya');
    await tap(/Jugo de papaya/);
    await tap('Agregar 1 ración');
    await tap('Anotar bebidas ▾');
    expect(await screen.findByText(/^Jugo de papaya · del desayuno · /)).toBeOnTheScreen();
  });

  it('editing a day recolours it in the calendar; "Open this day" goes to that day (F14)', async () => {
    const day = today();
    const name = new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${day}T12:00:00Z`));
    await saveProfile(mockDb, mockEnv, profileInput);
    await saveWeight(mockDb, mockEnv, { date: addDays(day, -7), kg: 70, timeZone: 'America/Lima' });
    await setNoActivity(mockDb, mockEnv, day, true);
    await renderApp({ initialUrl: '/' });
    await screen.findByRole('header', { name: 'Hoy' });
    await fireEvent.press(screen.getByText('Calendario'));
    await tap(`${name}: Fuera de rango`);
    await tap('Abrir este día');
    await tap(/^Sin actividad física\./);
    await fireEvent.press(screen.getByText('Calendario'));
    expect(await screen.findByRole('button', { name: `${name}: Sin datos` })).toBeOnTheScreen();
  });

  it('a dish built in the app is saved and logged with one tap at portion 1, then offered again (F07)', async () => {
    await saveProfile(mockDb, mockEnv, profileInput);
    await renderApp({ initialUrl: '/' });
    await tap('Agregar a Almuerzo');
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'Huevos de la casa');
    await tap('+ Crear plato "Huevos de la casa"');
    await tap('+ Ingrediente');
    await fireEvent.changeText(screen.getByLabelText('Buscar ingrediente'), 'huevo');
    await tap('Huevo de gallina');
    await tap('Listo');
    await tap('Guardar y agregar 1 ración');
    expect(await screen.findByRole('button', { name: '1 Huevos de la casa' })).toBeOnTheScreen();
    await tap('Agregar a Cena');
    expect(await screen.findByRole('button', { name: 'Huevos de la casa' })).toBeOnTheScreen();
  });

  it('the private log appears in no screen until it is unlocked (F12)', async () => {
    await saveProfile(mockDb, mockEnv, { ...profileInput, intimateEnabled: true });
    await addIntimate(mockDb, mockEnv, { date: today(), timeZone: 'America/Lima', kind: 'sex' });
    await renderApp({ initialUrl: '/' });
    await screen.findByText('Privado');
    expect(screen.queryByText(/Relación sexual/)).toBeNull();
    await fireEvent.press(screen.getByText('Calendario'));
    expect(screen.queryByText(/Relación sexual/)).toBeNull();
    await fireEvent.press(screen.getByText('Hoy'));
    await tap('Desbloquear con tu huella o PIN');
    expect(await screen.findByRole('button', { name: 'Quitar Relación sexual' })).toBeOnTheScreen();
  });
});
