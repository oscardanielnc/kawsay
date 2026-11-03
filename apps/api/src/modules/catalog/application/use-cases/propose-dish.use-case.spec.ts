import { describe, expect, it } from 'vitest';
import { Clock } from '../../../../shared/application/ports/clock';
import { DishLimitError, DishUnavailableError } from '../../domain/errors';
import { CatalogSource, type FoodList, type RemoteCatalog } from '../ports/catalog-source';
import { RecipeWriter, type DraftRecipe } from '../ports/recipe-writer';
import { CatalogDishesUseCase } from './catalog-dishes.use-case';
import { AI_DISH_DAILY_LIMIT, ProposeDishUseCase } from './propose-dish.use-case';

const FOODS: FoodList = {
  version: 'v1',
  foods: [
    { id: 'gelatina', name: 'Gelatina preparada', unit: null },
    { id: 'ins-c35', name: 'Lúcuma', unit: null, generic: true },
    { id: 'bizcocho', name: 'Bizcocho', unit: '1 tajada=60g' },
  ],
};
const REMOTE: RemoteCatalog = { version: 'r2', bundledVersion: 'v1', dishes: [] };

class FakeSource extends CatalogSource {
  dishes() {
    return REMOTE;
  }
  foods() {
    return FOODS;
  }
}
/** A fake model: answers the drafts it is given, in order, and records what it was asked. */
class FakeWriter extends RecipeWriter {
  asked: { name: string; problems?: string[] }[] = [];
  constructor(private readonly drafts: (DraftRecipe | Error)[]) {
    super();
  }
  write(name: string, _list: string, problems?: string[]) {
    this.asked.push({ name, problems });
    const next = this.drafts.shift() ?? new Error('no more');
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  }
}
class FixedClock extends Clock {
  now() {
    return new Date('2026-11-03T12:00:00Z');
  }
}
const draft = (items: DraftRecipe['items']): DraftRecipe => ({
  name: 'Torta helada',
  icon: 'dulce',
  servings: 8,
  items,
});
const useCase = (writer: RecipeWriter) =>
  new ProposeDishUseCase(writer, new FakeSource(), new FixedClock());

describe('ProposeDishUseCase ("Crear «…» con IA", F07 v0.2)', () => {
  it('returns catalog ids and grams only; a readable slug is matched by name', async () => {
    const writer = new FakeWriter([
      draft([
        { food: 'gelatina', grams: 400 },
        { food: 'lucuma', grams: 100 },
      ]),
    ]);
    const proposal = await useCase(writer).execute('u1', 'Torta helada');
    expect(proposal).toEqual({
      name: 'Torta helada',
      icon: 'dulce',
      servings: 8,
      items: [
        { food: 'gelatina', grams: 400 },
        { food: 'ins-c35', grams: 100 },
      ],
    });
    expect(Object.keys(proposal)).not.toContain('kcal');
  });

  it('an unknown id gets one corrected retry with the problem named', async () => {
    const writer = new FakeWriter([
      draft([{ food: 'unicornio', grams: 100 }]),
      draft([{ food: 'bizcocho', grams: 300 }]),
    ]);
    const proposal = await useCase(writer).execute('u1', 'Torta helada');
    expect(proposal.items).toEqual([{ food: 'bizcocho', grams: 300 }]);
    expect(writer.asked[1]?.problems?.[0]).toMatch(/unicornio/);
  });

  it('two bad answers end in "unavailable"', async () => {
    const writer = new FakeWriter([new Error('timeout'), draft([{ food: 'unicornio', grams: 1 }])]);
    await expect(useCase(writer).execute('u1', 'x')).rejects.toBeInstanceOf(DishUnavailableError);
  });

  it(`allows ${AI_DISH_DAILY_LIMIT} dishes a day per user`, async () => {
    const drafts = Array.from({ length: AI_DISH_DAILY_LIMIT + 1 }, () =>
      draft([{ food: 'gelatina', grams: 100 }]),
    );
    const run = useCase(new FakeWriter(drafts));
    for (let i = 0; i < AI_DISH_DAILY_LIMIT; i++) await run.execute('u1', 'Gelatina');
    await expect(run.execute('u1', 'Gelatina')).rejects.toBeInstanceOf(DishLimitError);
    await expect(run.execute('u2', 'Gelatina')).resolves.toBeDefined();
  });
});

describe('CatalogDishesUseCase (F23 piece 5)', () => {
  it('answers "up to date" for the current version and the whole list otherwise', () => {
    const catalog = new CatalogDishesUseCase(new FakeSource());
    expect(catalog.execute('r2')).toEqual({ version: 'r2', upToDate: true });
    expect(catalog.execute('old')).toBe(REMOTE);
    expect(catalog.execute(undefined)).toBe(REMOTE);
  });
});
