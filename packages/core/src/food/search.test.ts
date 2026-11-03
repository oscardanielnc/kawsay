import { describe, expect, it } from 'vitest';
import { normalize, searchCatalog, type Searchable } from './search';

const items: Searchable[] = [
  { kind: 'food', id: 'platano-seda', name: 'Plátano de seda', source: 'INS' },
  { kind: 'food', id: 'platano-maduro', name: 'Plátano maduro (bellaco)', source: 'INS' },
  { kind: 'dish', id: 'maduro-frito', name: 'Plátano maduro frito', source: 'dish' },
  { kind: 'dish', id: 'mini-juane-pollo', name: 'Mini juane de pollo (calle)', source: 'dish' },
  { kind: 'food', id: 'pepino', name: 'Pepino', source: 'USDA' },
  { kind: 'food', id: 'pan-frances', name: 'Pan francés', source: 'INS' },
  { kind: 'food', id: 'oreo', name: 'Oreo chocolate', source: 'label' },
];

const ids = (query: string) => searchCatalog(query, items).map((item) => item.id);

describe('normalize', () => {
  it('drops case and accents', () => {
    expect(normalize('Plátano  FRANCÉS')).toBe('platano frances');
  });
});

describe('searchCatalog (F06)', () => {
  it('search order (ADR 0028): curated, INS group S, estimated recipes, then generic INS foods', () => {
    const arroz: Searchable[] = [
      { kind: 'food', id: 'ins-a1', name: 'Arroz blanco', source: 'INS', generic: true },
      { kind: 'dish', id: 'gen-arroz-arabe', name: 'Arroz árabe navideño', source: 'estimated' },
      { kind: 'dish', id: 'ins-ss12', name: 'Arroz árabe con pollo', source: 'INS-S' },
      { kind: 'dish', id: 'arroz-pollo', name: 'Arroz con pollo', source: 'dish' },
    ];
    expect(searchCatalog('arroz', arroz).map((i) => i.id)).toEqual([
      'arroz-pollo',
      'ins-ss12',
      'gen-arroz-arabe',
      'ins-a1',
    ]);
  });

  it('generic INS foods come after every curated result, USDA and labels included (F23, ADR 0021)', () => {
    const quinoa: Searchable[] = [
      { kind: 'food', id: 'ins-a53', name: 'Quinua cocida', source: 'INS', generic: true },
      { kind: 'food', id: 'quinua-usda', name: 'Quinua', source: 'USDA' },
      { kind: 'dish', id: 'quinua-atamalada', name: 'Quinua atamalada', source: 'dish' },
    ];
    expect(searchCatalog('quinua', quinoa).map((i) => i.id)).toEqual([
      'quinua-atamalada',
      'quinua-usda',
      'ins-a53',
    ]);
  });

  it('"plátano" finds Peruvian entries; dishes first, then INS foods', () => {
    expect(ids('plátano')).toEqual(['maduro-frito', 'platano-seda', 'platano-maduro']);
  });

  it('works without accents', () => {
    expect(ids('platano')).toEqual(ids('plátano'));
  });

  it('matches word prefixes, in any order', () => {
    expect(ids('mad plat')).toEqual(['maduro-frito', 'platano-maduro']);
  });

  it('tolerates one typo in a word of 4+ letters', () => {
    expect(ids('juanr')).toEqual(['mini-juane-pollo']);
    expect(ids('frnces')).toEqual(['pan-frances']);
  });

  it('a short word must match exactly as a prefix (no typo tolerance below 4 letters)', () => {
    expect(ids('pam')).toEqual([]);
  });

  it('INS before USDA before labels when both match', () => {
    const mixed: Searchable[] = [
      { kind: 'food', id: 'b', name: 'Choco bar', source: 'label' },
      { kind: 'food', id: 'u', name: 'Choco usda', source: 'USDA' },
      { kind: 'food', id: 'i', name: 'Choco ins', source: 'INS' },
    ];
    expect(searchCatalog('choco', mixed).map((x) => x.id)).toEqual(['i', 'u', 'b']);
  });

  it('Spanish plurals find the singular name: "tallarines verdes" → "Tallarín verde", "uvas" → "uva"', () => {
    const dishes: Searchable[] = [
      { kind: 'dish', id: 'tallarin-verde', name: 'Tallarín verde', source: 'dish' },
      { kind: 'dish', id: 'refresco-uva', name: 'Refresco de uva', source: 'dish' },
    ];
    const find = (query: string) => searchCatalog(query, dishes).map((x) => x.id);
    expect(find('tallarines verdes')).toEqual(['tallarin-verde']);
    expect(find('refresco de uvas')).toEqual(['refresco-uva']);
  });

  it('an empty query returns nothing (the sheet shows recent dishes instead)', () => {
    expect(ids('  ')).toEqual([]);
  });
});
