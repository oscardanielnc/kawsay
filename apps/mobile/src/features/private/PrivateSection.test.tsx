import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { PrivateSection } from './PrivateSection';

const handlers = { onUnlock: jest.fn(), onLock: jest.fn(), onAdd: jest.fn(), onDelete: jest.fn() };

describe('PrivateSection (F12)', () => {
  it('locked, it shows nothing but the lock', async () => {
    const onUnlock = jest.fn();
    await render(<PrivateSection {...handlers} entries={null} onUnlock={onUnlock} />);
    expect(screen.queryByText(/Relación sexual|Masturbación/)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Desbloquear con tu huella o PIN' }));
    expect(onUnlock).toHaveBeenCalled();
  });

  it('unlocked, one tap logs each kind and a chip removes it', async () => {
    const onAdd = jest.fn();
    const onDelete = jest.fn();
    await render(
      <PrivateSection
        {...handlers}
        entries={[{ id: 'x', kind: 'sex' }]}
        onAdd={onAdd}
        onDelete={onDelete}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar Masturbación' }));
    expect(onAdd).toHaveBeenCalledWith('masturbation');
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar Relación sexual' }));
    expect(onDelete).toHaveBeenCalledWith('x');
  });
});
