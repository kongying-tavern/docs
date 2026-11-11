import { issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { following: false, topics: [issue()], comments: [] } })

for (const width of [1280, 390]) {
  test(`original publish transitions clean up after closing and returning at width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('feedback')
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    const choose = () => page.locator('[data-publish-type-chooser] button').filter({ hasText: '我想要' })
    await choose().click()
    const form = page.locator('.compact-form')
    await expect(page.locator('[data-publish-type-form]')).not.toHaveAttribute('inert', '')
    await expect(form.locator('#title')).toBeFocused()
    await expect(page.locator('[data-publish-type-ghost]')).toHaveCount(0)
    if (width < 768) {
      await form.locator('#title').fill('往返时保留的反馈')
      await form.locator('[data-publish-type-target]').click()
      await expect(choose()).toBeFocused()
      await choose().click()
      await expect(form.locator('#title')).toBeFocused()
      await expect(form.locator('#title')).toHaveValue('往返时保留的反馈')
    }
    await page.screenshot({ path: test.info().outputPath(`feedback-form-${width}.png`) })
  })
}

test('closing or resizing during the row morph removes snapshots and restores the real trigger', async ({ page }) => {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('feedback')
  await page.getByRole('button', { name: '新建反馈', exact: true }).click()
  const choose = () => page.locator('[data-publish-type-chooser] button').filter({ hasText: '我想要' })
  await choose().evaluate(async (button) => {
    ;(button as HTMLButtonElement).click()
    await new Promise(requestAnimationFrame)
    document.querySelector<HTMLElement>('.compact-close')!.click()
  })
  await expect(page.locator('.compact-dialog')).toHaveCount(0)
  await expect(page.locator('[data-publish-type-ghost]')).toHaveCount(0)
  await page.getByRole('button', { name: '新建反馈', exact: true }).click()
  await choose().evaluate(async (button) => {
    ;(button as HTMLButtonElement).click()
    await new Promise(requestAnimationFrame)
    window.dispatchEvent(new Event('resize'))
  })
  await expect(page.locator('[data-publish-type-ghost]')).toHaveCount(0)
  await expect(page.locator('.compact-form #title')).toBeFocused()
  await expect(page.locator('[data-publish-type-target]')).not.toHaveAttribute('style', /opacity:\s*0/)
  await expect(page.locator('[data-publish-type-form]')).not.toHaveAttribute('inert', '')
})

test('reduced motion skips the row morph and still focuses the revealed form', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('feedback')
  await page.getByRole('button', { name: '新建反馈', exact: true }).click()
  await page.locator('[data-publish-type-chooser] button').filter({ hasText: '我想要' }).click()
  await expect(page.locator('.compact-form #title')).toBeFocused()
  await expect(page.locator('[data-publish-type-ghost]')).toHaveCount(0)
})

test('desktop type menu import failure shows a recoverable panel instead of an inert editor', { tag: '@source' }, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.route('**/ForumMenuDesktop.vue*', route => route.abort('failed'))
  await page.goto('feedback#PUBLISH-TOPIC')
  const panel = page.locator('.compact-dialog')
  await expect(panel.locator('[data-async-error]')).toBeVisible()
  await expect(panel.getByRole('button', { name: '重试', exact: true })).toBeVisible()
  await expect(page.locator('[data-publish-type-ghost]')).toHaveCount(0)
  await expect(page.locator('[data-publish-type-form][inert]')).toHaveCount(0)
  await panel.locator('.compact-close').click()
  await expect(panel).toHaveCount(0)
})
