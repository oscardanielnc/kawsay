import { render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { TodayScreen } from './TodayScreen';

describe('TodayScreen', () => {
  it('shows the title in Spanish', async () => {
    await render(<TodayScreen now={new Date('2026-10-07T15:00:00Z')} timeZone="America/Lima" />);
    expect(screen.getByRole('header', { name: 'Hoy' })).toBeOnTheScreen();
  });

  it('at 22:00 in Lima the day is still the 7th, although UTC is already the 8th (ADR 0016)', async () => {
    await render(<TodayScreen now={new Date('2026-10-08T03:00:00Z')} timeZone="America/Lima" />);
    expect(screen.getByText('miércoles, 7 de octubre')).toBeOnTheScreen();
  });
});
