import type { TFunction } from 'i18next';
import { EXPORT_COLUMNS, type ExportFile } from './export';

/**
 * README.md of the export: what each file holds and what every column means, units and scales included, so an
 * external AI tool can analyse it without more context (F15). Text comes from i18n (ADR 0006).
 */
export function exportReadme(
  t: TFunction,
  { includePrivate }: { includePrivate: boolean },
): string {
  const files = (Object.keys(EXPORT_COLUMNS) as ExportFile[]).filter(
    (f) => f !== 'private' || includePrivate,
  );
  const sections = files.map((file) => {
    const columns = EXPORT_COLUMNS[file] as readonly string[];
    return [
      `## ${file}.csv`,
      '',
      t(`export.files.${file}`),
      '',
      ...columns.map(
        (column) =>
          `- \`${column}\`: ${t(`export.fields.${file}.${column}` as 'export.fields.days.date')}`,
      ),
    ].join('\n');
  });
  return [
    `# ${t('export.readmeTitle')}`,
    '',
    t('export.readmeIntro'),
    '',
    ...sections.flatMap((s) => [s, '']),
  ].join('\n');
}
