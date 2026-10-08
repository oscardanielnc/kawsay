import { fireEvent, render, screen } from '@testing-library/react-native';
import { useCallback } from 'react';
import { Pressable, Text } from 'react-native';
import { useLoad } from './use-load';

function Probe({ source }: { source: () => Promise<string> }) {
  const load = useCallback(() => source(), [source]);
  const { data, error, reload } = useLoad(load);
  return (
    <>
      <Text>{error ? `error: ${error.message}` : (data ?? 'loading')}</Text>
      <Pressable accessibilityRole="button" onPress={reload}>
        <Text>reload</Text>
      </Pressable>
    </>
  );
}

describe('useLoad', () => {
  it('shows the loaded value, and the new one after reload', async () => {
    let n = 0;
    const source = () => Promise.resolve(`value ${++n}`);
    await render(<Probe source={source} />);
    expect(await screen.findByText('value 1')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'reload' }));
    expect(await screen.findByText('value 2')).toBeOnTheScreen();
  });

  it('keeps the error instead of crashing', async () => {
    await render(<Probe source={() => Promise.reject(new Error('disk'))} />);
    expect(await screen.findByText('error: disk')).toBeOnTheScreen();
  });
});
