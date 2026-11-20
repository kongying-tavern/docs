import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { PATH_ALIASES } from '../../.vitepress/config/aliases.ts'

interface TsConfig {
  compilerOptions: {
    paths: Record<string, string[]>
  }
}

test('tsconfig mirrors the runtime path aliases', () => {
  const { compilerOptions } = JSON.parse(
    readFileSync(new URL('../../tsconfig.json', import.meta.url), 'utf8'),
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
