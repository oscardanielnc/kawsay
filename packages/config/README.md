# @kawsay/config

Shared tooling config for every package.

| Export                              | Use it from                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `@kawsay/config/tsconfig.base.json` | A package `tsconfig.json`: `"extends": "@kawsay/config/tsconfig.base.json"` |
| `@kawsay/config/eslint`             | The root `eslint.config.mjs` (`base(import.meta.dirname)`)                  |
| `@kawsay/config/prettier`           | The root `package.json` `"prettier"` field                                  |

TypeScript runs in strict mode with `noUncheckedIndexedAccess`: indexing an array or record may return `undefined`.
