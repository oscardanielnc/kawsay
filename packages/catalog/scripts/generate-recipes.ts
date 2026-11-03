/**
 * Steps 2–3 of ADR 0028 layer 2: a recipe for every name of seed/generated/dish-names.json, made of catalog food ids
 * and grams (never nutrients), checked automatically; one corrected retry, then left out and listed in the report.
 * Output: seed/generated/estimated-dishes.json and reports/generated-dishes.md. Resumable: answers are cached.
 * Run: node scripts/generate-recipes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildCatalog, readInputs } from '../src/build-catalog.ts';
import { CATEGORIES, ICONS } from '../src/generated/categories.ts';
import {
  checkRecipe,
  estimatedId,
  normalizeName,
  Recipe,
  RecipeBatch,
  type DishName,
  type Recipe as RecipeT,
} from '../src/generated/recipe.ts';
import { renderGeneratedReport, type Outcome } from '../src/generated/report.ts';
import { resolveIds } from '@kawsay/core/food/resolve-ids';
import { askJson } from './lib/ai.ts';

const root = new URL('../', import.meta.url);
const catalog = buildCatalog(readInputs(root));
const foods = new Map(catalog.foods.map((f) => [f.id, f]));
const names = (
  JSON.parse(readFileSync(new URL('seed/generated/dish-names.json', root), 'utf8')) as {
    names: (DishName & { category: string })[];
  }
).names;
// A single food already in the catalog is not a new dish.
const foodNames = new Set(
  catalog.foods.filter((f) => !f.generic).map((f) => normalizeName(f.name)),
);

const FOOD_LIST = catalog.foods
  .filter((f) => f.per100g?.energyKcal != null)
  .map(
    (f) =>
      `${f.id}|${f.name}${f.units[0]?.grams ? `|${f.units[0].label}=${f.units[0].grams}g` : ''}`,
  )
  .join('\n');

const SYSTEM = `Eres nutricionista peruano. Escribes recetas caseras típicas de Perú usando SOLO alimentos de la lista
(id|nombre|unidad casera). Responde solo JSON: {"recipes":[{"name","icon","serving","servings","items":[{"food","grams"}]}]}.
- food: un id EXACTO de la lista; elige la forma como se come (cocido, frito, crudo) cuando exista
- grams: gramos del ingrediente en toda la receta, tal como entra al plato (cocido si se cocina antes)
- servings: cuántas porciones rinde la receta; serving: la porción en palabras ("1 plato", "1 tajada", "1 vaso", "1 unidad")
- icon: uno de ${ICONS.join(', ')}
- Nada de calorías ni nutrientes: la app los calcula de la tabla
- Porciones realistas de Perú; no inventes ids; usa entre 2 y 15 ingredientes (1 si es una bebida simple)
Lista de alimentos:
${FOOD_LIST}`;

const BATCH = 10;
const CONCURRENCY = 4;
const byCategory = new Map(CATEGORIES.map((c) => [c.id, c]));

async function pool<T>(items: T[], run: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) await run(items[next++]!);
    }),
  );
}

const outcomes: Outcome[] = [];
const todo = names.filter((n) => !foodNames.has(normalizeName(n.name)));
const batches: (DishName & { category: string })[][] = [];
for (const category of CATEGORIES) {
  const mine = todo.filter((n) => n.category === category.id);
  for (let i = 0; i < mine.length; i += BATCH) batches.push(mine.slice(i, i + BATCH));
}

let done = 0;
await pool(batches, async (batch) => {
  const category = byCategory.get(batch[0]!.category)!;
  const user = `Categoría: ${category.prompt}. Una receta por plato, en este orden:\n${batch.map((n) => `- ${n.name}`).join('\n')}`;
  const parsed = RecipeBatch.safeParse(
    await askJson(`recipes:${category.id}`, SYSTEM, user).catch(() => null),
  );
  const recipes = parsed.success ? parsed.data.recipes : [];
  const settled = await Promise.all(
    batch.map((name, i) =>
      settle(
        name,
        recipes.find((r) => normalizeName(r.name) === normalizeName(name.name)) ??
          recipes[i] ??
          null,
      ),
    ),
  );
  outcomes.push(...settled);
  done += batch.length;
  process.stdout.write(`\r${done}/${todo.length}`);
});

/** Checks a recipe; on failure asks once more for that dish alone, with the errors. */
async function settle(
  name: DishName & { category: string },
  recipe: RecipeT | null,
): Promise<Outcome> {
  const category = byCategory.get(name.category)!;
  const fixed = recipe ? resolveIds({ ...recipe, name: name.name }, catalog.foods).recipe : null;
  const first = fixed ? checkRecipe(fixed, category, foods) : null;
  if (fixed && first?.ok)
    return { name, category: category.id, recipe: fixed, checked: first, retried: false };
  const errors = first?.errors ?? ['no recipe in the answer'];
  const user = `Categoría: ${category.prompt}. Receta de "${name.name}". Una receta anterior falló estos chequeos:
${errors.map((e) => `- ${e}`).join('\n')}
Usa solo ids EXACTOS de la lista (por ejemplo ins-c35, no lucuma). Corrige ingredientes, gramos o porciones. Devuelve {"recipes":[una receta]}.`;
  const again = RecipeBatch.safeParse(
    await askJson(`retry:${category.id}`, SYSTEM, user).catch(() => null),
  );
  const second = again.success ? Recipe.safeParse(again.data.recipes[0]) : null;
  if (second?.success) {
    const retried = resolveIds({ ...second.data, name: name.name }, catalog.foods).recipe;
    const checked = checkRecipe(retried, category, foods);
    return { name, category: category.id, recipe: retried, checked, retried: true };
  }
  return {
    name,
    category: category.id,
    recipe: null,
    checked: { ok: false, errors, totals: null },
    retried: true,
  };
}

const accepted = outcomes.filter((o) => o.checked.ok && o.recipe);
const dishes = accepted
  .map((o) => ({
    id: estimatedId(o.name.name),
    name: o.name.name,
    aliases: o.name.aliases,
    category: o.category,
    group: byCategory.get(o.category)!.group,
    icon: o.recipe!.icon,
    serving: o.recipe!.serving,
    servings: o.recipe!.servings,
    items: o.recipe!.items,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));
const unique = dishes.filter((d, i) => dishes.findIndex((x) => x.id === d.id) === i);

writeFileSync(
  new URL('seed/generated/estimated-dishes.json', root),
  `${JSON.stringify(
    {
      about:
        'Estimated recipes over the catalog foods (ADR 0028 layer 2): ingredients and grams from an AI, nutrients computed by the table. Generated by scripts/generate-recipes.ts; do not edit by hand.',
      dishes: unique,
    },
    null,
    1,
  )}\n`,
);
const usage = readFileSync(new URL('.cache/usage.jsonl', root), 'utf8')
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line) as { provider: string; in: number; out: number });
writeFileSync(
  new URL('reports/generated-dishes.md', root),
  renderGeneratedReport(outcomes, unique.length, catalog.dishes.length, usage),
);
process.stdout.write(
  `\n${unique.length} accepted of ${outcomes.length} → seed/generated/estimated-dishes.json\n`,
);
