import { z } from 'zod';

const nutrients = z.record(z.string(), z.number().nullable());
const id = z.string().min(1).max(80);
const items = z
  .array(z.strictObject({ food: id, grams: z.number().positive().max(5000) }))
  .min(1)
  .max(25);

/** A dish delivered by catalog sync (F23 piece 5, ADR 0028): an estimated recipe with totals from the table. */
export const RemoteDish = z.strictObject({
  id,
  name: z.string().min(1).max(80),
  aliases: z.array(z.string().max(80)).max(6),
  group: z.string().min(1).max(20),
  icon: z.string().min(1).max(20),
  serving: z.string().min(1).max(40),
  servings: z.number().positive(),
  source: z.literal('estimated'),
  items,
  tags: z.array(z.string().max(20)).max(5),
  totals: z.strictObject({
    grams: z.number().positive(),
    perServing: nutrients,
    per100g: nutrients,
  }),
});
export type RemoteDish = z.infer<typeof RemoteDish>;

/** `GET /v1/catalog/dishes?version=…`: the phone sends the version it holds. */
export const CatalogDishesQuery = z.strictObject({ version: z.string().max(32).optional() });
export type CatalogDishesQuery = z.infer<typeof CatalogDishesQuery>;

/** Nothing new, or the whole current list (the phone applies the difference). */
export const CatalogDishesResponse = z.union([
  z.strictObject({ version: z.string(), upToDate: z.literal(true) }),
  z.strictObject({
    version: z.string(),
    /** The bundled catalog the ingredient ids belong to. */
    bundledVersion: z.string(),
    dishes: z.array(RemoteDish),
  }),
]);
export type CatalogDishesResponse = z.infer<typeof CatalogDishesResponse>;

/** "Crear «…» con IA" (F07 v0.2, F23 piece 4): only the name the user typed; no personal data. */
export const AiDishRequest = z.strictObject({ name: z.string().trim().min(2).max(80) });
export type AiDishRequest = z.infer<typeof AiDishRequest>;

/**
 * The AI's proposal: catalog ids and grams, never nutrients (ADR 0008). The phone computes the totals from its table
 * and the user edits before saving.
 */
export const AiDishProposal = z.strictObject({
  name: z.string().min(1).max(80),
  icon: z.string().min(1).max(20),
  servings: z.number().positive().max(40),
  items,
});
export type AiDishProposal = z.infer<typeof AiDishProposal>;

/**
 * "Leer etiqueta" (F23 piece 3, ADR 0029): one photo of a food label, already shrunk on the phone. Only the image
 * goes: no user data. 1.5 MB of base64 is about a 1,600 px JPEG at 80 %.
 */
export const LabelReadRequest = z.strictObject({
  imageBase64: z
    .string()
    .min(100)
    .max(1_500_000)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'must be base64'),
  mimeType: z.enum(['image/jpeg', 'image/png']),
});
export type LabelReadRequest = z.infer<typeof LabelReadRequest>;

const labelNumber = z.number().nonnegative().max(100_000).nullable();

/**
 * What the vision model read, as printed: per 100 g or per serving, null where the label shows nothing (it reads,
 * never invents). The phone shows every number for the user to confirm before saving.
 */
export const LabelReading = z.strictObject({
  readable: z.boolean(),
  name: z.string().max(80).nullable(),
  brand: z.string().max(80).nullable(),
  basis: z.enum(['per100g', 'perServing']),
  servingLabel: z.string().max(60).nullable(),
  servingGrams: z.number().positive().max(5000).nullable(),
  packageGrams: z.number().positive().max(20_000).nullable(),
  isDrink: z.boolean(),
  /** The ingredient list names refined wheat flour (F24); false when it is not visible. */
  refinedFlour: z.boolean(),
  values: z.strictObject({
    energyKcal: labelNumber,
    fatG: labelNumber,
    saturatedFatG: labelNumber,
    transFatG: labelNumber,
    cholesterolMg: labelNumber,
    sodiumMg: labelNumber,
    carbsTotalG: labelNumber,
    fiberG: labelNumber,
    sugarsTotalG: labelNumber,
    addedSugarG: labelNumber,
    proteinG: labelNumber,
  }),
});
export type LabelReading = z.infer<typeof LabelReading>;
