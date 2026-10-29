import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSON_SCHEMA, load } from 'js-yaml'
import { describe, expect, onTestFinished, test } from 'vitest'
import { getLocaleDirs } from '../../.vitepress/config/localeDirs.ts'
import { DEFAULT_LOCALE } from '../../.vitepress/locales/common.ts'
import config from '../../x18n.config.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const cli = join(root, 'node_modules/@x18n/cli/bin.mjs')

function fixture(files: Record<string, string>, pattern = 'locales/{locale}.json') {
  const directory = mkdtempSync(join(tmpdir(), 'kongying-x18n-test-'))
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }))
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(directory, path)), { recursive: true })
    writeFileSync(join(directory, path), text)
  }
  writeFileSync(join(directory, 'x18n.config.json'), JSON.stringify({
    sourceLocale: 'zh',
    locales: ['zh', 'en', 'ja'],
    presets: ['vue-i18n'],
    history: false,
    resources: [{ pattern }],
    usage: { include: ['src/**/*.ts'] },
    checks: config.checks,
    glossary: config.glossary,
  }))
  return directory
}

function command(args: string[], directory = root) {
  return JSON.parse(execFileSync(process.execPath, [cli, ...args, '--root', directory, '--json', '--no-cache'], {
    cwd: tmpdir(),
    encoding: 'utf8',
    timeout: 30000,
  }))
}

function checkFixture(source: Record<string, unknown>, target: Record<string, unknown>, code = '', targetLocale = 'en') {
  const directory = fixture({
    'locales/zh.json': JSON.stringify(source),
    [`locales/${targetLocale}.json`]: JSON.stringify(target),
    'src/example.ts': code,
  })
  const result = spawnSync(process.execPath, [cli, 'check', '--root', directory, '--json', '--no-cache'], {
    encoding: 'utf8',
    timeout: 30000,
  })
  expect(result.error).toBeUndefined()
  return { exitCode: result.status, report: JSON.parse(result.stdout) }
}

describe('x18n native YAML integration', () => {
  test('uses the native vue-i18n scanner for translation calls and missing keys', () => {
    const result = checkFixture({ forum: { title: '标题' } }, { forum: { title: 'Title' } }, `
      const { t } = useI18n()
      t('forum.title')
      t('forum.MISSING')
    `)
    expect(result.report.diagnostics.filter((item: { code: string }) => item.code === 'missing-key')
      .map((item: { key: string }) => item.key)).toEqual(['forum.MISSING'])
  })

  test('checks actual message and component-slot placeholders through the native preset', () => {
    const result = checkFixture(
      { greeting: '你好 {name}', login: '请 {login}' },
      { greeting: 'Hello {WRONG}', login: 'Please {WRONG}' },
    )
    expect(result.exitCode).toBe(1)
    expect(result.report.diagnostics.filter((item: { code: string }) => item.code === 'placeholder-mismatch'))
      .toHaveLength(2)
    expect(checkFixture(
      { greeting: '你好 {name}', login: '请 {login}' },
      { greeting: 'Hello {name}', login: 'Please {login}' },
    ).exitCode).toBe(0)
  })

  test('leaves identical values for human review without project-specific exceptions', () => {
    const messages = { title: '社区运营', brand: 'Gitee', save: '保存', link: '/feedback/' }
    const result = checkFixture(messages, messages, '', 'ja')
    expect(result.exitCode).toBe(0)
    const diagnostics = result.report.diagnostics.filter((item: { code: string }) => item.code === 'identical-to-source')
    expect(diagnostics.map((item: { key: string }) => item.key).sort()).toEqual(['brand', 'link', 'save', 'title'])
    expect(diagnostics.every((item: { severity: string }) => item.severity === 'info')).toBe(true)
  })

  test('uses native glossary configuration and placeholder syntax in translation prompts', () => {
    const directory = fixture({
      'locales/zh.json': JSON.stringify({ forum: { title: '反馈论坛 {name}' } }),
      'locales/en.json': '{}',
    })
    const prompt = execFileSync(process.execPath, [cli, 'prompt', 'translate', '--root', directory, '--to', 'en', '--limit', '1', '--no-cache'], {
      cwd: tmpdir(),
      encoding: 'utf8',
      timeout: 30000,
    })
    expect(prompt).toContain('.github/forum-glossary.md')
    expect(prompt).toContain('contextual exceptions')
    expect(prompt).toContain('{name}')
  }, 35000)

  test('uses one native resource pattern and shares the site locale registry', () => {
    expect(config.sourceLocale).toBe(DEFAULT_LOCALE)
    expect(config.locales).toEqual(getLocaleDirs())
    expect(config.resources).toEqual([{ pattern: '.vitepress/locales/{locale}/{namespace}.yml' }])
  })

  test('reads and edits nested YAML sequences, links and block scalars without losing comments', () => {
    const yaml = '# Site configuration\nnav:\n  - text: "Guide" # Menu label\n    link: /guide\nmatrix: [[first, second]]\nblock:\n  - |\n    First line\n    Second line\nnumeric:\n  "0":\n    value: Keep\n'
    const directory = fixture({ 'locales/zh/site.yml': yaml, 'locales/en/site.yml': yaml }, 'locales/{locale}/{namespace}.yml')
    const report = command(['keys', '--values', '--limit', '100'], directory)
    const rows = new Map(report.data.projects[0].keys.map((item: { key: string, values: Record<string, unknown> }) => [item.key, item.values]))
    expect(rows.get('site.nav.0.text')).toEqual({ zh: 'Guide', en: 'Guide' })
    expect(rows.get('site.matrix.0.1')).toEqual({ zh: 'second', en: 'second' })
    for (const [key, value] of [['site.nav.0.text', 'Manual'], ['site.nav.0.link', '/manual'], ['site.matrix.0.1', 'changed']])
      expect(command(['set', key, '--locale', 'en', '--value', value], directory).errors).toEqual([])
    const path = join(directory, 'locales/en/site.yml')
    expect(readFileSync(path, 'utf8')).toBe(yaml.replace('"Guide"', '"Manual"').replace('/guide', '/manual').replace('second', 'changed'))
    expect(command(['set', 'site.block.0', '--locale', 'en', '--value', 'New first line\nNew second line\n'], directory).errors).toEqual([])
    const edited = readFileSync(path, 'utf8')
    expect(edited).toContain('# Site configuration')
    expect(edited).toContain('# Menu label')
    expect((load(edited) as { block: string[] }).block).toEqual(['New first line\nNew second line\n'])
    expect(command(['delete', 'site.matrix.0.0', '--locale', 'en'], directory).errors).toEqual([])
    expect((load(readFileSync(path, 'utf8')) as { matrix: string[][] }).matrix).toEqual([['changed']])
    expect(command(['set', 'site.matrix.0.1', '--locale', 'en', '--value', 'added'], directory).errors).toEqual([])
    expect((load(readFileSync(path, 'utf8')) as { matrix: string[][] }).matrix).toEqual([['changed', 'added']])
    expect(command(['set', 'site.nav.1.items.0.text', '--locale', 'en', '--value', 'New entry'], directory).errors).toEqual([])
    expect((load(readFileSync(path, 'utf8')) as { nav: Array<{ items?: Array<{ text: string }> }> }).nav[1].items).toEqual([{ text: 'New entry' }])
    expect(command(['set', 'site.numeric.0.value', '--locale', 'en', '--value', 'Changed'], directory).errors).toEqual([])
    expect((load(readFileSync(path, 'utf8')) as { numeric: unknown }).numeric).toEqual({ 0: { value: 'Changed' } })
    expect(readFileSync(join(directory, 'locales/zh/site.yml'), 'utf8')).toBe(yaml)
  }, 35000)

  test('indexes root YAML sequences', () => {
    const directory = fixture({ 'locales/zh/list.yml': '- first\n- text: Second\n' }, 'locales/{locale}/{namespace}.yml')
    const report = command(['keys', '--values'], directory)
    expect(report.data.projects[0].keys.map((item: { key: string }) => item.key).sort()).toEqual(['list.0', 'list.1.text'])
  })

  test('rejects whole-file writes of array namespaces atomically while allowing ordinary YAML formatting', () => {
    const yaml = 'title: Example\nnav:\n  - text: Guide\n    link: /guide\n'
    const directory = fixture({ 'locales/zh/site.yml': yaml, 'locales/en/site.yml': yaml }, 'locales/{locale}/{namespace}.yml')
    function reject(args: string[]) {
      const result = spawnSync(process.execPath, [cli, ...args, '--root', directory, '--json', '--no-cache'], { encoding: 'utf8', timeout: 30000 })
      expect(result.error).toBeUndefined()
      expect(result.status).not.toBe(0)
      expect(result.stdout + result.stderr).toContain('Cannot rewrite YAML namespaces containing arrays')
      for (const locale of ['zh', 'en'])
        expect(readFileSync(join(directory, `locales/${locale}/site.yml`), 'utf8')).toBe(yaml)
    }
    reject(['format'])
    reject(['set', 'site.nav.0.text', '--locale', 'ja', '--value', 'ガイド'])
    expect(existsSync(join(directory, 'locales/ja/site.yml'))).toBe(false)
    const configPath = join(directory, 'x18n.config.json')
    writeFileSync(configPath, JSON.stringify({ ...JSON.parse(readFileSync(configPath, 'utf8')), write: { sort: 'binary' } }))
    reject(['set', 'site.title', '--locale', 'en', '--value', 'Changed'])
    const ordinary = fixture({ 'locales/zh/plain.yml': 'numeric: { "0": Keep }\n' }, 'locales/{locale}/{namespace}.yml')
    expect(command(['format'], ordinary).errors).toEqual([])
    expect(load(readFileSync(join(ordinary, 'locales/zh/plain.yml'), 'utf8'))).toEqual({ numeric: { 0: 'Keep' } })
  }, 35000)

  test('indexes every YAML scalar, including complete site configuration, outside the project', () => {
    const report = command(['keys', '--values', '--limit', '20000'])
    expect(report.errors).toEqual([])
    const rows = new Map<string, Record<string, unknown>>(report.data.projects[0].keys.map((item: { key: string, values: Record<string, unknown> }) => [item.key, item.values]))
    for (const locale of getLocaleDirs()) {
      let checked = 0
      function assertScalars(value: unknown, prefix: string) {
        if (value && typeof value === 'object') {
          for (const [key, child] of Object.entries(value))
            assertScalars(child, `${prefix}.${key}`)
        }
        else {
          expect(rows.get(prefix)?.[locale], `${locale}: ${prefix}`).toEqual(value)
          checked++
        }
      }
      for (const file of readdirSync(join(root, `.vitepress/locales/${locale}`)).filter(file => file.endsWith('.yml')))
        assertScalars(load(readFileSync(join(root, `.vitepress/locales/${locale}/${file}`), 'utf8'), { schema: JSON_SCHEMA }), file.slice(0, -4))
      expect(checked).toBeGreaterThan(800)
    }
  }, 35000)

  test('loads one editable resource per YAML file and retains native usage scanning', () => {
    const report = command(['status'])
    const project = report.data.projects[0]
    expect(report.errors).toEqual([])
    expect(project.summary.errors).toBe(0)
    const expectedResources = getLocaleDirs().reduce((total, locale) => total
      + readdirSync(join(root, `.vitepress/locales/${locale}`)).filter(file => file.endsWith('.yml')).length, 0)
    expect(project.resources).toBe(expectedResources)
    expect(project.keys).toBeGreaterThan(800)
    expect(project.usages).toBeGreaterThan(500)
  }, 35000)
})
