import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import type { SleepSession } from './sleep-db';
import { SleepSection } from './SleepSection';

const saved = (over: Partial<SleepSession>): SleepSession => ({
  id: 'n',
  kind: 'night',
  start: '23:00',
  end: '07:00',
  stamps: { start: '2026-10-07T23:00', end: '2026-10-08T07:00' },
  hours: 8,
  quality: 4,
  nightmares: false,
  ...over,
});
const usual = { usualNight: { start: '23:00', end: '07:00' }, usualNap: null };

describe('SleepSection (F11)', () => {
  it('a night plus a nap show the daily total', async () => {
    await render(
      <SleepSection
        {...usual}
        sessions={[
          saved({}),
          saved({ id: 'p', kind: 'nap', start: '14:00', end: '14:30', hours: 0.5 }),
        ]}
        onSave={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText('8h 30m en total')).toBeOnTheScreen();
  });

  it('prefills the night from the usual schedule; one tap on a moon saves it', async () => {
    const onSave = jest.fn();
    await render(<SleepSection {...usual} sessions={[]} onSave={onSave} onDelete={jest.fn()} />);
    expect(screen.getByText('23:00')).toBeOnTheScreen();
    expect(screen.getByText('toca una luna')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Calidad Buena' }));
    expect(onSave).toHaveBeenCalledWith({
      kind: 'night',
      start: '23:00',
      end: '07:00',
      quality: 4,
      nightmares: false,
    });
  });

  it('start and end are editable on a saved session, and nightmares is a switch', async () => {
    const onSave = jest.fn();
    await render(
      <SleepSection {...usual} sessions={[saved({})]} onSave={onSave} onDelete={jest.fn()} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Más Me desperté' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'n', end: '07:15' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Tuve pesadillas' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'n', nightmares: true }));
  });

  it('naps can be added and removed', async () => {
    const onDelete = jest.fn();
    await render(
      <SleepSection
        {...usual}
        sessions={[
          saved({}),
          saved({ id: 'p', kind: 'nap', start: '14:00', end: '14:30', hours: 0.5 }),
        ]}
        onSave={jest.fn()}
        onDelete={onDelete}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '+ Agregar siesta' }));
    expect(screen.getByText('9h en total')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Quitar siesta' })[0]!);
    expect(onDelete).toHaveBeenCalledWith('p');
  });
});
