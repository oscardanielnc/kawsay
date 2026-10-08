import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { strToU8, zipSync } from 'fflate';

/**
 * Zips text files on the phone and opens the system share sheet (save to Drive, send by mail…). Nothing leaves the
 * phone unless the user picks a destination (F15).
 */
export async function shareZip(
  name: string,
  files: Record<string, string>,
  dialogTitle: string,
): Promise<void> {
  const zip = zipSync(
    Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])),
  );
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(zip);
  if (await isAvailableAsync())
    await shareAsync(file.uri, { mimeType: 'application/zip', dialogTitle });
}
