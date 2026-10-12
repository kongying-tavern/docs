import { currentUser, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 1440, height: 900 }, scenario: { user: { ...currentUser, id: 2 }, following: false } })

test('saved drafts open without exposing background backup controls', async ({ page }) => {
  await page.addInitScript((auth) => {
    localStorage.setItem('USER-AUTH', auth)
    const sourceKey = 'forum-publish-form-data-feat'
    localStorage.setItem(sourceKey, JSON.stringify({ type: 'FEAT', title: '当前草稿', text: '当前正文', tags: [] }))
    localStorage.setItem(`${sourceKey}-backup`, JSON.stringify({ version: 1, sourceKey, raw: '{damaged raw draft', savedAt: Date.now() }))
  }, localAuth())
  await page.goto('feedback')
  await page.locator('.forum-sidebar-topic-row').filter({ hasText: '当前草稿' }).locator('a').click()
  const form = page.locator('.compact-form')
  await expect(form.locator('#title')).toHaveValue('当前草稿')
  await expect(form.locator('[contenteditable="true"]')).toContainText('当前正文')
  await expect(page.locator('[data-draft-recovery]')).toHaveCount(0)
  await expect(form).not.toContainText(/备份|导出|快照/)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('forum-publish-form-data-feat-backup')!).raw)).toBe('{damaged raw draft')
})
