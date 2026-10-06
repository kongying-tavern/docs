import { localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

async function signalLoadFailure(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('vite:preloadError'))
    window.dispatchEvent(new Event('vite:preloadError'))
  })
}

test('load failure offers one manual recovery prompt without automatically reloading', async ({ page }) => {
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item').first()).toBeVisible({ timeout: 30_000 })
  let navigations = 0
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame())
      navigations++
  })
  await signalLoadFailure(page)
  const notice = page.locator('.chunk-load-recovery')
  await expect(notice).toHaveCount(1)
  await expect(notice).toContainText('可能是网络中断或页面已更新')
  expect(navigations).toBe(0)
  await notice.getByRole('button', { name: '稍后处理' }).click()
  await expect(notice).toHaveCount(0)
  await signalLoadFailure(page)
  const navigation = page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() })
  await notice.getByRole('button', { name: '刷新页面' }).click()
  await navigation
  await expect(notice).toHaveCount(0)
  await expect(page.locator('.forum-topic-item').first()).toBeVisible()
})

for (const mobile of [false, true]) {
  test(`canceling recovery refresh preserves an unsent ${mobile ? 'mobile' : 'desktop'} comment`, async ({ page, scenario }) => {
    scenario.following = false
    await page.setViewportSize(mobile ? { width: 375, height: 812 } : { width: 1280, height: 900 })
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('/feedback/topic/123')
    if (mobile)
      await page.locator('.mobile-comment-entry').click()
    const editor = page.locator('[contenteditable="true"]').first()
    await editor.fill('刷新前保留的评论草稿')
    if (mobile) {
      await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 10, y: 10 } })
      await expect(page.locator('.mobile-comment-dialog')).toHaveCount(0)
    }
    await signalLoadFailure(page)
    const dialogPromise = page.waitForEvent('dialog')
    const clicking = page.locator('.chunk-load-recovery').getByRole('button', { name: '刷新页面' }).click()
    const dialog = await dialogPromise
    expect(dialog.type()).toBe('beforeunload')
    await dialog.dismiss()
    await clicking
    await expect(page.locator('.chunk-load-recovery')).toBeVisible()
    await page.locator('.chunk-load-recovery').getByRole('button', { name: '稍后处理' }).click()
    if (mobile)
      await page.locator('.mobile-comment-entry').click()
    await expect(editor).toContainText('刷新前保留的评论草稿')
  })
}
