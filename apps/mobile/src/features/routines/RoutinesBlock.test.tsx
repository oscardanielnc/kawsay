import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import type { Routine } from './routines-db';
import { RoutinesBlock } from './RoutinesBlock';
import { sessionOf } from './session';

const bmrKcal = 1717.5;
const routine: Routine = {
  id: 'r1',
  name: 'Fuerza A + escaleras',
  restSeconds: 75,
  exercises: [
    { name: 'Sentadilla goblet', exercise: { kind: 'weights', sets: 3, reps: 15, secondsPerRep: 4, intensity: 'light' } },
    { name: 'Escaleras 1.º → 3.º', exercise: { kind: 'stairs', laps: 4, lapSeconds: 70 } },
  ],
};

function renderBlock(routines: Routine[] = [routine]) {
  const props = { routines, bmrKcal, defaultBand: 'morning' as const, onLog: jest.fn(), onSave: jest.fn(), onDelete: jest.fn() };
  return { ...props, rendered: render(<RoutinesBlock {...props} />) };
}

describe('RoutinesBlock (F18)', () => {
  it('logging a routine at 75% records 75% of its minutes and calories', async () => {
    const { onLog, rendered } = renderBlock();
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: /Fuerza A \+ escaleras/ }));
    await fireEvent.press(screen.getByRole('button', { name: '75%' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    const full = sessionOf(routine, { completion: 1 }, bmrKcal);
    const [[logged]] = onLog.mock.calls as [[{ minutes: number; met: number; share: number }]];
    expect(logged.share).toBe(0.75);
    expect(logged.minutes).toBeCloseTo(full.minutes * 0.75, 10);
  });

  it('adjusting stairs from 4 to 6 laps adds 2 × lap time', async () => {
    const { onLog, rendered } = renderBlock();
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: /Fuerza A \+ escaleras/ }));
    await fireEvent.press(screen.getByRole('switch', { name: /Ajustar por ejercicio/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Más Escaleras 1.º → 3.º' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Más Escaleras 1.º → 3.º' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    const planned = sessionOf(routine, { completion: 1 }, bmrKcal);
    const [[logged]] = onLog.mock.calls as [[{ minutes: number }]];
    expect(logged.minutes - planned.minutes).toBeCloseTo((2 * 70) / 60, 10);
  });

  it('creates a routine from exercise templates', async () => {
    const { onSave, rendered } = renderBlock([]);
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: 'Gestionar' }));
    await fireEvent.press(screen.getByRole('button', { name: '+ Crear rutina' }));
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Escaleras + core');
    await fireEvent.press(screen.getByRole('button', { name: '+ Ejercicio' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Escaleras/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar rutina' }));
    const [[saved]] = onSave.mock.calls as [[{ name: string; restSeconds: number; exercises: unknown[] }]];
    expect(saved).toMatchObject({ name: 'Escaleras + core', restSeconds: 75 });
    expect(saved.exercises).toEqual([{ name: 'Escaleras', exercise: { kind: 'stairs', laps: 8, lapSeconds: 70 } }]);
  });

  it('the editor explains each MET with its Compendium code', async () => {
    const { rendered } = renderBlock();
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: 'Gestionar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Editar Fuerza A + escaleras' }));
    await fireEvent.press(screen.getByRole('button', { name: 'ⓘ ¿Cómo se calcula?' }));
    expect(screen.getByText(/Sentadilla goblet · MET 3\.5 · 02054/)).toBeOnTheScreen();
    expect(screen.getByText(/Escaleras 1\.º → 3\.º · MET 7\.5 · 17138/)).toBeOnTheScreen();
  });

  it('measures one stairs lap with the stopwatch and reuses it', async () => {
    jest.useFakeTimers();
    const { onSave, rendered } = renderBlock();
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: 'Gestionar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Editar Fuerza A + escaleras' }));
    await fireEvent.press(screen.getByRole('button', { name: /Escaleras 1\.º → 3\.º/ }));
    await fireEvent.press(screen.getByRole('button', { name: '⏱ Medir una vuelta' }));
    await act(() => {
      jest.advanceTimersByTime(65_000);
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Listo, volví' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar rutina' }));
    jest.useRealTimers();
    const [[saved]] = onSave.mock.calls as [[{ exercises: { exercise: { lapSeconds?: number } }[] }]];
    expect(saved.exercises[1]?.exercise.lapSeconds).toBe(65);
  });
});
