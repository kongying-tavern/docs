import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { load } from 'js-yaml'
import { expect, test } from 'vitest'
import { DEFAULT_LOCALE } from '../../../../.vitepress/locales/common.ts'

const root = fileURLToPath(new URL('../../../..', import.meta.url))
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

interface Step {
  run?: string
  uses?: string
  with?: Record<string, string>
}

interface LunariaFile {
  include: string[]
  pattern: string
  exclude?: string[]
  type: string
}

interface LunariaConfig {
  outDir: string
  sourceLocale: { lang: string }
  locales: { lang: string }[]
  tracking: { ignoredKeywords: string[] }
  files: LunariaFile[]
}

const jiti = createJiti(import.meta.url)
const lunaria = await jiti.import<LunariaConfig>(resolve(root, 'lunaria.config.ts'), { default: true })

test('Lunaria tracks articles only and retains the claim bot status contract', () => {
  expect(lunaria.files.length).toBeGreaterThan(0)
  for (const entry of lunaria.files) {
    expect(entry.include).toEqual([`pages/${DEFAULT_LOCALE}/**/*.md`])
    expect(entry.pattern).toBe('pages/@lang/@path')
    expect(entry.exclude).toContain(`pages/${DEFAULT_LOCALE}/blog/[path].md`)
  }
  expect(lunaria.sourceLocale.lang).toBe(DEFAULT_LOCALE)
  expect(lunaria.tracking.ignoredKeywords).toEqual(['@ignore', '\\[ci\\]', '\\[format\\]'])
  const sync = load(read('.github/workflows/sync.yml')) as { jobs: { sync: { steps: Step[] } } }
  const bot = sync.jobs.sync.steps.find(step => step.uses?.startsWith('jiazengp/lunaria-claim@'))!
  expect(resolve(root, bot.with!['status-json'])).toBe(resolve(root, lunaria.outDir, 'status.json'))
  expect(sync.jobs.sync.steps.some(step => step.run === 'pnpm lunaria:build')).toBe(true)
})

test('renaming the article tree preserves an outdated translation in Lunaria', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'lunaria-history-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: fixture, stdio: 'pipe' })
  const commit = (date: string, ...message: string[]) => execFileSync('git', [
    '-c',
    'user.name=Lunaria Test',
    '-c',
    'user.email=test@example.invalid',
    '-c',
    'commit.gpgsign=false',
    '-c',
    'core.hooksPath=.disabled-hooks',
    'commit',
    '-qm',
    ...message,
  ], {
    cwd: fixture,
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    stdio: 'pipe',
  })
  function isOutdated(dir: string) {
    const config = {
      ...lunaria,
      locales: [lunaria.locales[0]],
      files: [{ ...lunaria.files[0], include: [`${dir}/**/*.md`], pattern: `${dir}/@lang/@path` }],
    }
    const script = `
      import { createLunaria } from ${JSON.stringify(import.meta.resolve('@lunariajs/core'))}
      const lunaria = await createLunaria({
        config: JSON.parse(process.argv[1]),
        force: true,
        logLevel: 'silent',
      })
      const [article] = await lunaria.getFullStatus()
      console.log(JSON.stringify(article.localizations.find(entry => entry.lang === 'en')?.status === 'outdated'))
    `
    const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script, JSON.stringify(config)], {
      cwd: fixture,
      encoding: 'utf8',
    })
    return JSON.parse(output)
  }

  try {
    git('init', '-q')
    for (const lang of ['zh', 'en']) {
      mkdirSync(resolve(fixture, 'src', lang), { recursive: true })
      writeFileSync(resolve(fixture, 'src', lang, 'article.md'), '# Article\n')
    }
    git('add', 'src')
    commit('2026-01-01T00:00:00Z', 'add article and translation')
    writeFileSync(resolve(fixture, 'src/zh/article.md'), '# Article\n\nNew content.\n')
    git('add', 'src')
    commit('2026-01-02T00:00:00Z', 'update source content')
    expect(isOutdated('src')).toBe(true)

    renameSync(resolve(fixture, 'src'), resolve(fixture, 'pages'))
    git('add', '-A')
    commit('2026-01-03T00:00:00Z', 'move article tree', '-m', '@lunaria-ignore:pages/**')
    expect(isOutdated('pages')).toBe(true)
  }
  finally {
    rmSync(fixture, { recursive: true, force: true })
  }
}, 15000)

test('all published site artifacts include both reports after the site build', () => {
  for (const [workflow, siteBuild, publishAction] of [
    ['deployment.yml', 'pnpm build:vitepress', 'easingthemes/ssh-deploy@'],
    ['test-build.yml', 'pnpm site:preview', 'actions/upload-artifact@'],
    ['pages.yml', 'pnpm build', 'actions/upload-pages-artifact@'],
  ]) {
    const parsed = load(read(`.github/workflows/${workflow}`)) as { jobs: { build: { steps: Step[] } } }
    const steps = parsed.jobs.build.steps
    const report = steps.findIndex(step => step.run === 'pnpm translations:build')
    expect(report, workflow).toBeGreaterThan(steps.findIndex(step => step.run === siteBuild))
    expect(report, workflow).toBeLessThan(steps.findIndex(step => step.uses?.startsWith(publishAction)))
    if (workflow === 'test-build.yml')
      expect(report).toBeLessThan(steps.findIndex(step => step.run?.includes('zip -r _site.zip')))
  }
  const pkg = JSON.parse(read('package.json'))
  expect(pkg.scripts['translations:build']).toBe('pnpm lunaria:build && pnpm i18n:build')
  expect(pkg.scripts['i18n:build']).toBe('x18n build --out-dir dist/_i18n')
})

test('UI checks run in CI on x18n config changes and each locale links both reports', () => {
  const workflow = load(read('.github/workflows/check.yml')) as {
    on: Record<string, { paths: string[] }>
    jobs: { check: { steps: Step[] } }
  }
  expect(workflow.jobs.check.steps.some(step => step.run === 'pnpm i18n:check')).toBe(true)
  for (const event of ['push', 'pull_request'])
    expect(workflow.on[event].paths).toContain('x18n.config.ts')
  for (const locale of ['zh', 'en', 'ja']) {
    const page = read(`pages/${locale}/translations.md`)
    expect(page).toContain('https://yuanshen.site/docs/_translations/')
    expect(page).toContain('https://yuanshen.site/docs/_i18n/')
  }
})
