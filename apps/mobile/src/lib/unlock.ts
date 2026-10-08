import { authenticateAsync, getEnrolledLevelAsync, SecurityLevel } from 'expo-local-authentication';

/**
 * Asks for the fingerprint, or the phone's PIN or pattern when there is no fingerprint (F12). Without any screen lock
 * the private log stays closed: nothing would protect it.
 */
export async function unlockWithDevice(promptMessage: string): Promise<boolean> {
  if ((await getEnrolledLevelAsync()) === SecurityLevel.NONE) return false;
  const result = await authenticateAsync({ promptMessage, disableDeviceFallback: false });
  return result.success;
}
