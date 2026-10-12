import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import type { InsightsData } from './types';
import { InsightsScreen } from './InsightsScreen';

const base: InsightsData = {
  from: '2026-10-06',
  to: '2026-10-12',
  week: {
    days: { green: 4, yellow: 2, red: 1, grey: 0 },
    movement: { minutes: 120, goalMinutes: 150 },
    weight: { kind: 'need-more', weights: 2 },
  },
  nutrients: {
    status: 'ok',
    countedDays: 7,
    rows: [
      { key: 'ironMg', intake: 6, reference: 8, percent: 75, tone: 'yellow', coverage: 1 },
      { key: 'sodiumMg', intake: 2500, reference: 2000, percent: 125, tone: 'red', coverage: 1 },
    ],
  },
  sources: { ironMg: [{ name: 'Lomo saltado', amount: 3.2 }] },
  richest: { ironMg: [{ name: 'Lentejas cocidas', amount: 4, portion: '1 taza', eaten: true }] },
  relations: {
    status: 'ok',
    loggedDays: 24,
    findings: [
      {
        exposure: { kind: 'food', id: 'leche-entera', name: 'Leche fresca entera' },
        symptom: { kind: 'check', id: 'bloating' },
        direction: 'raises',
        occurrences: 6,
        exposedDays: 8,
        exposedBad: 6,
        baselineDays: 16,
        baselineBad: 2,
        exposedRate: 0.75,
        baselineRate: 0.125,
        confidence: 'medium',
      },
    ],
  },
};

function renderScreen(data: InsightsData = base) {
  const onPrev = jest.fn();
  return {
    onPrev,
    view: render(<InsightsScreen data={data} canNext={false} onPrev={onPrev} onNext={jest.fn()} />),
  };
}

describe('InsightsScreen (F17 without AI, F19, F20)', () => {
  it('the week: days by colour, movement vs 150 and "weigh more days" with 2 weights', async () => {
    await renderScreen().view;
    expect(screen.getByText('6 – 12 oct.')).toBeOnTheScreen();
    expect(screen.getByText('días en verde')).toBeOnTheScreen();
    expect(screen.getByText('120 / 150 min')).toBeOnTheScreen();
    expect(screen.getByText('Pésate más días (2 de 3)')).toBeOnTheScreen();
  });

  it('‹ goes to the previous week; › is disabled on the current one', async () => {
    const { onPrev, view } = renderScreen();
    await view;
    await fireEvent.press(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(onPrev).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Semana siguiente' })).toBeDisabled();
  });

  it('iron at 75% in yellow; tapping it shows where it came from and the richest foods', async () => {
    await renderScreen().view;
    expect(screen.getByText('6 de 8 mg al día')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Hierro: 75 %' }));
    expect(screen.getByText('Lomo saltado')).toBeOnTheScreen();
    expect(screen.getByText('Lentejas cocidas · 1 taza')).toBeOnTheScreen();
    expect(screen.getByText('ya lo comes')).toBeOnTheScreen();
  });

  it('sodium is shown in mg against its limit', async () => {
    await renderScreen().view;
    expect(screen.getByRole('button', { name: 'Sodio: 2,500 mg' })).toBeOnTheScreen();
  });

  it('a relation reads with its numbers and confidence, never as a diagnosis', async () => {
    await renderScreen().view;
    expect(screen.getByText(/Leche fresca entera/)).toBeOnTheScreen();
    expect(screen.getByText('→ más hinchazón')).toBeOnTheScreen();
    expect(screen.getByText(/6 de 8 días \(75 %\)/)).toBeOnTheScreen();
    expect(screen.getByText('Confianza media')).toBeOnTheScreen();
    expect(screen.getByText(/No es un diagnóstico/)).toBeOnTheScreen();
  });

  it('with too few days each card asks for more', async () => {
    await renderScreen({
      ...base,
      nutrients: { status: 'need-days', countedDays: 3, neededDays: 4 },
      relations: { status: 'need-days', loggedDays: 5, neededDays: 10 },
    }).view;
    expect(screen.getByText(/Registra 4 días con al menos 2 comidas.*Llevas 3/)).toBeOnTheScreen();
    expect(screen.getByText(/10 días para ver relaciones\. Llevas 5/)).toBeOnTheScreen();
  });
});
