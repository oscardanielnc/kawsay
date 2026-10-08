import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import i18next from 'eslint-plugin-i18next';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** Shared flat config. `rootDir` is the directory of the repo's eslint.config.mjs. */
export function base(rootDir) {
  return [
    {
      ignores: [
        '**/dist/**',
        '**/coverage/**',
        '**/.turbo/**',
        '**/node_modules/**',
        '**/.expo/**',
        '**/expo-env.d.ts',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir: rootDir },
      },
    },
    {
      files: ['**/*.js', '**/*.mjs', '**/*.config.ts', '**/app.config.ts'],
      ...tseslint.configs.disableTypeChecked,
    },
    {
      rules: {
        'no-console': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ];
}

/**
 * React Native app rules: hooks, no hard-coded UI text (ADR 0006) and feature boundaries (ADR 0003).
 * `app` is the app folder relative to the repo root, e.g. `apps/mobile`.
 */
export function reactNative(app) {
  // Patterns match from any working directory: ESLint may run from the repo root or from the app.
  const element = (type, path, capture) => ({
    type,
    pattern: `**/${path}`,
    ...(capture && { capture }),
  });
  return [
    {
      files: [`${app}/**/*.{ts,tsx}`],
      extends: [reactHooks.configs.flat['recommended-latest']],
    },
    {
      files: [`${app}/**/*.tsx`],
      ignores: ['**/*.test.tsx'],
      plugins: { i18next },
      rules: { 'i18next/no-literal-string': ['error', { mode: 'jsx-text-only' }] },
    },
    {
      // routes (app/) → features → shared (components/, lib/). A feature never imports another feature.
      files: [`${app}/app/**/*.{ts,tsx}`, `${app}/src/**/*.{ts,tsx}`],
      ignores: ['**/*.test.{ts,tsx}'],
      plugins: { boundaries },
      settings: {
        'import/resolver': { typescript: { project: `${app}/tsconfig.json` } },
        'boundaries/elements': [
          element('routes', 'app'),
          element('feature', 'src/features/*', ['prefix', 'feature']),
          element('shared', 'src/components'),
          element('shared', 'src/lib'),
        ],
      },
      rules: {
        'boundaries/dependencies': [
          'error',
          {
            default: 'allow',
            policies: [
              {
                from: { element: { type: 'feature' } },
                disallow: { to: { element: { types: { anyOf: ['routes'] } } } },
              },
              {
                from: {
                  element: {
                    type: 'feature',
                    captured: { feature: '{{ from.captured.feature }}' },
                  },
                },
                disallow: {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { feature: '!{{ from.captured.feature }}' },
                    },
                  },
                },
              },
              {
                from: { element: { type: 'shared' } },
                disallow: { to: { element: { types: { anyOf: ['routes', 'feature'] } } } },
              },
            ],
          },
        ],
      },
    },
  ];
}
