import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import type { ItemDetail } from './catalog-detail';
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
  tags: [],
  generic: false,
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
const juaneDetail: ItemDetail = {
  source: { kind: 'dish', code: null },
  servingGrams: 230,
  perServing: {
    energyKcal: 355,
    proteinG: 12.8,
    carbsTotalG: 43.6,
    fatG: 14,
    fiberG: 0.2,
    ironMg: null,
    calciumMg: 40,
    sodiumMg: 78,
  },
  coverage: {
    energyKcal: 1,
    proteinG: 1,
    carbsTotalG: 1,
    fatG: 1,
    fiberG: 1,
    ironMg: 0,
    calciumMg: 0.8,
    sodiumMg: 1,
  },
  ingredients: [{ name: 'Arroz cocido', grams: 120, source: { kind: 'INS', code: 'A2' } }],
};

const loggedJuane: MealEntryView = {
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
  addedSugarG: 0,
  refinedFlourG: 0,
  per100g: null,
  volumeMl: null,
  leftoverOf: 'e0',
};

function renderSection(overrides: Partial<Parameters<typeof MealsSection>[0]> = {}) {
  const props = {
    entries: [] as MealEntryView[],
    items,
    recent: { breakfast: [panConHuevo, juane], lunch: [lomo], dinner: [lomo], snack: [] },
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onUpdate: jest.fn(),
    units: {},
    onCreateDish: jest.fn(),
    loadDetail: jest.fn(() => Promise.resolve(juaneDetail)),
    ...overrides,
  };
  return { ...props, view: render(<MealsSection {...props} />) };
}

describe('MealsSection (F05)', () => {
  it('a dish shows its ingredients and sources; an unknown value reads "sin dato" (F06)', async () => {
    const { view } = renderSection();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Desayuno' }));
    await fireEvent.press(screen.getByRole('button', { name: /Mini juane/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ver nutrientes y fuentes' }));
    expect(
      await screen.findByText('Receta del catálogo, calculada de sus ingredientes', {
        exact: false,
      }),
    ).toBeOnTheScreen();
    expect(screen.getByText('sin dato')).toBeOnTheScreen();
    expect(screen.getByText('con datos del 80% de los ingredientes')).toBeOnTheScreen();
    expect(screen.getByText('Arroz cocido · 120 g')).toBeOnTheScreen();
    expect(screen.getByText('Tablas peruanas INS 2023 · A2')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('button', { name: 'Agregar 1 ración' })).toBeOnTheScreen();
  });

  it('a supermarket product is created from its label and goes straight to "how much" (F23 piece 3)', async () => {
    const cookies = item('own-1', 'Galletas de vainilla', 150, {
      kind: 'food',
      source: 'user-label',
      servingGrams: 30,
    });
    const onSave = jest.fn(() => Promise.resolve(cookies));
    const { onAdd, view } = renderSection({ labelFood: { onSave } });
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Snacks' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'galletas');
    await fireEvent.press(screen.getByRole('button', { name: '📷 Crear desde etiqueta' }));
    expect(screen.getByLabelText('Nombre del producto')).toHaveDisplayValue('galletas');
    await fireEvent.changeText(screen.getByLabelText('Gramos de una porción (g)'), '30');
    await fireEvent.changeText(screen.getByLabelText('Energía'), '150');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar y elegir cuánto comí' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'galletas' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Agregar 1 ración' }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ meal: 'snack', item: cookies, servings: 1 }),
    );
  });

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

  it('back from the portion step shows the same query and results', async () => {
    const { view } = renderSection();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Almuerzo' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'lomo');
    await fireEvent.press(screen.getByRole('button', { name: /Lomo saltado/ }));
    await fireEvent.press(screen.getByRole('button', { name: '‹ Resultados de «lomo»' }));
    expect(screen.getByLabelText('Buscar plato')).toHaveDisplayValue('lomo');
    expect(screen.getByRole('button', { name: /Lomo saltado/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Pan con huevo/ })).not.toBeOnTheScreen();
  });

  it('a logged item shows as a chip with its portion, and can be removed', async () => {
    const { onDelete, view } = renderSection({ entries: [loggedJuane] });
    await view;
    expect(screen.getByText('240 kcal')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /½ Mini juane de pollo/ }));
    expect(screen.getByText(/Resto guardado de ayer/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar' }));
    expect(onDelete).toHaveBeenCalledWith('e1');
  });

  it('a logged item opens with its amount to edit: ½ becomes 1 serving without removing it', async () => {
    const { onUpdate, onDelete, view } = renderSection({ entries: [loggedJuane] });
    await view;
    await fireEvent.press(screen.getByRole('button', { name: /½ Mini juane de pollo/ }));
    expect(screen.getByRole('button', { name: '½' })).toBeSelected();
    expect(screen.queryByRole('switch', { name: /Guardar el resto/ })).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '1' }));
    expect(screen.getByText('480')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar 1 ración' }));
    expect(onUpdate).toHaveBeenCalledWith('e1', { servings: 1 });
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('a logged item can switch to grams', async () => {
    const { onUpdate, view } = renderSection({ entries: [loggedJuane] });
    await view;
    await fireEvent.press(screen.getByRole('button', { name: /½ Mini juane de pollo/ }));
    await fireEvent.changeText(screen.getByLabelText('o en gramos'), '200');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar 200 g' }));
    expect(onUpdate).toHaveBeenCalledWith('e1', { grams: 200 });
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

  it('any INS food can be added to a dish offline, but the meal search lists only curated items (F23)', async () => {
    const cocona = item('ins-c26', 'Cocona', 41, {
      kind: 'food',
      source: 'INS',
      servingGrams: null,
      generic: true,
    });
    await renderSection({ items: [...items, cocona] }).view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Almuerzo' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'cocona');
    expect(screen.queryByRole('button', { name: /^Cocona/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: '+ Crear plato "cocona"' }));
    await fireEvent.press(screen.getByRole('button', { name: '+ Ingrediente' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar ingrediente'), 'cocona');
    expect(screen.getByRole('button', { name: 'Cocona' })).toBeOnTheScreen();
  });

  it('A food missing from the catalog is logged in under 10 s with no app update: name, portion, save', async () => {
    const onAddPending = jest.fn();
    await renderSection({ onAddPending }).view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Almuerzo' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'Pollo a la brasa');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Guardar «Pollo a la brasa» como pendiente' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Porción ¼' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar pendiente' }));
    expect(onAddPending).toHaveBeenCalledWith({
      meal: 'lunch',
      name: 'Pollo a la brasa',
      portion: '¼',
    });
  });

  it('a pending chip completes from the search with its name, and the entry says what it completes', async () => {
    const onAdd = jest.fn();
    await renderSection({
      onAdd,
      pending: [{ id: 'p1', meal: 'lunch', name: 'lomo', portion: '1' }],
    }).view;
    await fireEvent.press(screen.getByRole('button', { name: 'lomo · pendiente' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Completar' }));
    expect(screen.getByLabelText('Buscar plato')).toHaveDisplayValue('lomo');
    await fireEvent.press(screen.getByRole('button', { name: /Lomo saltado/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar 1 ración' }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ meal: 'lunch', item: lomo, completes: 'p1' }),
    );
  });

  it('Changing the portion from ½ to 1 moves every preview needle and delta before adding', async () => {
    const day = {
      targets: { targetKcal: 2000, proteinG: 100, fatG: 60, carbsG: 250 },
      eaten: { kcal: 1240, proteinG: 60, fatG: 40, carbsG: 150, addedSugarG: 0, refinedFlourG: 0 },
      refinedFlourShare: null,
    };
    await renderSection({ day }).view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Almuerzo' }));
    await fireEvent.press(screen.getByRole('button', { name: /Lomo saltado/ }));
    expect(screen.getByText('+820 kcal')).toBeOnTheScreen();
    expect(screen.getByLabelText('Calorías: 1,240 → 2,060')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '½' }));
    expect(screen.getByText('+410 kcal')).toBeOnTheScreen();
    expect(screen.getByLabelText('Calorías: 1,240 → 1,650')).toBeOnTheScreen();
    expect(screen.getByText('✓ Nada se pasa de su rango')).toBeOnTheScreen();
  });

  it('A personal Coca-Cola shows "Mucho azúcar para una comida" before adding it', async () => {
    const coke = item('coca-cola', 'Coca-Cola', 210, {
      kind: 'food',
      source: 'label',
      servingGrams: 500,
      per100g: { energyKcal: 42, carbsTotalG: 11, addedSugarG: 11 },
    });
    await renderSection({
      items: [...items, coke],
      day: {
        targets: { targetKcal: 2000, proteinG: 100, fatG: 60, carbsG: 250 },
        eaten: { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0, addedSugarG: 0, refinedFlourG: 0 },
        refinedFlourShare: null,
      },
    }).view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Almuerzo' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'coca');
    await fireEvent.press(screen.getByRole('button', { name: /Coca-Cola/ }));
    expect(screen.getByText('Mucho azúcar para una comida')).toBeOnTheScreen();
  });
});

describe('MealsSection: "Crear «…» con IA" (F07 v0.2, F23 piece 4)', () => {
  it('from an empty search, a fake model proposes the dish and it opens in Create dish to edit', async () => {
    const proposeDish = jest.fn(() =>
      Promise.resolve({ name: 'Torta helada', icon: 'dulce', servings: 8, items: [] }),
    );
    const { view } = renderSection({ proposeDish });
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Desayuno' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'torta helada');
    await fireEvent.press(screen.getByRole('button', { name: '✨ Crear «torta helada» con IA' }));
    expect(proposeDish).toHaveBeenCalledWith('torta helada');
    expect(await screen.findByText(/Receta propuesta por IA/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Nombre del plato').props.value).toBe('torta helada');
  });

  it('offline it says so and offers to create the dish by hand', async () => {
    const proposeDish = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
    const { view } = renderSection({ proposeDish });
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Desayuno' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'tequeños');
    await fireEvent.press(screen.getByRole('button', { name: '✨ Crear «tequeños» con IA' }));
    expect(await screen.findByText(/Sin conexión/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '+ Crear plato "tequeños"' }));
    expect(screen.getByLabelText('Nombre del plato')).toBeOnTheScreen();
  });

  it('without an account there is no AI button', async () => {
    const { view } = renderSection();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Agregar a Desayuno' }));
    await fireEvent.changeText(screen.getByLabelText('Buscar plato'), 'torta helada');
    expect(screen.queryByRole('button', { name: /con IA/ })).toBeNull();
  });
});
