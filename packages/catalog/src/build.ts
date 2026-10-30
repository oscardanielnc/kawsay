import { mkdirSync, writeFileSync } from 'node:fs';
import { buildCatalog, readInputs } from './build-catalog.ts';
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
