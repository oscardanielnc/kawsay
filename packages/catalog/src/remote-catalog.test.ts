import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from './build-catalog.ts';
import { CATEGORIES } from './generated/categories.ts';
import {
  aiFoodList,
  buildRemoteCatalog,
  type EstimatedDishRow,
  type RemoteCatalog,
} from './remote-catalog.ts';

const root = new URL('..', import.meta.url);
const catalog = buildCatalog(readInputs(root));
const file = new URL('seed/generated/estimated-dishes.json', root);
const rows = existsSync(file)
  ? (JSON.parse(readFileSync(file, 'utf8')) as { dishes: EstimatedDishRow[] }).dishes
  : [];
const remote = buildRemoteCatalog(catalog, rows);

describe('remote catalog (F23 piece 5, ADR 0028 layer 2)', () => {
  it('the committed remote/dishes.json is the build of the committed recipes (run pnpm build after changing them)', () => {
    const committed = JSON.parse(
      readFileSync(new URL('remote/dishes.json', root), 'utf8'),
    ) as RemoteCatalog;
    expect(committed.version).toBe(remote.version);
  });

  it('no estimated dish reuses a curated or INS id, and every one is labelled estimated', () => {
    const bundled = new Set(catalog.dishes.map((d) => d.id));
    expect(remote.dishes.filter((d) => bundled.has(d.id))).toEqual([]);
    expect(new Set(remote.dishes.map((d) => d.id)).size).toBe(remote.dishes.length);
    expect(remote.dishes.every((d) => d.source === 'estimated')).toBe(true);
  });

  it('every estimated dish passes the checks of its category: kcal per 100 g and per serving in range', () => {
    const byId = new Map(CATEGORIES.map((c) => [c.id, c]));
    const outside = remote.dishes.filter((d) => {
      const row = rows.find((r) => r.id === d.id)!;
      // Soups named in another category are checked as soups (scripts/generate-recipes.ts).
      const category = byId.get(row.group === 'soup' ? 'sopas' : row.category)!;
      const per100 = d.totals.per100g.energyKcal ?? -1;
      const serving = d.totals.perServing.energyKcal ?? -1;
      return (
        per100 < category.kcalPer100g[0] ||
        per100 > category.kcalPer100g[1] ||
        serving < category.kcalPerServing[0] ||
        serving > category.kcalPerServing[1]
      );
    });
    expect(outside.map((d) => d.name)).toEqual([]);
  });

  it('added sugar is inherited from the ingredients: a dish with sugar has some, never unknown', () => {
    expect(remote.dishes.filter((d) => d.totals.per100g.addedSugarG == null)).toEqual([]);
    const sugared = remote.dishes.filter((d) =>
      rows.find((r) => r.id === d.id)!.items.some((i) => i.food === 'azucar'),
    );
    expect(sugared.every((d) => (d.totals.per100g.addedSugarG ?? 0) > 0)).toBe(true);
  });

  it('the AI food list has every food with energy, with ids the catalog knows', () => {
    const list = aiFoodList(catalog);
    const ids = new Set(catalog.foods.map((f) => f.id));
    expect(list.foods.length).toBeGreaterThan(1000);
    expect(list.foods.every((f) => ids.has(f.id))).toBe(true);
  });
});
