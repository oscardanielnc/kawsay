import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { SymptomsSection } from './SymptomsSection';

const symptoms = [
  { id: 'h', name: 'Dolor de cabeza', scale: 'yes-no' as const },
  { id: 'a', name: 'Acidez', scale: 'zero-five' as const },
  { id: 'g', name: 'Granos', scale: 'size' as const },
];

describe('SymptomsSection (F13)', () => {
  it('creating a symptom takes less than 30 seconds: a name, its scale, save', async () => {
    const onCreate = jest.fn();
    await render(
      <SymptomsSection symptoms={[]} answers={{}} onAnswer={jest.fn()} onCreate={onCreate} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '+ Crear' }));
    await fireEvent.changeText(screen.getByLabelText('Nombre del síntoma'), 'Acidez');
    await fireEvent.press(screen.getByRole('button', { name: 'De 0 a 5' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Crear síntoma' }));
    expect(onCreate).toHaveBeenCalledWith({ name: 'Acidez', scale: 'zero-five' });
  });

  it('yes/no is one tap; a scale is two', async () => {
    const onAnswer = jest.fn();
    await render(
      <SymptomsSection symptoms={symptoms} answers={{}} onAnswer={onAnswer} onCreate={jest.fn()} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Dolor de cabeza' }));
    expect(onAnswer).toHaveBeenLastCalledWith('h', 'yes');
    await fireEvent.press(screen.getByRole('button', { name: 'Granos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Granos: Mediano' }));
    expect(onAnswer).toHaveBeenLastCalledWith('g', 'medium');
  });

  it('shows the day’s answer on the chip; tapping a yes again clears it', async () => {
    const onAnswer = jest.fn();
    await render(
      <SymptomsSection
        symptoms={symptoms}
        answers={{ h: 'yes', a: '3' }}
        onAnswer={onAnswer}
        onCreate={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Acidez · 3' })).toBeSelected();
    await fireEvent.press(screen.getByRole('button', { name: 'Dolor de cabeza' }));
    expect(onAnswer).toHaveBeenLastCalledWith('h', null);
  });
});
