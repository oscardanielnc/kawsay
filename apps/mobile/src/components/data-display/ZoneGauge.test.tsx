import { render, screen } from '@testing-library/react-native';
import { ZoneGauge } from './ZoneGauge';

describe('ZoneGauge (design M3)', () => {
  it('reads as one element: its value, unit and state for a screen reader', async () => {
    await render(
      <ZoneGauge
        kind="two-sided"
        position={0.52}
        value="96"
        unit="g"
        accessibilityLabel="Proteína: 96 g, en rango"
      />,
    );
    expect(screen.getByLabelText('Proteína: 96 g, en rango')).toBeOnTheScreen();
    expect(screen.getByText('96')).toBeOnTheScreen();
  });

  it('without data it hides the needle and still shows the reading', async () => {
    await render(
      <ZoneGauge
        kind="one-sided"
        position={null}
        value="—"
        unit="g"
        accessibilityLabel="Harinas: sin datos"
      />,
    );
    expect(screen.getByText('—')).toBeOnTheScreen();
  });
});
