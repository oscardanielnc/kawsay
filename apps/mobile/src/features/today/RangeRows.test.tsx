import { render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { RangeRows } from './RangeRows';

const targets = { targetKcal: 2000, proteinG: 100, fatG: 60, carbsG: 250 };

describe('RangeRows (design: range rows, F09)', () => {
  it('while the day is open, below green reads "N left" with the green limits underneath', async () => {
    await render(
      <RangeRows
        targets={targets}
        eaten={{ kcal: 1200, proteinG: 95, fatG: 60, carbsG: 0 }}
        dayOpen
      />,
    );
    expect(screen.getByText('Faltan 600 kcal')).toBeOnTheScreen();
    expect(screen.getByText('1,800')).toBeOnTheScreen();
    expect(screen.getByText('2,200')).toBeOnTheScreen();
    expect(screen.getAllByText('En rango')).toHaveLength(2);
    expect(screen.getByText('Sin registros')).toBeOnTheScreen();
  });

  it('overshooting shows its colour state even while the day is open', async () => {
    await render(
      <RangeRows
        targets={targets}
        eaten={{ kcal: 2300, proteinG: 170, fatG: 60, carbsG: 250 }}
        dayOpen
      />,
    );
    expect(screen.getByText('Algo alto')).toBeOnTheScreen();
    expect(screen.getByText('Muy alto')).toBeOnTheScreen();
  });

  it('a closed day below green is a warning, not "left"', async () => {
    await render(
      <RangeRows
        targets={targets}
        eaten={{ kcal: 1700, proteinG: 100, fatG: 60, carbsG: 250 }}
        dayOpen={false}
      />,
    );
    expect(screen.getByText('Algo bajo')).toBeOnTheScreen();
  });
});
