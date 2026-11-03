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
let ids = 0;
const newId = () => `draft-${++ids}`;
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
        newId={newId}
      />,
    );
    expect(screen.getByText('8h 30m en total')).toBeOnTheScreen();
  });

  it('prefills the night from the usual schedule; one tap on a moon saves it', async () => {
    const onSave = jest.fn();
    await render(
      <SleepSection {...usual} sessions={[]} onSave={onSave} onDelete={jest.fn()} newId={newId} />,
    );
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
      <SleepSection
        {...usual}
        sessions={[saved({})]}
        onSave={onSave}
        onDelete={jest.fn()}
        newId={newId}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Más Me desperté' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'n', end: '07:15' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Tuve pesadillas' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'n', nightmares: true }));
  });

  it('a nap that ends before it starts counts 0 h and says why, instead of 23 h', async () => {
    await render(
      <SleepSection
        {...usual}
        sessions={[
          saved({}),
          saved({ id: 'p', kind: 'nap', start: '14:00', end: '13:30', hours: 0 }),
        ]}
        onSave={jest.fn()}
        onDelete={jest.fn()}
        newId={newId}
      />,
    );
    expect(screen.getByText('8h en total')).toBeOnTheScreen();
    expect(screen.getByText(/Cuenta 0 h/)).toBeOnTheScreen();
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
        newId={newId}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '+ Agregar siesta' }));
    expect(screen.getByText('9h en total')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Quitar siesta' })[0]!);
    expect(onDelete).toHaveBeenCalledWith('p');
  });

  it('no nap appears by itself: the usual nap is only the prefill of "Agregar siesta"', async () => {
    await render(
      <SleepSection
        usualNight={usual.usualNight}
        usualNap={{ start: '14:00', end: '14:30' }}
        sessions={[saved({})]}
        onSave={jest.fn()}
        onDelete={jest.fn()}
        newId={newId}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Quitar siesta' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: '+ Agregar siesta' }));
    expect(screen.getAllByRole('button', { name: 'Quitar siesta' })).toHaveLength(1);
    expect(screen.getByText('14:00')).toBeOnTheScreen();
  });

  it("changing the added nap's time with several quick taps leaves one nap", async () => {
    const onSave = jest.fn();
    await render(
      <SleepSection
        usualNight={usual.usualNight}
        usualNap={{ start: '14:00', end: '14:30' }}
        sessions={[saved({})]}
        onSave={onSave}
        onDelete={jest.fn()}
        newId={newId}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '+ Agregar siesta' }));
    const later = screen.getAllByRole('button', { name: 'Más Me desperté' })[1]!;
    for (let i = 0; i < 5; i++) await fireEvent.press(later);
    const napIds = new Set(onSave.mock.calls.map(([change]: [{ id: string }]) => change.id));
    expect(napIds.size).toBe(1);
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'nap', start: '14:00', end: '15:45' }),
    );
    expect(screen.getAllByRole('button', { name: 'Quitar siesta' })).toHaveLength(1);
  });
});
