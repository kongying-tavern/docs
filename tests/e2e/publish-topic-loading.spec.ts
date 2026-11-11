import type { Locator } from '@playwright/test'
import { issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { following: false, topics: [issue()], comments: [] } })

async function bounds(panel: Locator, choosing: boolean) {
  return panel.evaluate((node, choosing) => {
    const rect = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect()
      return { x, y, width, height }
    }
    const elements = choosing
      ? { header: 'header' }
      : { header: '.compact-header', body: '.compact-body', properties: '.compact-properties', footer: '.compact-footer' }
    return { panel: rect(node), ...Object.fromEntries(Object.entries(elements).map(([name, selector]) => [name, rect(node.querySelector(selector)!)])) }
  }, choosing)
}

for (const width of [1280, 390]) {
  for (const [module, suffix] of [
    ['ForumPublishTopicForm', ''],
    ['ForumPublishTopicForm', '-BUG'],
    ['ForumPublishTopicForm', '-FEAT'],
    ['ForumCompactPublishTopicPanel', '-FEAT'],
  ]) {
    test(`${module} placeholder matches ${suffix || 'chooser'} at width ${width}`, { tag: '@source' }, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
      let release!: () => void
      const pending = new Promise<void>((resolve) => {
        release = resolve
      })
      await page.route(`**/${module}.vue*`, async (route) => {
        await pending
        await route.continue()
      })
      try {
        await page.goto(`feedback#PUBLISH-TOPIC${suffix}`)
        const loading = page.locator('.compact-dialog, .compact-drawer').filter({ has: page.locator('[data-publish-loading]') })
        await expect(loading).toBeVisible()
        await expect(page.locator('.forum-loading-fullscreen')).toHaveCount(0)
        const before = await bounds(loading, !suffix)
        if (suffix === '-FEAT')
          await page.screenshot({ path: test.info().outputPath('loading.png') })
        release()
        await expect(page.locator('[data-publish-loading]')).toHaveCount(0)
        const actual = page.locator('.compact-dialog, .compact-drawer').filter({ has: page.locator('.topic-stage-shell') })
        await expect(actual).toBeVisible()
        const after = await bounds(actual, !suffix)
        for (const name of Object.keys(before) as (keyof typeof before)[]) {
          for (const property of ['x', 'y', 'width', 'height'] as const)
            expect(Math.abs(before[name][property] - after[name][property]), `${name}.${property}: ${JSON.stringify({ before, after })}`).toBeLessThanOrEqual(1)
        }
        await expect(page.getByRole('dialog')).toHaveCount(1)
        await expect(page.locator('vite-error-overlay')).toHaveCount(0)
        if (suffix === '-FEAT')
          await page.screenshot({ path: test.info().outputPath('loaded.png') })
      }
      finally {
        release()
      }
    })
  }
}

for (const module of ['ForumPublishTopicForm', 'ForumCompactPublishTopicPanel']) {
  test(`closing ${module} placeholder does not reopen the form when loading finishes`, { tag: '@source' }, async ({ page }) => {
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route(`**/${module}.vue*`, async (route) => {
      await pending
      await route.continue()
    })
    try {
      await page.goto('feedback#PUBLISH-TOPIC-FEAT')
      await expect(page.locator('[data-publish-loading]')).toBeVisible()
      await page.locator('.compact-close').click()
      await expect(page.locator('[data-publish-loading]')).toHaveCount(0)
      release()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('.compact-dialog, .compact-drawer')).toHaveCount(0)
    }
    finally {
      release()
    }
  })
}

test('publish loading failure keeps the same bounds and can retry or close', { tag: '@source' }, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/ForumCompactPublishTopicPanel.vue*', async (route) => {
    await pending
    await route.continue()
  })
  try {
    await page.goto('feedback#PUBLISH-TOPIC-FEAT')
    const panel = page.locator('.compact-dialog')
    await expect(panel.locator('[data-publish-loading]')).toBeVisible()
    const before = await bounds(panel, false)
    await expect(panel.locator('[data-async-error]')).toBeVisible({ timeout: 20_000 })
    expect(await bounds(panel, false)).toEqual(before)
    await panel.locator('.compact-close').click({ trial: true })
    await panel.getByRole('button', { name: '重试', exact: true }).click()
    release()
    await expect(panel.locator('[data-publish-loading]')).toHaveCount(0)
    await expect(panel.locator('#title')).toBeEditable()
    expect(await bounds(panel, false)).toEqual(before)
  }
  finally {
    release()
  }
})
