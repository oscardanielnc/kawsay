import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { CalendarScreen, type CalendarDay } from './CalendarScreen';

const day = (date: string, over: Partial<CalendarDay> = {}): CalendarDay => ({
  date,
  colour: 'green',
  kcal: 1850,
  targetKcal: 1900,
  proteinG: 100,
  targetProteinG: 100,
  movementMinutes: 30,
  activity: 'logged',
  glasses: 8,
  bloating: 'usual',
  weightKg: null,
  trendKg: null,
  ...over,
});
const days = [
  day('2026-10-01'),
  day('2026-10-02', { colour: 'yellow', kcal: 2250 }),
  day('2026-10-03', {
    colour: 'grey',
    kcal: 0,
    proteinG: 0,
    movementMinutes: 0,
    activity: 'missing',
    glasses: 0,
    bloating: null,
  }),
  day('2026-10-04', { colour: 'red', activity: 'none' }),
];
const props = {
  month: '2026-10',
  today: '2026-10-04',
  days,
  onMonth: jest.fn(),
  onOpenDay: jest.fn(),
};

describe('CalendarScreen (F14, design S1)', () => {
  it('each day is a band with its status in words too, so colour is never alone', async () => {
    await render(<CalendarScreen {...props} />);
    expect(screen.getByRole('header', { name: 'octubre de 2026' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '1 de octubre: Bien' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '2 de octubre: Casi' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '3 de octubre: Sin datos' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '4 de octubre: Fuera de rango' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^20 de octubre/ })).toBeNull();
    expect(screen.getByText('1 Bien · 1 Casi · 1 Fuera · 1 Sin datos')).toBeOnTheScreen();
  });

  it('tapping a day opens its summary and "Open this day"', async () => {
    const onOpenDay = jest.fn();
    await render(<CalendarScreen {...props} onOpenDay={onOpenDay} />);
    await fireEvent.press(screen.getByRole('button', { name: '2 de octubre: Casi' }));
    expect(screen.getByText('2,250 kcal · Algo fuera')).toBeOnTheScreen();
    expect(screen.getByText('100 g · En rango')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir este día' }));
    expect(onOpenDay).toHaveBeenCalledWith('2026-10-02');
  });

  it('a grey day says it is not red, just unlogged', async () => {
    await render(<CalendarScreen {...props} />);
    await fireEvent.press(screen.getByRole('button', { name: '3 de octubre: Sin datos' }));
    expect(
      screen.getByText('No registraste este día. Un día sin datos es gris, no rojo.'),
    ).toBeOnTheScreen();
  });

  it('moves between months, never past the current one', async () => {
    const onMonth = jest.fn();
    await render(<CalendarScreen {...props} onMonth={onMonth} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(onMonth).toHaveBeenCalledWith('2026-09');
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled();
  });

  it('the monthly chart switches metric with chips and reads its summary aloud', async () => {
    await render(<CalendarScreen {...props} />);
    expect(screen.getByLabelText('Calorías: 2 de 3 días en su rango')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Movimiento' }));
    expect(screen.getByLabelText('Movimiento: 90 min en el mes')).toBeOnTheScreen();
  });
});
