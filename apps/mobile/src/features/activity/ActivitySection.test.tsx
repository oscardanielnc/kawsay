import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { ActivitySection, type ActivityView } from './ActivitySection';

const bmrKcal = 1717.5;

function renderSection(overrides: Partial<Parameters<typeof ActivitySection>[0]> = {}) {
  const props = {
    entries: [] as ActivityView[],
    noActivity: false,
    bmrKcal,
    defaultBand: 'morning' as const,
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onNoActivity: jest.fn(),
    ...overrides,
  };
  return { ...props, rendered: render(<ActivitySection {...props} />) };
}

describe('ActivitySection (F08)', () => {
  it('30 min of stairs shows its extra kcal before saving, then adds it', async () => {
    const { onAdd, rendered } = renderSection();
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: '+ Agregar actividad' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Escaleras' }));
    await fireEvent.press(screen.getByRole('button', { name: "30′" }));
    expect(screen.getByText(/\+228 kcal · MET 6\.8/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar' }));
    expect(onAdd).toHaveBeenCalledWith({ kind: 'stairs', intensity: 'medium', minutes: 30, met: 6.8, timeBand: 'morning' });
  });

  it('the ⓘ explains the formula', async () => {
    const { rendered } = renderSection();
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: '+ Agregar actividad' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Escaleras' }));
    await fireEvent.press(screen.getByRole('button', { name: 'ⓘ cómo se calcula' }));
    expect(screen.getByText(/\(MET − 1\) × \(basal ÷ 24\) × horas × 1\.10/)).toBeOnTheScreen();
  });

  it('choosing "No physical activity" hides adding (F08)', async () => {
    const { rendered } = renderSection({ noActivity: true });
    await rendered;
    expect(screen.queryByRole('button', { name: '+ Agregar actividad' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Sin actividad física/ })).toBeOnTheScreen();
  });

  it('"No physical activity" is offered only while nothing is logged, and toggles', async () => {
    const { onNoActivity, rendered } = renderSection();
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: /Sin actividad física/ }));
    expect(onNoActivity).toHaveBeenCalledWith(true);
  });

  it('a logged activity shows its minutes, intensity, band and kcal, and can be removed', async () => {
    const entry: ActivityView = {
      id: 'a1',
      name: 'Escaleras',
      icon: 'stairs',
      minutes: 30,
      intensity: 'medium',
      timeBand: 'morning',
      kcal: 228.28,
    };
    const { onDelete, rendered } = renderSection({ entries: [entry] });
    await rendered;
    expect(screen.getByText("30′ · Media · Mañana · +228 kcal")).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Sin actividad física/ })).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar Escaleras' }));
    expect(onDelete).toHaveBeenCalledWith('a1');
  });
});
