import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { ExportScreen } from './ExportScreen';

describe('ExportScreen (F15)', () => {
  it('exports the chosen period without the private log by default', async () => {
    const onExport = jest.fn(() => Promise.resolve('kawsay-2026-10-08.zip'));
    await render(<ExportScreen onExport={onExport} onUnlockPrivate={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: '30 días' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Generar y compartir' }));
    expect(onExport).toHaveBeenCalledWith({ days: 30, includePrivate: false });
    expect(await screen.findByText('Listo: kawsay-2026-10-08.zip')).toBeOnTheScreen();
  });

  it('the private log is included only after unlocking', async () => {
    const onExport = jest.fn(() => Promise.resolve('x.zip'));
    const onUnlockPrivate = jest.fn(() => Promise.resolve(false));
    await render(<ExportScreen onExport={onExport} onUnlockPrivate={onUnlockPrivate} />);
    await fireEvent.press(screen.getByRole('switch', { name: 'Incluir registro privado' }));
    expect(onUnlockPrivate).toHaveBeenCalled();
    expect(screen.getByRole('switch', { name: 'Incluir registro privado' })).not.toBeChecked();
  });
});
