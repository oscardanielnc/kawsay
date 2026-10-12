import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { HydrationSection } from './HydrationSection';

const base = {
  drinks: [],
  fromMeals: [],
  goalGlasses: 8,
  sweated: false,
  urine: null,
  caloricDrinks: [{ kind: 'dish' as const, id: 'chicha-morada', name: 'Chicha morada' }],
  onAdd: jest.fn(),
  onDelete: jest.fn(),
  onAddCaloric: jest.fn(),
  onUrine: jest.fn(),
  onSweated: jest.fn(),
};

describe('HydrationSection (F10)', () => {
  it('each drink is one tap on its +; coffee or tea too', async () => {
    const onAdd = jest.fn();
    await render(<HydrationSection {...base} onAdd={onAdd} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar un vaso de Agua' }));
    expect(onAdd).toHaveBeenLastCalledWith('water');
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar un vaso de Café o té' }));
    expect(onAdd).toHaveBeenLastCalledWith('zero-calorie');
  });

  it('at 0 glasses of water the − is disabled; with glasses it removes the last one', async () => {
    const onDelete = jest.fn();
    await render(
      <HydrationSection
        {...base}
        drinks={[
          { id: 'w1', kind: 'water', volumeMl: 250 },
          { id: 'c1', kind: 'zero-calorie', volumeMl: 250 },
          { id: 'w2', kind: 'water', volumeMl: 250 },
        ]}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole('button', { name: 'Quitar un vaso de Alcohol' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar un vaso de Agua' }));
    expect(onDelete).toHaveBeenCalledWith('w2');
  });

  it('the bucket shows every drink, caloric ones from meals included; alcohol is shown but not counted', async () => {
    await render(
      <HydrationSection
        {...base}
        drinks={[
          { id: 'w', kind: 'water', volumeMl: 250 },
          { id: 'b', kind: 'alcohol', volumeMl: 330 },
        ]}
        fromMeals={[{ name: 'Jugo de papaya', from: 'Desayuno', volumeMl: 500 }]}
      />,
    );
    expect(screen.getByText('3 de 8 vasos')).toBeOnTheScreen();
    expect(screen.getByText('Jugo de papaya · del Desayuno · 2 vasos')).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        'Cubeta de 8 vasos: Agua 1, Café o té 0, Alcohol 1.3 (no suma), Con calorías 2',
      ),
    ).toBeOnTheScreen();
  });

  it('a caloric drink is two taps and goes to the meal', async () => {
    const onAddCaloric = jest.fn();
    await render(<HydrationSection {...base} onAddCaloric={onAddCaloric} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar bebida con calorías' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Chicha morada' }));
    expect(onAddCaloric).toHaveBeenCalledWith(base.caloricDrinks[0]);
  });

  it('urine colour and "I sweated a lot" are one tap each', async () => {
    const onUrine = jest.fn();
    const onSweated = jest.fn();
    await render(<HydrationSection {...base} onUrine={onUrine} onSweated={onSweated} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Clara' }));
    expect(onUrine).toHaveBeenCalledWith('clear');
    await fireEvent.press(screen.getByRole('switch', { name: 'Sudé mucho hoy' }));
    expect(onSweated).toHaveBeenCalledWith(true);
  });
});
