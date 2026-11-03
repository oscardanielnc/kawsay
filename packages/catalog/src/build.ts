import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildCatalog, readInputs } from './build-catalog.ts';
import { aiFoodList, buildRemoteCatalog, type EstimatedDishRow } from './remote-catalog.ts';
import { renderReport } from './report.ts';

const root = new URL('..', import.meta.url);
const inputs = readInputs(root);
const catalog = buildCatalog(inputs);
mkdirSync(new URL('dist/', root), { recursive: true });
mkdirSync(new URL('reports/', root), { recursive: true });
writeFileSync(new URL('dist/catalog.json', root), JSON.stringify(catalog));
writeFileSync(new URL('reports/import.md', root), renderReport(catalog, inputs.addedSugar));
process.stdout.write(
  `${catalog.foods.length} foods, ${catalog.dishes.length} dishes -> dist/catalog.json, reports/import.md\n`,
);

// F23 piece 5: what the API serves (committed, so a deploy publishes it) and the food list for "Crear con IA".
const estimatedFile = new URL('seed/generated/estimated-dishes.json', root);
const rows = existsSync(estimatedFile)
  ? (JSON.parse(readFileSync(estimatedFile, 'utf8')) as { dishes: EstimatedDishRow[] }).dishes
  : [];
const remote = buildRemoteCatalog(catalog, rows);
mkdirSync(new URL('remote/', root), { recursive: true });
writeFileSync(new URL('remote/dishes.json', root), JSON.stringify(remote));
writeFileSync(new URL('remote/foods.json', root), JSON.stringify(aiFoodList(catalog)));
process.stdout
  .write(`${remote.dishes.length} estimated dishes -> remote/dishes.json (${remote.version})
`);
