import { render, screen } from '@testing-library/react-native';
import { RANGE_ZONES } from '@kawsay/core/day/range-state';
import { oneSidedScale, twoSidedScale } from '@kawsay/core/gauge/scale';
import { ZoneGauge } from './ZoneGauge';

describe('ZoneGauge (design M3)', () => {
  it('reads as one element: its value, unit and state for a screen reader', async () => {
    await render(
      <ZoneGauge
        zones={twoSidedScale(100, RANGE_ZONES.protein).zones}
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
        zones={oneSidedScale(25, 50).zones}
        position={null}
        value="—"
        unit="g"
        accessibilityLabel="Harinas: sin datos"
      />,
    );
    expect(screen.getByText('—')).toBeOnTheScreen();
  });

  it('past the maximum the needle stops at the end and the number shows "+"', async () => {
    await render(
      <ZoneGauge
        zones={twoSidedScale(2000, RANGE_ZONES.calories).zones}
        position={1}
        overflow
        value="3,500"
        unit="kcal"
        accessibilityLabel="Calorías: 3,500 kcal"
      />,
    );
    expect(screen.getByText('3,500+')).toBeOnTheScreen();
  });
});
