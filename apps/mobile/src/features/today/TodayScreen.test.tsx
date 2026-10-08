import { fireEvent, render, screen } from '@testing-library/react-native';
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

  it('‹ › move between days; the title says the day, and there is no going past today', async () => {
    const onDay = jest.fn();
    await render(
      <TodayScreen
        now={new Date('2026-10-08T15:00:00Z')}
        timeZone="America/Lima"
        day="2026-10-06"
        onDay={onDay}
      />,
    );
    expect(screen.getByRole('header', { name: 'martes, 6 de octubre' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Día anterior' }));
    expect(onDay).toHaveBeenLastCalledWith('2026-10-05');
    await fireEvent.press(screen.getByRole('button', { name: 'Día siguiente' }));
    expect(onDay).toHaveBeenLastCalledWith('2026-10-07');
  });

  it('on today the next-day button is disabled', async () => {
    await render(
      <TodayScreen
        now={new Date('2026-10-08T15:00:00Z')}
        timeZone="America/Lima"
        onDay={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Día siguiente' })).toBeDisabled();
  });
});
