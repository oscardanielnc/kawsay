import type { ExpoConfig } from 'expo/config';
import path from 'node:path';

/** Font files embedded in the APK (design T2: Bricolage Grotesque titles, Figtree text). */
/**
 * Relative, with `/`: the path is part of the runtime fingerprint, so an absolute Windows path would give the build
 * server another runtime version and OTA updates published from this PC would never reach the app.
 */
const font = (family: string, file: string) =>
  path
    .relative(
      __dirname,
      path.join(path.dirname(require.resolve(`@expo-google-fonts/${family}/package.json`)), file),
    )
    .split(path.sep)
    .join('/');
const FONTS = [
  font('bricolage-grotesque', '600SemiBold/BricolageGrotesque_600SemiBold.ttf'),
  font('bricolage-grotesque', '700Bold/BricolageGrotesque_700Bold.ttf'),
  font('figtree', '400Regular/Figtree_400Regular.ttf'),
  font('figtree', '600SemiBold/Figtree_600SemiBold.ttf'),
];

/** Two installable variants side by side (ADR 0010): the dev build never touches real data. */
const variant = process.env.APP_VARIANT === 'production' ? 'production' : 'development';
const isDev = variant === 'development';

/** API of each variant (ADR 0011): the dev build syncs to the dev database, never to real data. */
const API_URL =
  process.env.KAWSAY_API_URL ??
  (isDev ? 'https://kawsay-dev.oscarnavarro.dev/v1' : 'https://kawsay.oscarnavarro.dev/v1');

/** EAS project on the owner's Expo account (created 2026-10-08). */
const EAS_PROJECT_ID = '4e3941ab-d6d1-4ad5-948d-247ed4ecb796';

export default (): ExpoConfig => ({
  name: isDev ? 'Kawsay Dev' : 'Kawsay',
  slug: 'kawsay',
  owner: 'oscardanieldev',
  scheme: isDev ? 'kawsay-dev' : 'kawsay',
  version: '0.2.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: isDev ? 'dev.oscarnavarro.kawsay.dev' : 'dev.oscarnavarro.kawsay',
    adaptiveIcon: {
      backgroundColor: '#E5EEFB',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  // Updates reach APKs of the same version; src/native-manifest.test.ts forces a bump when a native dependency changes.
  runtimeVersion: { policy: 'appVersion' },
  // Download on launch in the background; the new version applies on the next launch (ADR 0010).
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-updates',
    'expo-sqlite',
    'expo-secure-store',
    ['expo-local-authentication', { faceIDPermission: false }],
    'expo-notifications',
    ['expo-font', { fonts: FONTS }],
    'expo-sharing',
    'expo-file-system',
    // Label photos (F23 piece 3): camera and gallery; nothing is stored on the phone or the server.
    ['expo-image-picker', { microphonePermission: false }],
  ],
  experiments: { typedRoutes: true },
  extra: { variant, apiUrl: API_URL, eas: { projectId: EAS_PROJECT_ID } },
});
