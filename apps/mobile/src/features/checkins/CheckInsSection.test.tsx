import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import type { CheckIn } from './checkins-db';
import { CheckInsSection } from './CheckInsSection';

const row = (id: string, kind: CheckIn['kind'], value: string): CheckIn => ({
  id,
  kind,
  value,
  loggedAt: 0,
});

describe('CheckInsSection (F10)', () => {
  it('any check-in takes at most two taps: one for faces and "didn\'t go", two for a bathroom visit', async () => {
    const onCheckIn = jest.fn();
    await render(<CheckInsSection rows={[]} onCheckIn={onCheckIn} onDelete={jest.fn()} />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Máximo estrés que sentiste hoy: Alto' }),
    );
    expect(onCheckIn).toHaveBeenLastCalledWith('stress', '4');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Hinchazón comparada con tu normal: Peor' }),
    );
    expect(onCheckIn).toHaveBeenLastCalledWith('bloating', 'worse');
    await fireEvent.press(screen.getByRole('button', { name: 'Ánimo: Feliz' }));
    expect(onCheckIn).toHaveBeenLastCalledWith('mood', '5');
    await fireEvent.press(screen.getByRole('button', { name: 'No fui hoy' }));
    expect(onCheckIn).toHaveBeenLastCalledWith('bathroom', 'none');
    await fireEvent.press(screen.getByRole('button', { name: '+ Ida al baño' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tipo 4: Lisa · ideal' }));
    expect(onCheckIn).toHaveBeenLastCalledWith('bathroom', '4');
    expect(onCheckIn).toHaveBeenCalledTimes(5);
  });

  it('shows the latest choice as selected and every visit as a chip that removes it', async () => {
    const onDelete = jest.fn();
    await render(
      <CheckInsSection
        rows={[row('a', 'energy', '2'), row('b', 'energy', '4'), row('c', 'bathroom', 'gas')]}
        onCheckIn={jest.fn()}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole('button', { name: 'Energía: Buena' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Energía: Baja' })).not.toBeSelected();
    expect(screen.queryByRole('button', { name: 'No fui hoy' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar Solo gases' }));
    expect(onDelete).toHaveBeenCalledWith('c');
  });

  it('"didn\'t go today" toggles off by removing its row', async () => {
    const onDelete = jest.fn();
    await render(
      <CheckInsSection
        rows={[row('n', 'bathroom', 'none')]}
        onCheckIn={jest.fn()}
        onDelete={onDelete}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'No fui hoy' }));
    expect(onDelete).toHaveBeenCalledWith('n');
  });
});
