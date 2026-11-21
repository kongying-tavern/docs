import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

/**
 * The native surface is every module plain Node imports while the site is
 * configured or built. ESLint enforces the specifier spelling repo-wide; this
 * test proves that graph actually loads, which linting cannot show.
 */

const projectRoot = fileURLToPath(new URL('../../../..', import.meta.url))
const CONFIG_DIR = '.vitepress/config'
const DATA_LOADERS = ['posts', 'forumBlogPosts', 'forumDocumentLinks'].map(name => `src/data/${name}.data.ts`)

/** Config modules are enumerated so a new one joins the surface automatically. */
function nativeEntries(): string[] {
  const configModules = readdirSync(path.join(projectRoot, CONFIG_DIR))
    .filter(file => file.endsWith('.ts'))
    .map(file => `${CONFIG_DIR}/${file}`)
  return [
    '.vitepress/config.ts',
    ...configModules,
    'vite.config.ts',
    'unocss.config.ts',
    'x18n.config.ts',
    ...DATA_LOADERS,
  ]
}

test('the native surface loads with the Node runtime', { timeout: 60_000 }, () => {
  const script = `
    const { loadConfigFromFile } = await import('vite')
    const { resolveConfig } = await import('vitepress')
    for (const file of ['.vitepress/config.ts', 'vite.config.ts']) {
      const result = await loadConfigFromFile(
        { command: 'serve', mode: 'development' },
        file, process.cwd(), 'warn', undefined, 'native',
      )
      if (!result) throw new Error('Config not loaded: ' + file)
      console.log('native config: ' + file)
    }
    globalThis.VITEPRESS_CONFIG = await resolveConfig(process.cwd(), 'serve', 'development')
    for (const file of ${JSON.stringify(nativeEntries())}) {
      await import('./' + file)
      console.log('native module: ' + file)
    }
  `
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 55_000,
  })

  assert.match(output, /native config: \.vitepress\/config\.ts/)
  assert.match(output, /native config: vite\.config\.ts/)
  for (const file of nativeEntries()) {
    assert.ok(output.includes(`native module: ${file}`), `native module did not load: ${file}`)
  }
})
