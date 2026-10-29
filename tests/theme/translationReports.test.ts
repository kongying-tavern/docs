import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'
import { expect, test } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

interface Step {
  run?: string
  uses?: string
  with?: Record<string, string>
}

const lunaria = JSON.parse(read('lunaria.config.json'))

test('Lunaria tracks articles only and retains the claim bot status contract', () => {
  expect(lunaria.files.length).toBeGreaterThan(0)
  for (const entry of lunaria.files) {
    expect(entry.location).toMatch(/^src\/.*\.md$/)
    expect(entry.pattern).toBe('src/@lang/@path')
  }
  const sync = load(read('.github/workflows/sync.yml')) as { jobs: { sync: { steps: Step[] } } }
  const bot = sync.jobs.sync.steps.find(step => step.uses?.startsWith('jiazengp/lunaria-claim@'))!
  expect(resolve(root, bot.with!['status-json'])).toBe(resolve(root, lunaria.outDir, 'status.json'))
  expect(sync.jobs.sync.steps.some(step => step.run === 'pnpm lunaria:build')).toBe(true)
})

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
    const page = read(`src/${locale}/translations.md`)
    expect(page).toContain('https://yuanshen.site/docs/_translations/')
    expect(page).toContain('https://yuanshen.site/docs/_i18n/')
  }
})
