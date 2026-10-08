import { base } from '@kawsay/config/eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(base(import.meta.dirname), {
  // packages/core is pure TypeScript shared by app and API: it imports nothing (architecture overview).
  files: ['packages/core/src/**/*.ts'],
  ignores: ['**/*.test.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: [{ regex: '^[^.]', message: 'packages/core imports nothing outside itself.' }] },
    ],
  },
});
