import type { ContributionEntry } from '@kawsay/core/day/contributions';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';
import '@/lib/i18n';
import { GaugeDetailSheet } from './GaugeDetailSheet';
import type { GaugeKey } from './gauge-readings';
import { TodayGauges } from './TodayGauges';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const targets = { targetKcal: 2000, proteinG: 110, fatG: 60, carbsG: 250 };

const entry = (
  e: Partial<ContributionEntry> & Pick<ContributionEntry, 'itemId' | 'name' | 'meal'>,
): ContributionEntry => ({
  kind: 'dish',
  icon: 'plato',
  servings: 1,
  grams: null,
  kcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
  addedSugarG: 0,
  refinedFlourG: 0,
  ...e,
});

/** An invented day. */
const ENTRIES: ContributionEntry[] = [
  entry({
    itemId: 'pan',
    name: 'Pan francés',
    kind: 'food',
    meal: 'breakfast',
    servings: 2,
    kcal: 280,
    carbsG: 56,
    refinedFlourG: 56,
    addedSugarG: 2,
  }),
  entry({
    itemId: 'pollo',
    name: 'Pollo a la brasa',
    meal: 'lunch',
    servings: 0.25,
    kcal: 878,
    proteinG: 52,
    fatG: 48,
  }),
  entry({
    itemId: 'kola',
    name: 'Inca Kola',
    kind: 'food',
    meal: 'lunch',
    servings: null,
    grams: 500,
    kcal: 220,
    addedSugarG: 55,
  }),
  entry({
    itemId: 'kola',
    name: 'Inca Kola',
    kind: 'food',
    meal: 'dinner',
    servings: null,
    grams: 300,
    kcal: 132,
    addedSugarG: 33,
  }),
  entry({
    itemId: 'palta',
    name: 'Palta',
    kind: 'food',
    meal: 'breakfast',
    servings: 0.5,
    kcal: 120,
    fatG: 11,
  }),
];
const eaten = ENTRIES.reduce(
  (sum, e) => ({
    kcal: sum.kcal + e.kcal,
    proteinG: sum.proteinG + e.proteinG,
    fatG: sum.fatG + e.fatG,
    carbsG: sum.carbsG + e.carbsG,
    addedSugarG: sum.addedSugarG + e.addedSugarG,
    refinedFlourG: sum.refinedFlourG + e.refinedFlourG,
  }),
  { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0, addedSugarG: 0, refinedFlourG: 0 },
);

/** Today's gauges and the sheet, wired as the route wires them. */
function Day({ pending = [] as { name: string }[], onComplete = () => {} }) {
  const [open, setOpen] = useState<GaugeKey | null>(null);
  return (
    <>
      <TodayGauges targets={targets} eaten={eaten} dayOpen={false} onOpen={setOpen} />
      <GaugeDetailSheet
        open={open}
        onSwitch={setOpen}
        onClose={() => setOpen(null)}
        targets={targets}
        eaten={eaten}
        dayOpen={false}
        refinedFlourShare={null}
        entries={ENTRIES}
        mealOrder={MEAL_ORDER}
        pending={pending}
        sugaryDrinksWeek={2}
        onCompletePending={onComplete}
      />
    </>
  );
}

const rowNames = () =>
  screen
    .getAllByLabelText(/% del día$/)
    .map(
      (row) =>
        String((row.props as { accessibilityLabel: string }).accessibilityLabel).split(',')[0],
    );

describe('GaugeDetailSheet (F26)', () => {
  it('tapping a gauge on Today opens its detail', async () => {
    await render(<Day />);
    await fireEvent.press(screen.getByRole('button', { name: /^Calorías:/ }));
    expect(screen.getByRole('header', { name: 'Calorías' })).toBeOnTheScreen();
    expect(screen.getByText('Lo que más sumó')).toBeOnTheScreen();
  });

  it('with a 2,000 kcal target the calories detail labels 1,600, 1,800, 2,200 and 2,400, and 0 and 3,200 at the ends', async () => {
    await render(<Day />);
    await fireEvent.press(screen.getByRole('button', { name: /^Calorías:/ }));
    expect(
      screen.getByLabelText(
        'Calorías: 1,630 kcal. Límites: 1,600, 1,800, 2,200, 2,400. De 0 a 3,200.',
      ),
    ).toBeOnTheScreen();
  });

  it('Pollo a la brasa, 878 kcal at lunch, is the first calories row with its share of the day', async () => {
    await render(<Day />);
    await fireEvent.press(screen.getByRole('button', { name: /^Calorías:/ }));
    expect(rowNames()).toEqual(['Pollo a la brasa', 'Inca Kola', 'Pan francés', 'Palta']);
    expect(
      screen.getByLabelText('Pollo a la brasa, Almuerzo · ¼ ración: 878 kcal, 54 % del día'),
    ).toBeOnTheScreen();
  });

  it('an Inca Kola at lunch and another at dinner are one row with the sum and "Almuerzo y cena"', async () => {
    await render(<Day />);
    await fireEvent.press(screen.getByRole('button', { name: /^Calorías:/ }));
    expect(screen.getByText('Almuerzo y cena · 500 g + 300 g')).toBeOnTheScreen();
    expect(screen.getByText('352 kcal')).toBeOnTheScreen();
  });

  it('switching to Azúcar añadida reorders by grams of added sugar and leaves out foods without it', async () => {
    await render(<Day />);
    await fireEvent.press(screen.getByRole('button', { name: /^Calorías:/ }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Azúcar añadida' }));
    expect(rowNames()).toEqual(['Inca Kola', 'Pan francés']);
    expect(screen.getByText('2 alimentos del día no aportan azúcar añadida.')).toBeOnTheScreen();
    expect(screen.getByText('🥤 2 bebidas azucaradas esta semana · meta 0')).toBeOnTheScreen();
  });

  it('refined flours say "tu límite"', async () => {
    await render(<Day />);
    await fireEvent.press(screen.getByRole('button', { name: /^Harinas:/ }));
    expect(screen.getByText('En rango hasta 125 g (tu límite)')).toBeOnTheScreen();
    expect(rowNames()).toEqual(['Pan francés']);
  });

  it('pending entries are listed apart with "Completar"', async () => {
    const onComplete = jest.fn();
    await render(<Day pending={[{ name: 'Juane de gallina' }]} onComplete={onComplete} />);
    await fireEvent.press(screen.getByRole('button', { name: /^Proteína:/ }));
    const line = screen.getByText('1 pendiente sin contar · Juane de gallina');
    expect(line).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Completar' }));
    expect(onComplete).toHaveBeenCalled();
    expect(
      within(screen.getByRole('tab', { name: 'Proteína' })).getByText('Proteína'),
    ).toBeOnTheScreen();
  });
});
