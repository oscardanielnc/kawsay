import type { ExpoConfig } from 'expo/config';

/** Two installable variants side by side (ADR 0010): the dev build never touches real data. */
const variant = process.env.APP_VARIANT === 'production' ? 'production' : 'development';
const isDev = variant === 'development';

export default (): ExpoConfig => ({
  name: isDev ? 'Kawsay Dev' : 'Kawsay',
  slug: 'kawsay',
  scheme: isDev ? 'kawsay-dev' : 'kawsay',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: isDev ? 'dev.oscarnavarro.kawsay.dev' : 'dev.oscarnavarro.kawsay',
    adaptiveIcon: {
      backgroundColor: '#F6F2E8',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: ['expo-router', 'expo-localization'],
  experiments: { typedRoutes: true },
  extra: { variant },
});
