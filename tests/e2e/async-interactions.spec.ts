import type { Page } from '@playwright/test'
import { currentUser, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

async function holdModule(page: Page, module: string): Promise<() => void> {
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(`**/${module}*`, async (route) => {
    await pending
    await route.continue()
  })
  return release
}

test('mobile embedded settings stay cancelable without stacking a second dialog', { tag: '@source' }, async ({ page }, testInfo) => {
  const navigations: string[] = []
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      navigations.push(request.url())
  })
  await page.setViewportSize({ width: 390, height: 844 })
  const release = await holdModule(page, 'SettingsContent.vue')
  try {
    await page.goto('feedback')
    await expect(page.locator('.forum-topic-item').first()).toBeVisible({ timeout: 30_000 })
    await page.locator('.VPLocalNav').getByRole('button', { name: /Menu|菜单/ }).click()
    await page.locator('.forum-sidebar-account-trigger').click()
    await page.getByRole('button', { name: '设置', exact: true }).click()
    await expect(page.locator('.forum-sidebar-responsive-content [data-async-loading]')).toBeVisible()
    await expect(page.locator('.forum-sidebar-responsive-content [data-slot="skeleton"]').first()).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await page.screenshot({ path: testInfo.outputPath('mobile-loading.png') })
    await page.getByRole('button', { name: '关闭设置', exact: true }).click()
    await expect(page.locator('[data-async-loading]')).toHaveCount(0)
    release()
    await page.locator('.VPLocalNav').getByRole('button', { name: /Menu|菜单/ }).click()
    await page.locator('.forum-sidebar-account-trigger').click()
    await page.getByRole('button', { name: '设置', exact: true }).click()
    await expect(page.locator('.settings-mobile-view')).toBeVisible()
    expect(navigations, 'Lazy dependencies must not reload the page and dismiss the drawer').toHaveLength(1)
  }
  finally {
    release()
  }
})

test('non-default settings panels download only after selection and show local loading', { tag: '@source' }, async ({ page }) => {
  const requested: string[] = []
  page.on('request', request => requested.push(request.url()))
  const release = await holdModule(page, 'ForumShortcutSettings.vue')
  try {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('feedback#settings')
    await expect(page.locator('.settings-dialog')).toBeVisible()
    expect(requested.some(url => url.includes('ForumShortcutSettings.vue'))).toBe(false)
    await page.getByRole('link', { name: '键盘快捷键', exact: true }).click()
    await expect(page.locator('.settings-dialog [data-async-loading]')).toBeVisible()
    release()
    await expect(page.locator('.settings-dialog [data-async-loading]')).toHaveCount(0)
    await expect(page.locator('.settings-dialog .shortcut-settings')).toBeVisible()
  }
  finally {
    release()
  }
})

for (const cancel of [false, true]) {
  test(`desktop settings show a cancelable shell while downloading (${cancel ? 'cancel' : 'complete'})`, { tag: '@source' }, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width: 1280, height: 900 })
    const release = await holdModule(page, 'SettingsContent.vue')
    try {
      await page.goto('feedback')
      await expect(page.locator('.forum-topic-item').first()).toBeVisible({ timeout: 30_000 })
      await page.evaluate(() => {
        location.hash = 'settings'
      })
      const loading = page.getByRole('dialog', { name: '设置', exact: true })
      await expect(loading.locator('[data-async-loading]')).toBeVisible()
      await expect(loading.locator('.settings-skeleton-sidebar')).toBeVisible()
      await loading.evaluate(async element => Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {}))))
      const sidebarBounds = await loading.locator('.settings-skeleton-sidebar').boundingBox()
      const mainBounds = await loading.locator('.settings-dialog-main').boundingBox()
      expect(sidebarBounds?.width).toBe(248)
      expect(mainBounds?.y).toBe(sidebarBounds?.y)
      await expect(loading.locator('[data-slot="skeleton"]').first()).toBeVisible()
      await expect(loading.locator('.i-lucide-loader-circle')).toHaveCount(0)
      const initialBounds = await loading.boundingBox()
      await loading.evaluate(element => element.setAttribute('data-original-shell', 'true'))
      if (!cancel)
        await page.screenshot({ path: testInfo.outputPath('desktop-loading.png') })
      if (cancel) {
        await loading.getByRole('button', { name: '关闭设置', exact: true }).click()
        await expect(loading).toHaveCount(0)
        await expect(page).toHaveURL(/\/feedback$/)
      }
      release()
      if (cancel) {
        // Reopen after the outstanding download: cancellation must not poison the loader.
        await page.evaluate(() => {
          location.hash = 'settings'
        })
      }
      await expect(page.locator('.settings-dialog')).toBeVisible()
      await expect(page.locator('.settings-dialog [data-async-loading]')).toHaveCount(0)
      if (!cancel) {
        await expect(loading).toHaveAttribute('data-original-shell', 'true')
        expect(await loading.boundingBox()).toEqual(initialBounds)
      }
      await page.keyboard.press('Escape')
      await expect(page.locator('.settings-dialog')).toHaveCount(0)
      expect(errors).toEqual([])
    }
    finally {
      release()
    }
  })
}

test('tag editor displays loading feedback and can be canceled before its module arrives', { tag: '@source' }, async ({ page }) => {
  const release = await holdModule(page, 'ForumTopicTagsEditorDialog.vue')
  try {
    await page.goto('feedback')
    await expect(page.locator('.forum-topic-item').first()).toBeVisible({ timeout: 30_000 })
    await page.evaluate(`(async () => {
      const { useTopicTagsEditor } = await import('/forum/composables/state/useTopicTagsEditor.ts')
      useTopicTagsEditor().openTopicTagsEditorDialog({ id: '123', type: 'FEAT', tags: [] })
    })()`)
    const loading = page.getByRole('dialog', { name: '加载中', exact: true })
    await expect(loading.locator('[data-async-loading]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(loading).toHaveCount(0)
    release()
    await page.evaluate(`(async () => {
      const { useTopicTagsEditor } = await import('/forum/composables/state/useTopicTagsEditor.ts')
      useTopicTagsEditor().openTopicTagsEditorDialog({ id: '123', type: 'FEAT', tags: [] })
    })()`)
    await expect(page.getByRole('dialog', { name: '编辑反馈标签（#123）' })).toBeVisible()
  }
  finally {
    release()
  }
})

test('the second publish module remains cancelable while downloading', { tag: '@source' }, async ({ page, scenario }) => {
  scenario.following = false
  scenario.user = { ...currentUser, id: 2 }
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  const release = await holdModule(page, 'ForumCompactPublishTopicPanel.vue')
  try {
    await page.goto('feedback')
    await expect(page.locator('.forum-topic-item').first()).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    const loading = page.getByRole('dialog', { name: '加载中', exact: true })
    await expect(loading.locator('[data-async-loading]')).toBeVisible()
    await loading.getByRole('button', { name: '关闭', exact: true }).click()
    await expect(loading).toHaveCount(0)
    release()
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    await expect(page.locator('[data-publish-type-chooser]')).toBeVisible()
  }
  finally {
    release()
  }
})

test('cold topic navigation displays its destination before the module finishes loading', { tag: '@source' }, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const release = await holdModule(page, 'ForumTopicPage.vue')
  try {
    await page.goto('feedback')
    await expect(page.locator('.forum-topic-item').first()).toBeVisible({ timeout: 30_000 })
    await page.evaluate(() => {
      // Exercise the site's delegated SPA navigation without hover prefetch.
      const link = document.createElement('a')
      link.href = '/feedback/topic/123'
      document.body.append(link)
      link.click()
      link.remove()
    })
    await expect(page).toHaveURL(/\/feedback\/topic\/123$/)
    await expect(page.locator('.forum-route-view [data-async-loading]')).toBeVisible()
    release()
    await expect(page.locator('.forum-route-view [data-async-loading]')).toHaveCount(0)
    await expect(page.locator('.forum-route-view')).toContainText('测试反馈路由可用')
  }
  finally {
    release()
  }
})

test('mobile direct settings keep the same drawer and retain focus after loading', { tag: '@source' }, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const release = await holdModule(page, 'SettingsContent.vue')
  try {
    await page.goto('feedback#settings')
    const drawer = page.locator('.settings-drawer')
    await expect(drawer.locator('[data-async-loading]')).toBeVisible()
    await drawer.evaluate(element => element.setAttribute('data-original-shell', 'true'))
    release()
    await expect(drawer.locator('.settings-mobile-view')).toBeVisible()
    await expect(drawer).toHaveAttribute('data-original-shell', 'true')
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await expect.poll(() => drawer.evaluate(element => element.contains(document.activeElement))).toBe(true)
  }
  finally {
    release()
  }
})

test('settings skeletons respect the site reduced-motion preference', { tag: '@source' }, async ({ page }) => {
  const release = await holdModule(page, 'SettingsContent.vue')
  try {
    await page.goto('feedback#settings')
    const skeleton = page.locator('.settings-dialog [data-slot="skeleton"]').first()
    await expect(skeleton).toBeVisible()
    await page.evaluate(() => document.documentElement.dataset.reducedMotion = 'true')
    await expect.poll(() => skeleton.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
  }
  finally {
    release()
  }
})

test('failed settings content offers retry and reload inside the original shell', { tag: '@source' }, async ({ page }) => {
  await page.route('**/SettingsContent.vue*', route => route.abort('failed'))
  await page.goto('feedback#settings')
  const dialog = page.locator('.settings-dialog')
  await expect(dialog.locator('[data-async-error]')).toBeVisible()
  await expect(dialog.locator('[data-async-loading]')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: '重试', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '刷新页面', exact: true })).toBeVisible()
  await page.unroute('**/SettingsContent.vue*')
  await dialog.getByRole('button', { name: '重试', exact: true }).click()
  // Browsers can cache a rejected import; reloading is the reliable recovery path.
  await expect(dialog.locator('.settings-dialog-menu').or(dialog.locator('[data-async-error]'))).toBeVisible()
  if (await dialog.locator('[data-async-error]').count())
    await dialog.getByRole('button', { name: '刷新页面', exact: true }).click()
  await expect(dialog.locator('.settings-dialog-menu')).toBeVisible()
})

test('a stalled settings download times out and can be retried without replacing the shell', { tag: '@source' }, async ({ page }) => {
  const release = await holdModule(page, 'SettingsContent.vue')
  try {
    await page.goto('feedback#settings')
    const dialog = page.locator('.settings-dialog')
    await expect(dialog.locator('[data-async-loading]')).toBeVisible()
    await dialog.evaluate(element => element.setAttribute('data-original-shell', 'true'))
    await expect(dialog.locator('[data-async-error]')).toBeVisible({ timeout: 20_000 })
    release()
    await dialog.getByRole('button', { name: '重试', exact: true }).click()
    await expect(dialog.locator('.settings-dialog-menu')).toBeVisible()
    await expect(dialog).toHaveAttribute('data-original-shell', 'true')
  }
  finally {
    release()
  }
})
