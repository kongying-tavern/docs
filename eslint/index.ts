import type { ESLint } from 'eslint'
import { nativeImportPath, preferBarrelImport } from './rules/importRules.ts'

/**
 * Local ESLint plugin. Rules stay in `rules/`; this module only assembles them so
 * `eslint.config.ts` reads as configuration instead of registration plumbing.
 */
export const localPlugin: ESLint.Plugin = {
  rules: {
    'native-import-path': nativeImportPath,
    'prefer-barrel-import': preferBarrelImport,
  },
}
