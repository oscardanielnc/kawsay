import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { OnboardingScreen } from './OnboardingScreen';

const today = '2026-10-08';

async function tap(name: string | RegExp) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

async function tapTimes(name: string, times: number) {
  for (let i = 0; i < times; i++) await tap(name);
}

/** From the defaults (30 years, 165 cm, 70 kg) to 80 kg and 170 cm, male. */
async function fillBody() {
  await tap('Empezar');
  await tap('Hombre');
  await tapTimes('Más Estatura', 5);
  await tapTimes('Más Peso de hoy', 20);
}

describe('OnboardingScreen (F01)', () => {
  it('80 kg, 170 cm, 30 years, male: the daily target appears without further input', async () => {
    await render(<OnboardingScreen today={today} onFinish={jest.fn()} />);
    await fillBody();
    await tapTimes('Siguiente', 4);
    expect(screen.getByRole('header', { name: 'Tu meta diaria' })).toBeOnTheScreen();
    expect(screen.getByText('2,393 kcal')).toBeOnTheScreen();
  });

  it('cannot move past the body step without choosing the sex the formula needs', async () => {
    await render(<OnboardingScreen today={today} onFinish={jest.fn()} />);
    await tap('Empezar');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    await tap('Mujer');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('a goal of −10 kg in 4 weeks warns and offers a later date', async () => {
    await render(<OnboardingScreen today={today} onFinish={jest.fn()} />);
    await fillBody();
    await tap('Siguiente');
    await tap('Bajar de peso');
    await tapTimes('Menos Peso meta', 10); // default goal is 5 kg below: 75 → 70
    await tapTimes('Menos En cuánto tiempo', 8); // 12 → 4 weeks
    expect(screen.getByText(/Más rápido que el 1 % de tu peso por semana/)).toBeOnTheScreen();
    await tap(/Usar 13 semanas/);
    expect(screen.getByText('13 sem')).toBeOnTheScreen();
    expect(screen.queryByText(/Más rápido que el 1 %/)).not.toBeOnTheScreen();
  });

  it('finishing hands over the profile and today’s weight', async () => {
    const onFinish = jest.fn();
    await render(<OnboardingScreen today={today} onFinish={onFinish} />);
    await fillBody();
    await tapTimes('Siguiente', 4);
    await tap('Empezar a registrar');
    const [[result]] = onFinish.mock.calls as [[{ weightKg: number; profile: object }]];
    expect(result.weightKg).toBe(80);
    expect(result.profile).toMatchObject({
      sex: 'male',
      heightCm: 170,
      ageYears: 30,
      ageSetOn: today,
    });
  });
});
