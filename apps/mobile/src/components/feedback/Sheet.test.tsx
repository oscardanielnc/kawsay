import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import '@/lib/i18n';
import { Sheet } from './Sheet';

describe('Sheet', () => {
  it('tapping outside closes it, like the back button', async () => {
    const onDone = jest.fn();
    await render(
      <Sheet title="Síntoma" onDone={onDone}>
        <Text>contenido</Text>
      </Sheet>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
