import { render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { DayRings } from './DayRings';

describe('DayRings (design S2)', () => {
  it('shows how many of the six parts are logged and the movement minutes against the goal', async () => {
    await render(
      <DayRings
        areas={{
          meals: true,
          activity: true,
          water: false,
          body: false,
          sleep: false,
          weight: true,
        }}
        done={3}
        movementMinutes={25}
        movementGoalMin={30}
      />,
    );
    expect(screen.getByText('3/6')).toBeOnTheScreen();
    expect(screen.getByText('Comidas ✓')).toBeOnTheScreen();
    expect(screen.getByText('Agua')).toBeOnTheScreen();
    expect(screen.getByText('25 de 30 min')).toBeOnTheScreen();
  });
});
