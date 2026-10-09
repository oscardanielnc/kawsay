import { describe, expect, it } from 'vitest';
import { buildCatalog, readInputs } from './build-catalog.ts';
import { renderReport } from './report.ts';

const report = renderReport(buildCatalog(readInputs(new URL('..', import.meta.url))));

describe('renderReport', () => {
  it('lists what a person has to act on', () => {
    for (const section of [
      '## Summary',
      '## Unmatched',
      '## Labels to read',
      '## Proxies',
      '## Cooked from raw',
      '## Group S cross-check',
      '## Dishes with incomplete energy',
    ]) {
      expect(report).toContain(section);
    }
  });

  it('the real seed leaves nothing unmatched and no label to read', () => {
    expect(report).toMatch(/## Unmatched\n\n_None._/);
    expect(report).toMatch(/## Labels to read\n\n_None._/);
  });

  it('names each proxy and why', () => {
    expect(report).toMatch(/manjar-blanco.*Leche condensada/);
  });

  it('shows each conversion with its source', () => {
    expect(report).toMatch(/papa-sancochada.*1\.02.*TAFERA 2016/);
  });
});
