import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { DayChecklist } from './DayChecklist';

const areas = {
  meals: true,
  activity: true,
  water: false,
  body: false,
  sleep: true,
  weight: true,
};

describe('DayChecklist (design: "your day logged")', () => {
  it('counts the logged parts and marks each one done or pending', async () => {
    await render(
      <DayChecklist
        areas={areas}
        done={4}
        movementMinutes={18}
        movementGoalMin={30}
        onPick={jest.fn()}
      />,
    );
    expect(screen.getByText('4 de 6')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Comidas: registrado' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Agua: pendiente, toca para ir' })).toBeOnTheScreen();
  });

  it('tapping a pending part takes you to its section', async () => {
    const onPick = jest.fn();
    await render(
      <DayChecklist
        areas={areas}
        done={4}
        movementMinutes={18}
        movementGoalMin={30}
        onPick={onPick}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Agua: pendiente, toca para ir' }));
    expect(onPick).toHaveBeenCalledWith('water');
  });

  it('movement is a progress bar against the daily goal', async () => {
    const { rerender } = await render(
      <DayChecklist
        areas={areas}
        done={4}
        movementMinutes={18}
        movementGoalMin={30}
        onPick={jest.fn()}
      />,
    );
    expect(screen.getByText('18 de 30 min · faltan 12')).toBeOnTheScreen();
    await rerender(
      <DayChecklist
        areas={areas}
        done={4}
        movementMinutes={45}
        movementGoalMin={30}
        onPick={jest.fn()}
      />,
    );
    expect(screen.getByText('✓ Meta de movimiento cumplida')).toBeOnTheScreen();
  });
});
