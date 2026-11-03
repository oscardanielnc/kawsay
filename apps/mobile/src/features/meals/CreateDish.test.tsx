import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { CreateDish } from './CreateDish';
import type { CatalogItem } from './meals-db';

const food = (id: string, name: string, energyKcal: number, proteinG: number): CatalogItem => ({
  kind: 'food',
  id,
  name,
  source: 'INS',
  icon: 'plato',
  group: 'food',
  servingGrams: null,
  kcalPerServing: null,
  isDrink: false,
  tags: [],
  generic: false,
  per100g: { energyKcal, proteinG, fatG: 10, carbsTotalG: 0 },
});
const foods = [
  food('pollo-carne', 'Pollo, carne con piel, cocida', 200, 25),
  food('arroz-cocido', 'Arroz blanco cocido', 130, 2.5),
];
const units = {
  'pollo-carne': [
    { label: '1/16 de pollo', grams: 60 },
    { label: '1/8 de pollo', grams: 120 },
  ],
  'arroz-cocido': [{ label: '1 taza', grams: 160 }],
};

async function addChicken() {
  await fireEvent.press(screen.getByRole('button', { name: '+ Ingrediente' }));
  await fireEvent.changeText(screen.getByLabelText('Buscar ingrediente'), 'pollo');
  await fireEvent.press(screen.getByRole('button', { name: 'Pollo, carne con piel, cocida' }));
}

describe('CreateDish (F07, manual)', () => {
  it('changing chicken from 1/8 to 1/16 updates the totals before saving', async () => {
    await render(
      <CreateDish initialName="Pollo de la casa" foods={foods} units={units} onSave={jest.fn()} />,
    );
    await addChicken();
    await fireEvent.press(screen.getByRole('button', { name: '1/8 de pollo' }));
    expect(screen.getByText('1/8 de pollo: 240 kcal')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    expect(screen.getByText(/^Por ración: 240 kcal/)).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Pollo, carne con piel, cocida: 1/8 de pollo' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: '1/16 de pollo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    expect(screen.getByText(/^Por ración: 120 kcal/)).toBeOnTheScreen();
  });

  it('saves name, icon, servings and each ingredient in grams with its household unit', async () => {
    const onSave = jest.fn();
    await render(<CreateDish initialName="" foods={foods} units={units} onSave={onSave} />);
    expect(screen.getByRole('button', { name: 'Guardar y agregar 1 ración' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Nombre del plato'), 'Arroz con pollo');
    await fireEvent.press(screen.getByRole('button', { name: 'Ícono arroz' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Más Rinde' }));
    await addChicken();
    await fireEvent.press(screen.getByRole('button', { name: 'Más Cuántos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    expect(screen.getByText(/^Por ración: 90 kcal/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar y agregar 1 ración' }));
    expect(onSave).toHaveBeenCalledWith({
      name: 'Arroz con pollo',
      icon: 'arroz',
      servings: 2,
      items: [{ foodId: 'pollo-carne', grams: 90, unitLabel: '1/16 de pollo', unitCount: 1.5 }],
    });
  });
});

describe('CreateDish from an AI proposal (F07 v0.2)', () => {
  const proposal = {
    icon: 'arroz',
    servings: 4,
    items: [
      { food: 'arroz-cocido', grams: 640 },
      { food: 'pollo-carne', grams: 480 },
    ],
  };

  it('an AI-built dish shows each ingredient with its catalog source before saving', async () => {
    await render(
      <CreateDish
        initialName="Arroz con pollo"
        foods={foods}
        units={units}
        onSave={jest.fn()}
        proposal={proposal}
      />,
    );
    expect(screen.getByText(/Receta propuesta por IA/)).toBeOnTheScreen();
    expect(screen.getByText('640 g · 832 kcal · Tablas peruanas INS 2023')).toBeOnTheScreen();
    expect(screen.getByText('480 g · 960 kcal · Tablas peruanas INS 2023')).toBeOnTheScreen();
  });

  it('every number comes from the table: totals per serving from the proposed grams, and the user can edit', async () => {
    const onSave = jest.fn();
    await render(
      <CreateDish
        initialName="Arroz con pollo"
        foods={foods}
        units={units}
        onSave={onSave}
        proposal={proposal}
      />,
    );
    // (640 × 1.30 + 480 × 2.00) / 4 servings = 448 kcal
    expect(screen.getByText(/^Por ración: 448 kcal/)).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Quitar Pollo, carne con piel, cocida' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar y agregar 1 ración' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'arroz',
        servings: 4,
        items: [expect.objectContaining({ foodId: 'arroz-cocido', grams: 640 })],
      }),
    );
  });
});
