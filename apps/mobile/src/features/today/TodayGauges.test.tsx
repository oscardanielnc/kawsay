import { render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { TodayGauges, type DayEaten } from './TodayGauges';

const targets = { targetKcal: 2000, proteinG: 100, fatG: 60, carbsG: 250 };
const eaten = (over: Partial<DayEaten>): DayEaten => ({
  kcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
  addedSugarG: 0,
  refinedFlourG: 0,
  ...over,
});

describe('TodayGauges (Amanecer, F09 F22 F24)', () => {
  it('shows six gauges: calories, protein, fat, carbohydrates, added sugar and refined flours', async () => {
    await render(<TodayGauges targets={targets} eaten={eaten({})} dayOpen />);
    for (const name of [
      'Calorías',
      'Proteína',
      'Grasa',
      'Carbohidratos',
      'Azúcar añadida',
      'Harinas',
    ])
      expect(screen.getByText(name)).toBeOnTheScreen();
  });

  it('calories under range while the day is open read grey: "Faltan ~N"', async () => {
    await render(
      <TodayGauges targets={targets} eaten={eaten({ kcal: 1200, proteinG: 95 })} dayOpen />,
    );
    expect(screen.getByText('Faltan ~600')).toBeOnTheScreen();
    expect(screen.getByText('Rango 1,800–2,200')).toBeOnTheScreen();
    expect(screen.getByText('✓ En rango')).toBeOnTheScreen();
  });

  it('overshooting shows its state even while the day is open; a closed day below range warns', async () => {
    await render(
      <TodayGauges
        targets={targets}
        eaten={eaten({ kcal: 2300, proteinG: 170, fatG: 40 })}
        dayOpen={false}
      />,
    );
    expect(screen.getByText('↑ Algo alto')).toBeOnTheScreen();
    expect(screen.getByText('↑ Muy alto')).toBeOnTheScreen();
    expect(screen.getByText('↓ Algo bajo')).toBeOnTheScreen();
  });

  it('With a 2,000 kcal target the green limit is 25 g and the yellow limit 50 g', async () => {
    await render(<TodayGauges targets={targets} eaten={eaten({ addedSugarG: 31 })} dayOpen />);
    expect(screen.getByText('Ideal ≤ 25 g · máx. 50 g')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Azúcar añadida: 31 g, ↑ Algo alto. Ideal ≤ 25 g · máx. 50 g'),
    ).toBeOnTheScreen();
  });

  it('refined flours: the limit is half the carbohydrate target unless the profile sets another', async () => {
    const { rerender } = await render(
      <TodayGauges targets={targets} eaten={eaten({ refinedFlourG: 118 })} dayOpen />,
    );
    expect(screen.getByText('Tu límite 125 g')).toBeOnTheScreen();
    expect(screen.getByText('✓ Bajo tu límite')).toBeOnTheScreen();
    await rerender(
      <TodayGauges
        targets={targets}
        eaten={eaten({ refinedFlourG: 118 })}
        dayOpen
        refinedFlourShare={0.4}
      />,
    );
    expect(screen.getByText('Tu límite 100 g')).toBeOnTheScreen();
    expect(screen.getByText('↑ Sobre tu límite')).toBeOnTheScreen();
  });
});
