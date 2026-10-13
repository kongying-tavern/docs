import { expect, test } from './support/test'

const cases = [320, 390, 768, 959, 960, 1440].map(width => ({ width, query: '' }))
cases.push({ width: 960, query: 'test' }, { width: 1440, query: 'test' })

for (const { width, query } of cases) {
  test(`profile skeleton matches the responsive header at ${width}px with query "${query}"`, async ({ page, scenario }) => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    scenario.handle = async ({ path }) => {
      if (path === '/api/v5/users/alice')
        await pending
      return undefined
    }
    await page.setViewportSize({ width, height: 900 })
    try {
      await page.goto(`feedback/@alice${query ? `?q=${query}` : ''}`)
      const skeleton = page.locator('[data-forum-user-profile-skeleton]')
      await expect(skeleton).toBeVisible({ timeout: 30_000 })
      // Wait for the page module; its fallback uses the same header skeleton.
      await expect(page.getByRole('button', { name: '全部类型', exact: true })).toBeVisible()
      const before = (await skeleton.boundingBox())!
      const avatarBefore = (await skeleton.locator('.rounded-full').boundingBox())!
      const searchSkeleton = skeleton.locator('[data-forum-search-skeleton]')
      const searchBefore = width >= 960 ? (await searchSkeleton.boundingBox())! : null
      await expect(searchSkeleton).toHaveCount(width >= 960 ? 1 : 0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThan(2)
      release()
      const profile = page.locator('[data-forum-user-profile="alice"]')
      await expect(profile.locator('[data-forum-user-name]')).toContainText('Alice')
      const after = (await profile.boundingBox())!
      const avatarAfter = (await profile.locator('[data-forum-user-avatar]').boundingBox())!
      expect(Math.abs(before.x - after.x)).toBeLessThan(2)
      expect(Math.abs(before.width - after.width)).toBeLessThan(2)
      expect(Math.abs(before.height - after.height)).toBeLessThan(8)
      expect(Math.abs(avatarBefore.x - avatarAfter.x)).toBeLessThan(2)
      expect(Math.abs(avatarBefore.width - avatarAfter.width)).toBeLessThan(2)
      if (searchBefore) {
        const searchAfter = (await profile.locator('.forum-search-box').boundingBox())!
        expect(Math.abs(searchBefore.width - searchAfter.width)).toBeLessThan(2)
        expect(Math.abs(searchBefore.height - searchAfter.height)).toBeLessThan(2)
      }
    }
    finally {
      release()
    }
  })
}
