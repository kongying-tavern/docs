import { expect, test } from './support/test'

test('password login requires remembered rollout access after logout', async ({ page }) => {
  await page.goto('/feedback#account-login-alert')
  await expect(page.locator('#gitee-login-username')).toHaveCount(0)
  await page.evaluate(() => localStorage.setItem('forum-account-login-access', 'true'))
  await page.goto('/feedback#account-login-alert')
  await expect(page.locator('#gitee-login-username')).toBeVisible()
})

test('unavailable rollout storage keeps the login entry closed without throwing', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem
    const setItem = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('forum-account-login-'))
        throw new DOMException('Storage denied', 'SecurityError')
      return getItem.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('forum-account-login-'))
        throw new DOMException('Storage denied', 'SecurityError')
      setItem.call(this, key, value)
    }
  })
  await page.goto('/feedback#account-login-alert')
  await expect(page.locator('#gitee-login-username')).toHaveCount(0)
  expect(errors).toEqual([])
})
