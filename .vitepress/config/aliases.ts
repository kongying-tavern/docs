/**
 * Single source of truth for the path aliases.
 *
 * `vite.config.ts` expands these into `resolve.alias`, the ESLint rule
 * `local/native-import-path` and the MDC resolver resolve through `matchPathAlias`,
 * and `tsconfig.json` mirrors the same table. `tests/runtime/shared/contracts/pathAliases.test.ts`
 * fails when that mirror drifts.
 */
export interface PathAlias {
  /** Import prefix, e.g. `@theme`. */
  prefix: string
  /** Target directory relative to the repository root, POSIX separators. */
  root: string
}

/**
 * Longest prefix first: `@theme/...` must match before the bare `@` alias.
 */
export const PATH_ALIASES: readonly PathAlias[] = [
  { prefix: '@theme', root: '.vitepress/theme' },
  { prefix: '~', root: '.vitepress' },
  { prefix: '@', root: '.' },
  { prefix: '#data', root: 'data' },
]

/** Theme-internal imports also feed the MDC component registry. */
export const THEME_ALIAS = PATH_ALIASES[0]

export interface PathAliasMatch {
  alias: PathAlias
  /** Specifier with the prefix removed, e.g. `components/ui` for `@theme/components/ui`. */
  rest: string
}

/** Match a bare alias specifier against the alias table. */
export function matchPathAlias(specifier: string): PathAliasMatch | null {
  for (const alias of PATH_ALIASES) {
    if (specifier === alias.prefix)
      return { alias, rest: '' }
    if (specifier.startsWith(`${alias.prefix}/`))
      return { alias, rest: specifier.slice(alias.prefix.length + 1) }
  }
  return null
}
