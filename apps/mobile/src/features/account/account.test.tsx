import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { AccountScreen } from './AccountScreen';
import { SignInScreen } from './SignInScreen';

const lima = 'America/Lima';

describe('SignInScreen (F02)', () => {
  it('signs in with email and password, and says when the password is wrong', async () => {
    const onSignIn = jest.fn(() => Promise.resolve('invalid' as const));
    await render(<SignInScreen onSignIn={onSignIn} onUseAlone={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Correo'), ' oscar@kawsay.test ');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secret');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(onSignIn).toHaveBeenCalledWith('oscar@kawsay.test', 'secret');
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeOnTheScreen();
  });

  it('can be skipped: the phone works on its own', async () => {
    const onUseAlone = jest.fn();
    await render(<SignInScreen onSignIn={jest.fn()} onUseAlone={onUseAlone} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Usar sin cuenta por ahora' }));
    expect(onUseAlone).toHaveBeenCalled();
  });
});

describe('AccountScreen (F02)', () => {
  const actions = {
    onSignIn: jest.fn(),
    onSyncNow: jest.fn(),
    onSignOut: jest.fn(),
    timeZone: lima,
  };

  it('signed in: when it last synced and what still waits to go up', async () => {
    await render(
      <AccountScreen
        account={{ email: 'oscar@kawsay.test', lastSyncedAt: Date.UTC(2026, 9, 9, 15, 42) }}
        status="offline"
        pending={3}
        {...actions}
      />,
    );
    expect(screen.getByText('Entraste como oscar@kawsay.test')).toBeOnTheScreen();
    expect(screen.getByText('Sin señal: se sincroniza solo cuando vuelva')).toBeOnTheScreen();
    expect(screen.getByText('3 cambios esperan subir')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Sincronizar ahora' }));
    expect(actions.onSyncNow).toHaveBeenCalled();
  });

  it('shows the last sync time in the phone zone', async () => {
    await render(
      <AccountScreen
        account={{ email: 'oscar@kawsay.test', lastSyncedAt: Date.UTC(2026, 9, 9, 15, 42) }}
        status="idle"
        pending={0}
        {...actions}
      />,
    );
    expect(screen.getByText(/Sincronizado: 9 oct.*10:42/)).toBeOnTheScreen();
    expect(screen.getByText('Todo está en el servidor')).toBeOnTheScreen();
  });

  it('after the server ended the session: nothing was lost, sign in again', async () => {
    await render(<AccountScreen account={null} status="session-ended" pending={2} {...actions} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Tu sesión terminó/);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
  });
});
