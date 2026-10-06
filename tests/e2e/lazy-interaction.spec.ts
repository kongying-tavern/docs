import { localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test('save-data skips speculative preview loading but still warms on intent', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' }, configurable: true })
  })
  let requested = false
  await page.route('**/ForumTopicPreviewContent.vue*', async (route) => {
    requested = true
    await route.continue()
  })
  await page.goto('/feedback')
  const row = page.locator('.forum-topic-item').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  expect(requested).toBe(false)
  await row.hover()
  await expect.poll(() => requested).toBe(true)
})

test('desktop preview finishes idle preload before any user interaction', async ({ page }) => {
  let requested = false
  await page.route('**/ForumTopicPreviewContent.vue*', async (route) => {
    requested = true
    await route.continue()
  })
  await page.goto('/feedback')
  const row = page.locator('.forum-topic-item').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => requested).toBe(true)
  await page.waitForLoadState('networkidle')
  await row.getByRole('button', { name: /评论/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').locator('.preview-body > p[role="status"]')).toHaveCount(0)
})

test('authenticated mobile editor is downloaded before opening, with no loading placeholder', async ({ page, scenario }) => {
  scenario.following = false
  await page.setViewportSize({ width: 375, height: 812 })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let requested = false
  await page.route('**/ForumRichTextarea.vue*', async (route) => {
    requested = true
    await route.continue()
  })
  await page.goto('/feedback/topic/123')
  const entry = page.locator('.mobile-comment-entry')
  await expect(entry).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => requested).toBe(true)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.mobile-comment-dialog')).toHaveCount(0)
  await entry.click()
  const drawer = page.locator('.mobile-comment-dialog')
  await expect(drawer.locator('[contenteditable="true"]')).toBeFocused()
  await expect(drawer.getByRole('status')).toHaveCount(0)
})

test('preview shell opens and closes while its content download is pending', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/ForumTopicPreviewContent.vue*', async (route) => {
    await pending
    await route.continue()
  })
  try {
    await page.goto('/feedback')
    await page.locator('.forum-topic-item').first().getByRole('button', { name: /评论/ }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('status')).toBeVisible()
    await dialog.getByRole('button', { name: '关闭', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    release()
    await expect(dialog).toHaveCount(0)
  }
  finally {
    release()
  }
})

test('slow mobile editor import keeps drawer responsive and focuses after mounting', async ({ page, scenario }) => {
  scenario.following = false
  await page.setViewportSize({ width: 375, height: 812 })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let requested = false
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/ForumRichTextarea.vue*', async (route) => {
    requested = true
    await pending
    await route.continue()
  })
  try {
    await page.goto('/feedback/topic/123')
    const entry = page.locator('.mobile-comment-entry')
    await expect(entry).toBeVisible({ timeout: 30_000 })
    await expect.poll(() => requested).toBe(true)
    await entry.click()
    const drawer = page.locator('.mobile-comment-dialog')
    await expect(drawer).toBeVisible()
    await expect(drawer.locator('[contenteditable="true"]')).toHaveCount(0)
    release()
    const editor = drawer.locator('[contenteditable="true"]')
    await expect(editor).toBeFocused()
    await editor.fill('异步加载后的草稿')
    await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 10, y: 10 } })
    await expect(drawer).toHaveCount(0)
    await entry.click()
    await expect(editor).toBeFocused()
    await expect(editor).toContainText('异步加载后的草稿')
  }
  finally {
    release()
  }
})
