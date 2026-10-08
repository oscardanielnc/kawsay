import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

describe('navigation (design N1)', () => {
  it('opens on Today and shows the five tabs in Spanish', async () => {
    // Jest runs from apps/mobile: the real route folder, not a mock.
    await renderRouter('./app', { initialUrl: '/' });
    expect(screen.getByRole('header', { name: 'Hoy' })).toBeOnTheScreen();
    for (const tab of ['Calendario', 'Registrar', 'Análisis', 'Perfil']) {
      expect(screen.getByText(tab)).toBeOnTheScreen();
    }
  });
});
