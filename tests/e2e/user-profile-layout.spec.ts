import { alice, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test('sticky profile bar follows the content column across viewport sizes', async ({ page }) => {
  await page.goto('feedback/@alice')
  const profile = page.locator('[data-forum-user-profile="alice"]')
  await expect(profile.locator('[data-forum-user-name]')).toContainText('Alice', { timeout: 30_000 })
  await page.reload()
  await expect(profile.locator('[data-forum-user-name]')).toContainText('Alice')
  const tabs = profile.locator('.profile-tabs').first()
  await expect(tabs.locator('.forum-topic-lifecycle')).toHaveCount(1)
  await expect(tabs.locator('[data-tab-id="all"] .forum-topic-lifecycle-icon')).toHaveClass(/is-open/)
  await tabs.locator('[data-tab-id="closed"]').click()
  await expect(tabs.locator('[data-tab-id="all"] .forum-topic-lifecycle')).toHaveCount(0)
  await expect(tabs.locator('[data-tab-id="closed"] .forum-topic-lifecycle-icon')).toHaveClass(/is-progressing/)
  await expect(tabs.locator('.forum-topic-lifecycle-icon')).toHaveCSS('width', '14px')
  await tabs.locator('[data-tab-id="all"]').click()
  await page.locator('.forum-content').evaluate(el => el.style.minHeight = '2000px')
  const bar = page.locator('.user-sticky-bar')
  await expect(bar.locator('img')).toHaveCount(0)
  for (const width of [1920, 1440, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 650))
    await expect(bar).toHaveAttribute('data-visible', 'true')
    await expect.poll(async () => {
      const contentBox = (await profile.boundingBox())!
      const barBox = (await bar.boundingBox())!
      return Math.max(Math.abs(contentBox.x - barBox.x), Math.abs(contentBox.width - barBox.width))
    }).toBeLessThan(2)
    const tabs = bar.locator('.profile-tabs')
    await expect.poll(() => tabs.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThan(2)
    const identityBox = (await bar.locator('.user-sticky-bar-identity').boundingBox())!
    const tabsBox = (await tabs.boundingBox())!
    if ((await bar.boundingBox())!.width < 640)
      expect(tabsBox.y).toBeGreaterThanOrEqual(identityBox.y + identityBox.height)
    else
      expect(tabsBox.x).toBeGreaterThanOrEqual(identityBox.x + identityBox.width)
  }
  await bar.locator('[data-tab-id="closed"]').click()
  await expect(page).toHaveURL(/\/feedback\/@alice\/closed$/)
  await expect(bar.locator('.forum-topic-lifecycle')).toHaveCount(1)
  await expect(bar.locator('[data-tab-id="closed"] .forum-topic-lifecycle-icon')).toHaveClass(/is-progressing/)
  await expect(tabs.locator('[data-tab-id="closed"]')).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(bar).toHaveAttribute('data-visible', 'false')
  await expect(bar).toHaveAttribute('inert', '')
})

test.describe('localized profile with archive access', () => {
  test.use({ scenario: { user: { ...alice, name: 'Alice with a very long display name for profile layout' } } })

  for (const locale of ['en', 'ja']) {
    test(`${locale} sticky tabs fit narrow screens and switch to archived feedback`, async ({ page }) => {
      await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
      await page.goto(`${locale}/feedback/@alice`)
      const profile = page.locator('[data-forum-user-profile="alice"]')
      await expect(profile.locator('[data-forum-user-name]')).toContainText('Alice', { timeout: 30_000 })
      await page.locator('.forum-content').evaluate(el => el.style.minHeight = '2000px')
      const bar = page.locator('.user-sticky-bar')
      for (const width of [320, 640, 768, 960, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        await page.evaluate(() => window.scrollTo(0, 650))
        await expect(bar).toHaveAttribute('data-visible', 'true')
        await expect(bar.locator('[data-tab-id]')).toHaveCount(3)
        await expect.poll(() => bar.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThan(2)
      }
      await bar.locator('[data-tab-id="archived"]').click()
      await expect(page).toHaveURL(new RegExp(`/${locale}/feedback/@alice/archived$`))
      await expect(bar.locator('.forum-topic-lifecycle')).toHaveCount(1)
      await expect(bar.locator('.forum-topic-lifecycle-icon')).toHaveClass(/is-closed/)
    })
  }
})

test.describe('mobile profile filters', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('native touch swipe scrolls filters without changing selection', async ({ page }) => {
    await page.goto('feedback/@alice')
    const all = page.getByRole('button', { name: '全部类型', exact: true })
    await expect(all).toBeVisible({ timeout: 30_000 })
    const row = all.locator('..')
    await expect.poll(() => row.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0)
    const box = (await row.boundingBox())!
    const session = await page.context().newCDPSession(page)
    const x = box.x + box.width - 25
    const y = box.y + box.height / 2
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x - step * 20, y }],
      })
      await page.waitForTimeout(25)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => row.evaluate(el => el.scrollLeft)).toBeGreaterThan(20)
    await expect(all).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/\/feedback\/@alice$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await session.detach()
  })
})

test('profile actions stay at the top right on desktop and beside the avatar on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('feedback/@alice')
  const profile = page.locator('[data-forum-user-profile="alice"]')
  await expect(profile.locator('[data-forum-user-name]')).toContainText('Alice', { timeout: 30_000 })
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const avatar = profile.locator('[data-forum-user-avatar]')
    const actions = profile.locator(':scope > div').first().getByRole('button', { name: '私信', exact: true })
    await expect(actions).toHaveCount(1)
    const avatarBox = await avatar.boundingBox()
    const actionsBox = await actions.boundingBox()
    expect(avatarBox).not.toBeNull()
    expect(actionsBox).not.toBeNull()
    expect(Math.abs(actionsBox!.y - avatarBox!.y)).toBeLessThan(2)
    expect(actionsBox!.x).toBeGreaterThan(avatarBox!.x + avatarBox!.width)
  }
})

test('mobile profile sort opens only on demand in a bottom drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('feedback/@alice')
  await expect(page.locator('h1[data-forum-user-name]')).toContainText('Alice', { timeout: 30_000 })
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await page.getByRole('button', { name: /.*最近创建/ }).click()
  const drawer = page.locator('[data-slot="drawer-content"]')
  await expect(drawer).toBeVisible()
  await expect.poll(async () => {
    const box = await drawer.boundingBox()
    const height = await page.evaluate(() => window.innerHeight)
    return box ? Math.abs(box.y + box.height - height) : Infinity
  }).toBeLessThan(2)
  await page.getByRole('option', { name: '最近更新' }).click()
  await expect(page).toHaveURL(/sort=updated/)
  await expect(page.getByRole('listbox')).toHaveCount(0)
})
