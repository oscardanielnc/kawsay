export type Cell = string | number | boolean | null;

function cell(value: Cell): string {
  if (value === null) return '';
  const text = typeof value === 'number' ? String(Math.round(value * 100) / 100) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with a header row; numbers keep two decimals at most, empty cells mean "no value". */
export function toCsv(columns: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return [columns.join(','), ...rows.map((row) => row.map(cell).join(','))].join('\n') + '\n';
}
