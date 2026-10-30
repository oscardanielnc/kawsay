import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import { NotesSection } from './NotesSection';

const notes = [
  {
    id: 'n1',
    text: 'Creo que me dio diarrea por comer ceviche',
    loggedAt: Date.UTC(2026, 9, 12, 20, 30),
    timeZone: 'America/Lima',
  },
];

function renderNotes(props: Partial<Parameters<typeof NotesSection>[0]> = {}) {
  const onSave = jest.fn();
  const onDelete = jest.fn();
  const rendered = render(
    <NotesSection notes={notes} onSave={onSave} onDelete={onDelete} {...props} />,
  );
  return { onSave, onDelete, rendered };
}

describe('NotesSection (F21)', () => {
  it('shows the day notes with the time they were written', async () => {
    const { rendered } = renderNotes();
    await rendered;
    expect(screen.getByText('Creo que me dio diarrea por comer ceviche')).toBeOnTheScreen();
    expect(screen.getByText(/15:30/)).toBeOnTheScreen();
  });

  it('writes a new note', async () => {
    const { onSave, rendered } = renderNotes({ notes: [] });
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: '+ Escribir nota' }));
    await fireEvent.changeText(
      screen.getByLabelText('Tu nota'),
      'Tuve una pelea con mi novia pero a los pocos minutos nos reconciliamos',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(onSave).toHaveBeenCalledWith({
      text: 'Tuve una pelea con mi novia pero a los pocos minutos nos reconciliamos',
    });
  });

  it('a blank note cannot be saved', async () => {
    const { onSave, rendered } = renderNotes({ notes: [] });
    await rendered;
    await fireEvent.press(screen.getByRole('button', { name: '+ Escribir nota' }));
    await fireEvent.changeText(screen.getByLabelText('Tu nota'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('tapping a note edits it; it can also be deleted', async () => {
    const { onSave, onDelete, rendered } = renderNotes();
    await rendered;
    await fireEvent.press(
      screen.getByRole('button', { name: /Creo que me dio diarrea por comer ceviche/ }),
    );
    expect(screen.getByDisplayValue('Creo que me dio diarrea por comer ceviche')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Tu nota'), 'Fue el ceviche, seguro');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(onSave).toHaveBeenCalledWith({ id: 'n1', text: 'Fue el ceviche, seguro' });
    await fireEvent.press(
      screen.getByRole('button', { name: /Creo que me dio diarrea por comer ceviche/ }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Borrar nota' }));
    expect(onDelete).toHaveBeenCalledWith('n1');
  });

  it('opens ready to write when the (+) tab asks for it', async () => {
    const { rendered } = renderNotes({ startWriting: '1' });
    await rendered;
    expect(screen.getByLabelText('Tu nota')).toBeOnTheScreen();
  });
});
