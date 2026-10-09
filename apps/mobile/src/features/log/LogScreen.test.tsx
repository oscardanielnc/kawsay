import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { LogScreen } from './LogScreen';

describe('LogScreen (+ tab)', () => {
  it('each tile opens what to log; water is one tap', async () => {
    const onPick = jest.fn();
    await render(<LogScreen onPick={onPick} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sueño' }));
    expect(onPick).toHaveBeenLastCalledWith('sleep');
    await fireEvent.press(screen.getByRole('button', { name: '+1 vaso de agua' }));
    expect(onPick).toHaveBeenLastCalledWith('water');
  });
});
