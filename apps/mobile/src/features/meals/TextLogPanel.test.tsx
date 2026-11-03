import type { TextLogProposal } from '@kawsay/contracts/text-log';
import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/lib/i18n';
import type { CatalogItem } from './meals-db';
import { TextLogPanel } from './TextLogPanel';

const item = (kind: 'dish' | 'food', id: string, name: string): CatalogItem => ({
  kind,
  id,
  name,
  source: kind === 'dish' ? 'dish' : 'INS',
  icon: 'plato',
  group: kind === 'dish' ? 'main' : 'food',
  servingGrams: 100,
  kcalPerServing: 100,
  isDrink: false,
  tags: [],
  generic: false,
  per100g: { energyKcal: 100 },
});
const items = [
  item('dish', 'chaufa-calle', 'Arroz chaufa (calle)'),
  item('food', 'inca-kola', 'Inca Kola'),
  item('food', 'inca-kola-zero', 'Inca Kola sin azúcar'),
  item('food', 'pan-frances', 'Pan francés'),
];
const units = {
  'inca-kola': [{ label: '1 vaso', grams: 250 }],
  'inca-kola-zero': [{ label: '1 vaso', grams: 250 }],
  'pan-frances': [{ label: '1 pan', grams: 35 }],
};

const proposal: TextLogProposal = {
  id: '0e7b3c1a-2f4d-4b8e-9c1a-1234567890ab',
  entries: [
    {
      meal: 'lunch',
      kind: 'dish',
      catalogId: 'chaufa-calle',
      name: 'Arroz chaufa (calle)',
      portion: { servings: 1 },
      confidence: 'high',
    },
    {
      meal: 'lunch',
      kind: 'food',
      catalogId: 'inca-kola',
      name: 'Inca Kola',
      portion: { unit: '1 vaso', count: 1 },
      confidence: 'medium',
    },
  ],
  unmatched: [{ meal: 'lunch', text: 'mazamorra de unicornio' }],
  question: {
    text: '¿Inca Kola normal o sin azúcar?',
    options: [
      { label: 'Normal', catalogId: 'inca-kola', kind: 'food' },
      { label: 'Sin azúcar', catalogId: 'inca-kola-zero', kind: 'food' },
    ],
    replaces: 'inca-kola',
  },
};

async function propose(
  onSave = jest.fn(),
  answer: () => Promise<TextLogProposal> = () => Promise.resolve(proposal),
) {
  const send = jest.fn(() => answer());
  await render(<TextLogPanel propose={send} items={items} units={units} onSave={onSave} />);
  await fireEvent.changeText(
    screen.getByLabelText('✍️ Escribir lo que comí'),
    'almorcé chaufa e Inca Kola',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Proponer' }));
  return { send, onSave };
}

describe('TextLogPanel (F16)', () => {
  it('shows the proposal as cards, the question as chips and the missing food as a pending card; nothing saved yet', async () => {
    const { send, onSave } = await propose();
    expect(send).toHaveBeenCalledWith('almorcé chaufa e Inca Kola');
    expect(await screen.findByText('Arroz chaufa (calle)')).toBeOnTheScreen();
    expect(screen.getByText('1 × 1 vaso')).toBeOnTheScreen();
    expect(screen.getByText('¿Inca Kola normal o sin azúcar?')).toBeOnTheScreen();
    expect(screen.getByText('mazamorra de unicornio')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('"Guardar todo" saves cards and pending items, with what was kept, edited or removed as feedback', async () => {
    const { onSave } = await propose();
    await screen.findByText('Arroz chaufa (calle)');
    await fireEvent.press(screen.getByRole('button', { name: 'Sin azúcar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar Arroz chaufa (calle)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar todo' }));
    expect(onSave).toHaveBeenCalledWith(
      [{ meal: 'lunch', item: { kind: 'food', id: 'inca-kola-zero' }, grams: 250 }],
      [{ meal: 'lunch', name: 'mazamorra de unicornio' }],
      {
        id: proposal.id,
        feedback: {
          entries: [
            { catalogId: 'inca-kola-zero', action: 'edited' },
            { catalogId: 'chaufa-calle', action: 'removed' },
          ],
          unmatched: ['pending'],
        },
      },
    );
  });

  it('changing the meal or the portion of a card is an edit', async () => {
    const { onSave } = await propose();
    await screen.findByText('Arroz chaufa (calle)');
    await fireEvent.press(
      screen.getByRole('button', { name: /^Arroz chaufa \(calle\): Almuerzo/ }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Más Arroz chaufa (calle)' }));
    await fireEvent.press(
      screen.getByRole('switch', { name: 'Guardar mazamorra de unicornio como pendiente' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar todo' }));
    const [entries, pending, { feedback }] = onSave.mock.calls[0] as [
      { meal: string; servings?: number }[],
      unknown[],
      { feedback: { entries: { action: string }[]; unmatched: string[] } },
    ];
    expect(entries[0]).toMatchObject({ meal: 'dinner', servings: 1.5 });
    expect(pending).toEqual([]);
    expect(feedback.entries[0]!.action).toBe('edited');
    expect(feedback.unmatched).toEqual(['removed']);
  });

  it('offline it says so and the search still works below', async () => {
    await propose(jest.fn(), () => Promise.reject(new TypeError('Network request failed')));
    expect(await screen.findByText('Sin conexión: usa la búsqueda.')).toBeOnTheScreen();
  });

  it('without an account the field explains why it is off', async () => {
    await render(<TextLogPanel propose={null} items={items} units={units} onSave={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Proponer' })).toBeNull();
    expect(screen.getByPlaceholderText(/necesita tu cuenta/)).toBeOnTheScreen();
  });
});
