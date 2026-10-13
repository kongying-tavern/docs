import { expect, test } from './support/test'

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
