import { render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { RangeGauges } from './RangeGauges';

const targets = { targetKcal: 2000, proteinG: 100, fatG: 60, carbsG: 250 };

describe('RangeGauges (design: range gauges, F09)', () => {
  it('while the day is open, below green reads "N left" with the green limits underneath', async () => {
    await render(
      <RangeGauges
        targets={targets}
        eaten={{ kcal: 1200, proteinG: 95, fatG: 60, carbsG: 0, addedSugarG: 0 }}
        dayOpen
      />,
    );
    expect(screen.getByText('Faltan 600 kcal')).toBeOnTheScreen();
    expect(screen.getByText('1,800')).toBeOnTheScreen();
    expect(screen.getByText('2,200')).toBeOnTheScreen();
    expect(screen.getAllByText('✓ En rango')).toHaveLength(2);
    expect(screen.getByText('Sin registros')).toBeOnTheScreen();
  });

  it('each gauge prints its four zone limits outside the arc and the day amount large in the middle', async () => {
    await render(
      <RangeGauges
        targets={targets}
        eaten={{ kcal: 1950, proteinG: 95, fatG: 60, carbsG: 0, addedSugarG: 0 }}
        dayOpen
      />,
    );
    for (const limit of ['1,600', '1,800', '2,200', '2,400'])
      expect(screen.getByText(limit)).toBeOnTheScreen();
    expect(screen.getByText('1,950')).toBeOnTheScreen();
  });

  it('overshooting shows its colour state even while the day is open', async () => {
    await render(
      <RangeGauges
        targets={targets}
        eaten={{ kcal: 2300, proteinG: 170, fatG: 60, carbsG: 250, addedSugarG: 0 }}
        dayOpen
      />,
    );
    expect(screen.getByText('↑ Algo alto')).toBeOnTheScreen();
    expect(screen.getByText('↑ Muy alto')).toBeOnTheScreen();
  });

  it('a closed day below green is a warning, not "left"', async () => {
    await render(
      <RangeGauges
        targets={targets}
        eaten={{ kcal: 1700, proteinG: 100, fatG: 60, carbsG: 250, addedSugarG: 0 }}
        dayOpen={false}
      />,
    );
    expect(screen.getByText('↓ Algo bajo')).toBeOnTheScreen();
  });

  it('added sugar (F22): 2,000 kcal → green up to 25 g, yellow up to 50 g; 31 g is "algo alto"', async () => {
    await render(
      <RangeGauges
        targets={targets}
        eaten={{ kcal: 1950, proteinG: 95, fatG: 60, carbsG: 250, addedSugarG: 31 }}
        dayOpen
      />,
    );
    expect(screen.getByText('Azúcar añadida')).toBeOnTheScreen();
    expect(screen.getByText('25')).toBeOnTheScreen();
    expect(screen.getByText('50')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Azúcar añadida: 31 g, algo alto. Ideal hasta 25 g, máximo 50 g'),
    ).toBeOnTheScreen();
  });
});
