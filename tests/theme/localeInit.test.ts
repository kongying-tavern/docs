import type { DefaultTheme, LocaleConfig } from 'vitepress'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { JSON_SCHEMA, load } from 'js-yaml'
import { loadConfigFromFile } from 'vite'
import { onTestFinished, test } from 'vitest'

function fixture(template: 'zh' | 'en' = 'en') {
  const root = mkdtempSync(join(tmpdir(), 'vitepress-locale-'))
  onTestFinished(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of ['scripts/locales', `src/${template}/blog`, 'src/constants', '.vitepress/config', '.vitepress/theme', '.vitepress/locales'])
    mkdirSync(join(root, dir), { recursive: true })
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'junction')
  for (const path of [
    'scripts/initLocale.ts',
    'scripts/locales/importers.ts',
    'src/constants/site.ts',
    '.vitepress/config/siteLocale.ts',
    '.vitepress/config/localeDirs.ts',
    '.vitepress/config/locales.ts',
    '.vitepress/locales/common.ts',
    '.vitepress/theme/utils.ts',
  ])
    cpSync(resolve(path), join(root, path))
  cpSync(resolve(`.vitepress/locales/${template}`), join(root, `.vitepress/locales/${template}`), { recursive: true })
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')
  writeFileSync(join(root, 'lunaria.config.json'), JSON.stringify({ locales: [{ lang: template, label: template }] }))
  writeFileSync(join(root, `src/${template}/blog/[path].paths.ts`), `usePostData('${template.toUpperCase()}')`)
  for (const page of ['index.md', 'frontmatter.md', 'md-enhance-guide.md', 'announcement.md'])
    writeFileSync(join(root, `src/${template}/${page}`), `# ${page}`)
  return root
}

function initialize(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), join(root, 'scripts/initLocale.ts'), '--code', 'fr', '--label', 'Français', ...args], { encoding: 'utf8' })
}

test.each(['zh', 'en'] as const)('init:locale loads a complete language from the real %s template', async (template) => {
  const root = fixture(template)
  const originalSite = readFileSync(join(root, `.vitepress/locales/${template}/site.yml`), 'utf8')
  const result = initialize(root, '--template', template, '--lang', 'fr-CA')
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(readFileSync(join(root, `.vitepress/locales/${template}/site.yml`), 'utf8'), originalSite)
  assert.deepEqual(load(readFileSync(join(root, '.vitepress/locales/fr/site.yml'), 'utf8'), { schema: JSON_SCHEMA }), {
    ...load(originalSite, { schema: JSON_SCHEMA }) as object,
    label: 'Français',
    lang: 'fr-CA',
  })
  assert.equal(readFileSync(join(root, '.vitepress/locales/fr/config.ts'), 'utf8'), readFileSync(join(root, `.vitepress/locales/${template}/config.ts`), 'utf8'))
  for (const file of ['ui', 'forum', 'settings', 'payment', 'asideLinks', 'docReaction', 'staff', 'team', 'changelog'])
    assert.equal(readFileSync(join(root, `.vitepress/locales/fr/${file}.yml`), 'utf8'), readFileSync(join(root, `.vitepress/locales/${template}/${file}.yml`), 'utf8'))
  assert.equal(readFileSync(join(root, 'src/fr/blog/[path].paths.ts'), 'utf8'), 'usePostData(\'FR\')')
  assert.equal(existsSync(join(root, 'src/fr/index.md')), true)
  for (const page of ['frontmatter.md', 'md-enhance-guide.md', 'announcement.md'])
    assert.equal(existsSync(join(root, `src/fr/${page}`)), template !== 'zh')
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'lunaria.config.json'), 'utf8')).locales.at(-1), { lang: 'fr', label: 'Français' })

  const configPath = join(root, 'vite.config.ts')
  writeFileSync(configPath, `import { createLocalesConfig } from './.vitepress/config/locales.ts'
export default async () => ({ define: { locales: await createLocalesConfig() } })`)
  const bundled = await loadConfigFromFile({ command: 'build', mode: 'production' }, configPath, root)
  const locales = bundled?.config.define?.locales as LocaleConfig<DefaultTheme.Config>
  assert.equal(locales.fr.label, 'Français')
  assert.equal(locales.fr.lang, 'fr-CA')
  assert.ok('/fr/manual' in locales.fr.themeConfig!.sidebar!)
  assert.ok(result.stdout.includes('pnpm i18n:check'))
})

test('init:locale defaults to a language-only tag without guessing a region', () => {
  const root = fixture()
  const result = initialize(root, '--template', 'en')
  assert.equal(result.status, 0, result.stderr || result.stdout)
  const site = load(readFileSync(join(root, '.vitepress/locales/fr/site.yml'), 'utf8')) as { lang: string }
  assert.equal(site.lang, 'fr')
})

test.each(['source-directory', 'locale-directory', 'lunaria-registration', 'invalid-tag', 'mismatched-tag', 'invalid-site-template', 'invalid-blog-template'] as const)('init:locale rejects %s before creating or modifying target files', (problem) => {
  const root = fixture()
  const lunaria = join(root, 'lunaria.config.json')
  if (problem === 'source-directory') {
    mkdirSync(join(root, 'src/fr'))
    writeFileSync(join(root, 'src/fr/keep.md'), 'Keep this file')
  }
  if (problem === 'locale-directory')
    mkdirSync(join(root, '.vitepress/locales/fr'))
  if (problem === 'lunaria-registration')
    writeFileSync(lunaria, '{"locales":[{"lang":"fr","label":"Existing"}]}')
  if (problem === 'invalid-site-template')
    writeFileSync(join(root, '.vitepress/locales/en/site.yml'), 'Incomplete')
  if (problem === 'invalid-blog-template')
    writeFileSync(join(root, 'src/en/blog/[path].paths.ts'), 'Invalid blog configuration')
  const originalRegistry = readFileSync(lunaria, 'utf8')
  const tag = problem === 'invalid-tag' ? 'fr_XX' : problem === 'mismatched-tag' ? 'ja-JP' : 'fr'
  const result = initialize(root, '--template', 'en', '--lang', tag)
  assert.equal(result.status, 1)
  assert.equal(readFileSync(lunaria, 'utf8'), originalRegistry)
  assert.equal(existsSync(join(root, '.vitepress/config/localeImporters.ts')), false)
  assert.equal(existsSync(join(root, '.vitepress/locales/fr/site.yml')), false)
  assert.equal(existsSync(join(root, 'src/fr/index.md')), false)
  if (problem === 'source-directory')
    assert.equal(readFileSync(join(root, 'src/fr/keep.md'), 'utf8'), 'Keep this file')
})
