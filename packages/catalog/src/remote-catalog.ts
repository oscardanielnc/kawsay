import { createHash } from 'node:crypto';
import type { Catalog } from './build-catalog.ts';
import { dishTotals } from './dish-totals.ts';
import type { SeedDish } from './seed.ts';

/** One estimated dish of seed/generated/estimated-dishes.json (ADR 0028 layer 2). */
export interface EstimatedDishRow {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  group: string;
  icon: string;
  serving: string;
  servings: number;
  items: { food: string; grams: number }[];
}

/** What the API serves to phones (F23 piece 5): dishes delivered by sync, with totals from the table. */
export interface RemoteCatalog {
  version: string;
  /** The bundled catalog the ingredient ids belong to. */
  bundledVersion: string;
  dishes: {
    id: string;
    name: string;
    aliases: string[];
    group: string;
    icon: string;
    serving: string;
    servings: number;
    source: 'estimated';
    items: { food: string; grams: number }[];
    tags: string[];
    totals: {
      grams: number;
      perServing: Record<string, number | null>;
      per100g: Record<string, number | null>;
    };
  }[];
}

/** The foods the API offers the AI when it writes a recipe ("Crear con IA"): ids, names and the first unit. */
export interface AiFoodList {
  version: string;
  foods: { id: string; name: string; unit: string | null; generic?: boolean }[];
}

/** Estimated recipes → remote catalog: totals and tags computed from the bundled foods; unknown ids fail. */
export function buildRemoteCatalog(
  catalog: Catalog,
  rows: readonly EstimatedDishRow[],
): RemoteCatalog {
  const byId = new Map(catalog.foods.map((f) => [f.id, f]));
  const taken = new Set(catalog.dishes.map((d) => d.id));
  const dishes = rows
    .filter((row) => !taken.has(row.id))
    .map((row) => {
      const seed: SeedDish = { ...row, confidence: 'low' };
      const totals = dishTotals(seed, byId);
      const tags: string[] = [];
      if (row.items.some((i) => byId.get(i.food)?.tags.includes('refined-flour')))
        tags.push('refined-flour');
      if (row.group === 'drink') tags.push('drink');
      return {
        id: row.id,
        name: row.name,
        aliases: row.aliases,
        group: row.group,
        icon: row.icon,
        serving: row.serving,
        servings: row.servings,
        source: 'estimated' as const,
        items: row.items,
        tags,
        totals: { grams: totals.grams, perServing: totals.perServing, per100g: totals.per100g },
      };
    });
  const version = createHash('sha256')
    .update(JSON.stringify({ bundled: catalog.version, dishes }))
    .digest('hex')
    .slice(0, 16);
  return { version, bundledVersion: catalog.version, dishes };
}

export function aiFoodList(catalog: Catalog): AiFoodList {
  return {
    version: catalog.version,
    foods: catalog.foods
      .filter((f) => f.per100g?.energyKcal != null)
      .map((f) => ({
        id: f.id,
        name: f.name,
        unit: f.units[0]?.grams ? `${f.units[0].label}=${f.units[0].grams}g` : null,
        ...(f.generic ? { generic: true } : {}),
      })),
  };
}

/**
 * What the text agent searches (ADR 0023 tools): every food and dish the phone can log, with its household units, in
 * the search order of ADR 0028 (curated, INS-S, estimated, then generic INS foods).
 */
export interface SearchIndex {
  version: string;
  items: {
    kind: 'food' | 'dish';
    id: string;
    name: string;
    aliases?: string[];
    /** curated · INS-S · estimated · INS · USDA · label */
    source: string;
    generic?: boolean;
    /** Household units with grams; a dish has its serving. */
    units: { label: string; grams: number }[];
  }[];
}

export function searchIndex(catalog: Catalog, remote: RemoteCatalog): SearchIndex {
  const dishes = [
    ...catalog.dishes.map((d) => ({
      kind: 'dish' as const,
      id: d.id,
      name: d.name,
      source: d.source,
      units: [{ label: d.serving, grams: d.totals.grams }],
    })),
    ...remote.dishes.map((d) => ({
      kind: 'dish' as const,
      id: d.id,
      name: d.name,
      ...(d.aliases.length ? { aliases: d.aliases } : {}),
      source: 'estimated',
      units: [{ label: d.serving, grams: d.totals.grams }],
    })),
  ];
  const foods = catalog.foods
    .filter((f) => f.per100g?.energyKcal != null)
    .map((f) => ({
      kind: 'food' as const,
      id: f.id,
      name: f.name,
      source: f.source.kind,
      ...(f.generic ? { generic: true } : {}),
      units: f.units.flatMap((u) => (u.grams ? [{ label: u.label, grams: u.grams }] : [])),
    }));
  return { version: remote.version, items: [...dishes, ...foods] };
}
