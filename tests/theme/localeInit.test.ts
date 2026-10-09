import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { loadConfigFromFile } from 'vite'
import { test } from 'vitest'

test('init:locale registers a new language in the bundled Vite config', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'vitepress-locale-'))
  t.onTestFinished(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of ['scripts/locales', 'src/en/blog', '.vitepress/locales/en', '.vitepress/locales/common', '.vitepress/config'])
    mkdirSync(join(root, dir), { recursive: true })
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'junction')
  cpSync(resolve('scripts/initLocale.ts'), join(root, 'scripts/initLocale.ts'))
  cpSync(resolve('scripts/locales/importers.ts'), join(root, 'scripts/locales/importers.ts'))
  cpSync(resolve('.vitepress/locales/common/LanguageSuggestBar.ts'), join(root, '.vitepress/locales/common/LanguageSuggestBar.ts'))
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')
  writeFileSync(join(root, 'lunaria.config.json'), '{"locales":[{"lang":"en","label":"English"}]}')
  writeFileSync(join(root, 'src/en/blog/[path].paths.ts'), 'usePostData(\'EN\')')
  writeFileSync(join(root, '.vitepress/locales/en/index.ts'), 'export const enConfig = {}\nexport const label = \'English\'\nexport const lang = \'en-US\'\n')
  writeFileSync(join(root, '.vitepress/locales/en/constants.ts'), 'export default { LOCAL_CODE: \'en-US\', LOCAL_BASE: \'/en\', META_URL: \'https://yuanshen.site/docs/en/\' }\n')

  const result = spawnSync(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), join(root, 'scripts/initLocale.ts'), '--code', 'fr', '--label', 'Français', '--template', 'en'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(readFileSync(join(root, '.vitepress/config/localeImporters.ts'), 'utf8'), /import\('\.\.\/locales\/fr\/index\.ts'\)/)

  const configPath = join(root, 'vite.config.ts')
  writeFileSync(configPath, `import { localeImporters } from './.vitepress/config/localeImporters.ts'
export default async () => ({
  define: { localeLabel: (await localeImporters.fr.index()).label },
})`)
  const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, configPath, root)
  assert.equal(loaded?.config.define?.localeLabel, 'Français')
})
