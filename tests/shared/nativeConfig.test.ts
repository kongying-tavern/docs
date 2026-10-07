import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

test('site and Vite configuration load with the native Node runtime', { timeout: 35_000 }, () => {
  const script = `
    import { loadConfigFromFile } from 'vite'
    import { resolveConfig } from 'vitepress'
    for (const file of ['.vitepress/config.ts', 'vite.config.ts']) {
      const result = await loadConfigFromFile(
        { command: 'serve', mode: 'development' },
        file, process.cwd(), 'warn', undefined, 'native',
      )
      if (!result) throw new Error('Config not loaded: ' + file)
      console.log('Native config loaded: ' + file)
    }
    globalThis.VITEPRESS_CONFIG = await resolveConfig(process.cwd(), 'serve', 'development')
    for (const file of ['posts', 'forumBlogPosts', 'forumDocumentLinks']) {
      await import('./src/_data/' + file + '.data.ts')
      console.log('Native data loader loaded: ' + file)
    }
  `
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    encoding: 'utf8',
    timeout: 30_000,
  })
  assert.match(output, /Native config loaded: \.vitepress\/config\.ts/)
  assert.match(output, /Native config loaded: vite\.config\.ts/)
  for (const file of ['posts', 'forumBlogPosts', 'forumDocumentLinks']) {
    assert.ok(output.includes(`Native data loader loaded: ${file}`))
  }
})
