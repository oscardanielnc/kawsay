import type { LabelReading } from '@kawsay/contracts/catalog';
import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { LabelFood, parseAmount } from './LabelFood';

const NONE = {
  energyKcal: null,
  fatG: null,
  saturatedFatG: null,
  transFatG: null,
  cholesterolMg: null,
  sodiumMg: null,
  carbsTotalG: null,
  fiberG: null,
  sugarsTotalG: null,
  addedSugarG: null,
  proteinG: null,
};
/** Invented cookies: 150 kcal per serving of 30 g. */
const READING: LabelReading = {
  readable: true,
  name: 'Galletas de vainilla',
  brand: 'Marca X',
  basis: 'perServing',
  servingLabel: '6 galletas',
  servingGrams: 30,
  packageGrams: 180,
  isDrink: false,
  refinedFlour: true,
  values: { ...NONE, energyKcal: 150, proteinG: 1.8, fatG: 6, carbsTotalG: 22, sugarsTotalG: 9 },
};
const photo = { base64: 'AAAA', mimeType: 'image/jpeg' as const };

const type = async (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);

describe('LabelFood (F23 piece 3)', () => {
  it('typed per serving: saves the numbers as typed, with the serving grams', async () => {
    const onSave = jest.fn<void, [unknown]>();
    await render(<LabelFood initialName="Galletas" onSave={onSave} />);
    expect(screen.getByText(/Copia los números/)).toBeOnTheScreen();
    const save = screen.getByRole('button', { name: 'Guardar y elegir cuánto comí' });
    expect(save).toBeDisabled();
    await type('Gramos de una porción (g)', '30');
    await type('Energía', '150');
    await type('Proteína', '1,8');
    expect(screen.getByText('= 500 kcal por 100 g')).toBeOnTheScreen();
    await fireEvent.press(save);
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      name: 'Galletas',
      readByAi: false,
      label: {
        basis: 'perServing',
        servingGrams: 30,
        values: { energyKcal: 150, proteinG: 1.8, fatG: null },
      },
    });
  });

  it('per serving without the serving grams cannot be saved', async () => {
    await render(<LabelFood initialName="Galletas" onSave={jest.fn()} />);
    await type('Energía', '150');
    expect(screen.getByText(/cuántos g o ml tiene una porción/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Guardar y elegir cuánto comí' })).toBeDisabled();
  });

  it('a photo read by the AI fills every number, editable, and says to check them', async () => {
    const onSave = jest.fn<void, [unknown]>();
    const readLabel = jest.fn().mockResolvedValue(READING);
    await render(
      <LabelFood
        initialName=""
        takePhoto={jest.fn().mockResolvedValue(photo)}
        readLabel={readLabel}
        onSave={onSave}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '📷 Tomar foto de la etiqueta' }));
    expect(readLabel).toHaveBeenCalledWith(photo);
    expect(await screen.findByText(/Leído por IA/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Nombre del producto')).toHaveDisplayValue('Galletas de vainilla');
    expect(screen.getByLabelText('Energía')).toHaveDisplayValue('150');
    expect(screen.getByLabelText('Hecho con harina refinada')).toBeChecked();
    // The label does not split added sugar: one tap uses the total sugars.
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'La etiqueta no separa el azúcar añadido: usar los azúcares totales',
      }),
    );
    expect(screen.getByLabelText('Azúcares añadidos')).toHaveDisplayValue('9');
    await type('Energía', '140');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar y elegir cuánto comí' }));
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      brand: 'Marca X',
      readByAi: true,
      packageGrams: 180,
      label: { refinedFlour: true, values: { energyKcal: 140, addedSugarG: 9 } },
    });
  });

  it('warns when the energy does not match the macronutrients', async () => {
    await render(<LabelFood initialName="Galletas" onSave={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Por 100 g' }));
    await type('Energía', '150');
    await type('Proteína', '5');
    await type('Grasa total', '20');
    await type('Carbohidratos totales', '75');
    expect(screen.getByText(/La energía no cuadra/)).toBeOnTheScreen();
    await type('Energía', '500');
    expect(screen.queryByText(/La energía no cuadra/)).toBeNull();
  });

  it('an unreadable photo asks for another one and leaves the form as it was', async () => {
    await render(
      <LabelFood
        initialName="Helado"
        takePhoto={jest.fn().mockResolvedValue(photo)}
        readLabel={jest.fn().mockResolvedValue({ ...READING, readable: false, values: NONE })}
        onSave={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Elegir foto de la galería' }));
    expect(await screen.findByText(/No se ve una tabla nutricional legible/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Nombre del producto')).toHaveDisplayValue('Helado');
  });

  it('offline: says to type the numbers', async () => {
    await render(
      <LabelFood
        initialName="Helado"
        takePhoto={jest.fn().mockResolvedValue(photo)}
        readLabel={jest.fn().mockRejectedValue(new TypeError('Network request failed'))}
        onSave={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '📷 Tomar foto de la etiqueta' }));
    expect(await screen.findByText(/Sin conexión: escribe los números/)).toBeOnTheScreen();
  });
});

describe('parseAmount', () => {
  it('reads "1,5" and "1.5" as 1.5; empty is "sin dato" (null), never 0', () => {
    expect(parseAmount('1,5')).toBe(1.5);
    expect(parseAmount('1.5')).toBe(1.5);
    expect(parseAmount(' ')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
});
