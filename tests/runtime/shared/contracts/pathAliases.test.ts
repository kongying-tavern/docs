import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { PATH_ALIASES } from '../../../../.vitepress/config/aliases.ts'

interface TsConfig {
  compilerOptions: {
    paths: Record<string, string[]>
  }
}

interface PackageJson {
  imports?: Record<string, string>
}

test('tsconfig mirrors the runtime path aliases', () => {
  const { compilerOptions } = JSON.parse(
    readFileSync(new URL('../../../../tsconfig.json', import.meta.url), 'utf8'),
  ) as TsConfig
  const { paths } = compilerOptions

  for (const { prefix, root } of PATH_ALIASES) {
    const expected = root === '.' ? './*' : `./${root}/*`
    assert.deepEqual(paths[`${prefix}/*`], [expected], `tsconfig paths for ${prefix}/* must be ${expected}`)
  }

  // An alias that only exists in tsconfig would typecheck while breaking the runtime.
  const mirrored = new Set([...PATH_ALIASES.map(({ prefix }) => `${prefix}/*`), 'vite'])
  assert.deepEqual(
    Object.keys(paths).filter(key => !mirrored.has(key)),
    [],
    'tsconfig declares a path alias that the runtime table does not',
  )
})

test('package.json imports mirror #-prefixed aliases for Node resolution', () => {
  const { imports = {} } = JSON.parse(
    readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8'),
  ) as PackageJson

  for (const { prefix, root } of PATH_ALIASES) {
    if (!prefix.startsWith('#'))
      continue
    assert.equal(imports[`${prefix}/*`], `./${root}/*`, `package.json imports for ${prefix}/* must be ./${root}/*`)
  }

  // Node's language service resolves `#` through imports, not tsconfig paths.
  // A missing or stale entry here reproduces the IDE TS2307 this branch fixes.
  const mirrored = new Set(PATH_ALIASES.filter(({ prefix }) => prefix.startsWith('#')).map(({ prefix }) => `${prefix}/*`))
  assert.deepEqual(
    Object.keys(imports).filter(key => !mirrored.has(key)),
    [],
    'package.json declares a # import that the runtime table does not',
  )
})
