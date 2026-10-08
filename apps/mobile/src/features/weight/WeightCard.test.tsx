import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { WeightCard } from './WeightCard';

const before = [
  { date: '2026-10-05', kg: 71 },
  { date: '2026-10-06', kg: 70.6 },
  { date: '2026-10-07', kg: 70.4 },
];

describe('WeightCard (F03)', () => {
  it('not weighed yet: prefilled with the last weight, with the measuring rule; saving sends the kg', async () => {
    const onSave = jest.fn();
    await render(<WeightCard day="2026-10-08" weights={before} onSave={onSave} />);
    expect(screen.getByText('70.4 kg')).toBeOnTheScreen();
    expect(screen.getByText(/Al despertar, después del baño y antes de comer/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Más Peso de hoy' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar peso' }));
    expect(onSave).toHaveBeenCalledWith(70.5);
  });

  it('weighed today: shows the weight next to its trend; editing replaces it', async () => {
    const onSave = jest.fn();
    await render(
      <WeightCard
        day="2026-10-08"
        weights={[...before, { date: '2026-10-08', kg: 72 }]}
        onSave={onSave}
      />,
    );
    expect(screen.getByText('72.0 kg')).toBeOnTheScreen();
    expect(screen.getByText('Tendencia 71.0 kg')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Editar peso' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Menos Peso de hoy' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar peso' }));
    expect(onSave).toHaveBeenCalledWith(71.9);
  });

  it('the chart reads the trend aloud, not every raw value', async () => {
    await render(<WeightCard day="2026-10-08" weights={before} onSave={jest.fn()} />);
    expect(
      screen.getByLabelText('Tendencia de 71.0 a 70.9 kg en los últimos 30 días'),
    ).toBeOnTheScreen();
  });

  it('with no weights it asks for the first one', async () => {
    await render(<WeightCard day="2026-10-08" weights={[]} onSave={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Guardar peso' })).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Tendencia de/)).toBeNull();
  });
});
