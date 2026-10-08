import { addDays } from '@kawsay/core/shared/local-date';
import { useTranslation } from 'react-i18next';
import { buildExport } from '@/compose/export';
import { exportReadme } from '@/compose/export-readme';
import { ExportScreen } from '@/features/export/ExportScreen';
import { useDb } from '@/lib/db/DatabaseProvider';
import { shareZip } from '@/lib/share-zip';
import { today } from '@/lib/today';
import { unlockWithDevice } from '@/lib/unlock';

/** Export (F15): built on the phone from the local database, shared as one ZIP. */
export default function ExportRoute() {
  const { t } = useTranslation();
  const { db } = useDb();
  return (
    <ExportScreen
      onUnlockPrivate={() => unlockWithDevice(t('private.prompt'))}
      onExport={async ({ days, includePrivate }) => {
        const to = today();
        const { files } = await buildExport(db, {
          from: addDays(to, -(days - 1)),
          to,
          includePrivate,
        });
        const name = `kawsay-${to}.zip`;
        await shareZip(
          name,
          { ...files, 'README.md': exportReadme(t, { includePrivate }) },
          t('export.title'),
        );
        return name;
      }}
    />
  );
}
