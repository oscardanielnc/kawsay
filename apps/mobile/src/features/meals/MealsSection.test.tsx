import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import type { CatalogItem, MealEntryView } from './meals-db';
import { MealsSection } from './MealsSection';

const item = (
  id: string,
  name: string,
  kcalPerServing: number,
  extra: Partial<CatalogItem> = {},
): CatalogItem => ({
  kind: 'dish',
  id,
  name,
  source: 'dish',
  icon: 'plato',
  group: 'main',
  servingGrams: 300,
  kcalPerServing,
  isDrink: false,
  per100g: { energyKcal: kcalPerServing / 3 },
  ...extra,
});
const panConHuevo = item('pan-con-huevo', 'Pan con huevo', 310, {
  icon: 'pan',
  group: 'breakfast',
});
const lomo = item('lomo-saltado', 'Lomo saltado', 820);
const juane = item('mini-juane-pollo', 'Mini juane de pollo (calle)', 480, { icon: 'hoja' });
const items = [panConHuevo, lomo, juane];

function renderSection(overrides: Partial<Parameters<typeof MealsSection>[0]> = {}) {
  const props = {
    entries: [] as MealEntryView[],
    items,
    recent: { breakfast: [panConHuevo, juane], lunch: [lomo], dinner: [lomo], snack: [] },
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    units: {},
    onCreateDish: jest.fn(),
    ...overrides,
  };
  return { ...props, view: render(<MealsSection {...props} />) };
}

describe('MealsSection (F05)', () => {
  it("repeating yesterday's breakfast takes one tap plus the portion", async () => {
    const { onAdd, view } = renderSection();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Desayuno' }));
    await fireEvent.press(screen.getByRole('button', { name: /Pan con huevo/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar 1 ración' }));
    expect(onAdd).toHaveBeenCalledWith({
      meal: 'breakfast',
      item: panConHuevo,
      servings: 1,
      saveRestForTomorrow: false,
    });
  });

  it('half a serving halves the calories and offers to save the rest for tomorrow', async () => {
    const { onAdd, view } = renderSection();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Cena' }));
    await fireEvent.press(screen.getByRole('button', { name: /Lomo saltado/ }));
    await fireEvent.press(screen.getByRole('button', { name: '½' }));
    expect(screen.getByText('410')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('switch', { name: /Guardar el resto \(½\)/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar ½ ración' }));
    expect(onAdd).toHaveBeenCalledWith({
      meal: 'dinner',
      item: lomo,
      servings: 0.5,
      saveRestForTomorrow: true,
    });
  });

  it('grams instead of a fraction', async () => {
    const { onAdd, view } = renderSection();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Almuerzo' }));
    await fireEvent.press(screen.getByRole('button', { name: /Lomo saltado/ }));
    await fireEvent.changeText(screen.getByLabelText('o en gramos'), '120');
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar 120 g' }));
    expect(onAdd).toHaveBeenCalledWith({
      meal: 'lunch',
      item: lomo,
      grams: 120,
      saveRestForTomorrow: false,
    });
  });

  it('typing filters the dishes', async () => {
    const { view } = renderSection();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Desayuno' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'lomo');
    expect(screen.getByRole('button', { name: /Lomo saltado/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Pan con huevo/ })).not.toBeOnTheScreen();
  });

  it('a logged item shows as a chip with its portion, and can be removed', async () => {
    const entry: MealEntryView = {
      id: 'e1',
      meal: 'breakfast',
      kind: 'dish',
      itemId: 'mini-juane-pollo',
      name: 'Mini juane de pollo (calle)',
      icon: 'hoja',
      servings: 0.5,
      grams: 150,
      kcal: 240,
      proteinG: 10,
      fatG: 8,
      carbsG: 30,
      volumeMl: null,
      leftoverOf: 'e0',
    };
    const { onDelete, view } = renderSection({ entries: [entry] });
    await view;
    expect(screen.getByText('240 kcal')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /½ Mini juane de pollo/ }));
    expect(screen.getByText(/Resto guardado de ayer/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar' }));
    expect(onDelete).toHaveBeenCalledWith('e1');
  });

  it('"Create dish" opens prefilled with the search text (F07)', async () => {
    await renderSection().view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Almuerzo' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'Sudado de doncella');
    await fireEvent.press(
      screen.getByRole('button', { name: '+ Crear plato "Sudado de doncella"' }),
    );
    expect(screen.getByRole('header', { name: 'Crear plato' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Nombre del plato')).toHaveDisplayValue('Sudado de doncella');
  });
});
