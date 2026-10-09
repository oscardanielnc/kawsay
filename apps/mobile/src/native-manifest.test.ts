/** @jest-environment node */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../native-manifest.json';

/**
 * OTA updates reach every APK with the same app version (ADR 0010: `appVersion` runtime policy). A native change
 * without a version bump would ship JavaScript to an APK that lacks its native code, so this test pins the native
 * dependencies to the version: change one → bump `version` in app.config.ts and update native-manifest.json.
 */
function nativeDependencies(): Record<string, string> {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies: Record<string, string>;
  };
  return Object.fromEntries(
    Object.entries(pkg.dependencies).filter(([name]) => {
      const dir = join('node_modules', name);
      return existsSync(join(dir, 'android')) || existsSync(join(dir, 'expo-module.config.json'));
    }),
  );
}

function appVersion(): string {
  const match = /version: '([\d.]+)'/.exec(readFileSync('app.config.ts', 'utf8'));
  if (!match?.[1]) throw new Error('app.config.ts has no version');
  return match[1];
}

describe('native manifest (ADR 0010)', () => {
  it('native dependencies only change together with the app version', () => {
    const current = { version: appVersion(), dependencies: nativeDependencies() };
    if (current.version === manifest.version) {
      expect(current.dependencies).toEqual(manifest.dependencies);
    } else {
      throw new Error(
        `Version ${current.version} is new: build a new APK and write native-manifest.json with ` +
          JSON.stringify(current),
      );
    }
  });
});
