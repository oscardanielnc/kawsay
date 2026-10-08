import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header, quotes commas and quotes, and leaves missing values empty', () => {
    expect(
      toCsv(
        ['name', 'kcal', 'note'],
        [
          ['Lomo saltado', 693.456, null],
          ['Pan, con "palta"', 250, 'línea\notra'],
        ],
      ),
    ).toBe('name,kcal,note\nLomo saltado,693.46,\n"Pan, con ""palta""",250,"línea\notra"\n');
  });
});
