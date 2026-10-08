import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.ts';

describe('parseCsv', () => {
  it('reads a header and rows into records', () => {
    expect(parseCsv('code,name\nA1,Kiwicha\nA2,Arroz\n')).toEqual([
      { code: 'A1', name: 'Kiwicha' },
      { code: 'A2', name: 'Arroz' },
    ]);
  });

  it('keeps commas and escaped quotes inside a quoted field', () => {
    expect(parseCsv('code,name\nA1,"Kiwicha, achita o ""achis"""\n')).toEqual([
      { code: 'A1', name: 'Kiwicha, achita o "achis"' },
    ]);
  });

  it('accepts CRLF line ends and a missing final newline', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([{ a: '1', b: '2' }]);
  });

  it('keeps empty cells as empty strings', () => {
    expect(parseCsv('a,b,c\n1,,3\n')).toEqual([{ a: '1', b: '', c: '3' }]);
  });

  it('rejects a row with a different number of cells than the header', () => {
    expect(() => parseCsv('a,b\n1,2,3\n')).toThrow(/row 2/);
  });
});
