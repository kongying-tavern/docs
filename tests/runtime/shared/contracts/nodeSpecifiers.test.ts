import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const scanRoots = ['src', 'data', 'tests', 'eslint', '.vitepress']
const skipDirs = new Set(['node_modules', 'dist', 'cache', '.temp'])
const sourceFile = /\.(?:ts|mts|tsx|vue)$/
const specifierPattern = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry))
      continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory())
      sourceFiles(full, found)
    else if (sourceFile.test(entry))
      found.push(full)
  }
  return found
}

/**
 * Node reserves `#` for package imports and requires an identifier character
 * right after it, so `#/...` is never a valid specifier. The project uses
 * `#data/...`, which satisfies that rule and is declared in package.json
 * `imports`. A stray `#/...` specifier would pass `tsc --noEmit` via tsconfig
 * `paths` yet fail in tooling that follows Node's resolution rules.
 */
test('internal import specifiers avoid the invalid #/ form', () => {
  const invalid: string[] = []
  for (const root of scanRoots) {
    const dir = path.join(projectRoot, root)
    if (!existsSync(dir))
      continue
    for (const file of sourceFiles(dir)) {
      readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
        for (const match of line.matchAll(specifierPattern)) {
          if (match[1].startsWith('#/'))
            invalid.push(`${path.relative(projectRoot, file)}:${index + 1}  ${match[1]}`)
        }
      })
    }
  }
  assert.deepEqual(invalid, [], `Invalid '#/' specifiers (use #data aliases):\n${invalid.join('\n')}`)
})
