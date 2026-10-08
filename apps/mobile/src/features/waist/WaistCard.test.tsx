import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { WaistCard } from './WaistCard';

const props = { heightCm: 170, reminderDay: 3, onSave: jest.fn() };

describe('WaistCard (F04)', () => {
  it('with the reminder on, the week’s measurement takes one input', async () => {
    const onSave = jest.fn();
    await render(
      <WaistCard
        {...props}
        day="2026-10-08"
        waists={[{ weekStart: '2026-09-28', cm: 92.5 }]}
        onSave={onSave}
      />,
    );
    expect(screen.getByText('Hoy toca medir tu cintura')).toBeOnTheScreen();
    expect(screen.getByText(/en el ombligo/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Menos Cintura de esta semana' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cintura' }));
    expect(onSave).toHaveBeenCalledWith(92);
  });

  it('92 cm at 170 cm shows 0.54 in yellow, "Riesgo aumentado"', async () => {
    await render(
      <WaistCard {...props} day="2026-10-08" waists={[{ weekStart: '2026-10-05', cm: 92 }]} />,
    );
    expect(screen.getByText('0.54 · Riesgo aumentado')).toBeOnTheScreen();
    expect(screen.queryByText('Hoy toca medir tu cintura')).toBeNull();
  });

  it('weeks without a measurement leave a gap, not a zero: the chart counts only measured weeks', async () => {
    await render(
      <WaistCard
        {...props}
        day="2026-10-08"
        waists={[
          { weekStart: '2026-09-14', cm: 94 },
          { weekStart: '2026-10-05', cm: 92 },
        ]}
      />,
    );
    expect(screen.getByLabelText('2 semanas medidas de las últimas 12')).toBeOnTheScreen();
  });
});
