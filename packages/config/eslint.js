import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Shared flat config. `rootDir` is the directory of the repo's eslint.config.mjs. */
export function base(rootDir) {
  return [
    {
      ignores: ['**/dist/**', '**/coverage/**', '**/.turbo/**', '**/node_modules/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir: rootDir },
      },
    },
    {
      files: ['**/*.js', '**/*.mjs', '**/*.config.ts'],
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
