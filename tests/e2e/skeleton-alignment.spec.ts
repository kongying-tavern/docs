import type { Locator } from '@playwright/test'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const avatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Crect width="32" height="32" fill="gray"/%3E%3C/svg%3E'
test.use({ scenario: { topics: [issue({ user: { ...issue().user, avatar_url: avatar }, comments: 0 })] } })

async function dimensions(locator: Locator) {
  return locator.evaluateAll(elements => elements.map((element) => {
    const { x, width, height } = element.getBoundingClientRect()
    return { x, width, height }
  }))
}

for (const width of [320, 390, 640, 768, 959, 960, 1440]) {
  for (const mode of ['CARD', 'COMPACT', 'DETAIL']) {
    test(`${mode} skeleton controls align with loaded content at ${width}px`, async ({ page, scenario }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(mode => localStorage.setItem('FORUM-TOPIC-VIEW-MODE', mode), mode)
      let release!: () => void
      const pending = new Promise<void>(resolve => release = resolve)
      const detail = mode === 'DETAIL'
      scenario.handle = async ({ path }) => {
        if (path === `/api/v5/repos/KYJGYSDT/Feedback/issues${detail ? '/123' : ''}`)
          await pending
        return undefined
      }
      try {
        await page.goto(detail ? 'feedback/topic/123' : 'feedback')
        const row = detail
          ? page.locator('.mb-4').filter({ has: page.locator('[data-slot="skeleton"].h-8') }).first()
          : page.locator('.forum-topic-item').filter({ has: page.locator('[data-slot="skeleton"]') }).first()
        const pills = row.locator('[data-slot="skeleton"].rounded-full:not(.size-6):not(.size-8):not(.w-36px)')
        await expect(pills).toHaveCount(3)
        const before = await dimensions(pills)
        const headerBefore = await row.locator(detail ? ':scope > div' : '.topic-content > div').first().boundingBox()
        const imageBefore = !detail && mode === 'COMPACT'
          ? await row.locator('.h-75px').boundingBox()
          : null
        const imageOffsetBefore = imageBefore
          ? await row.locator('.h-75px').evaluate(element => element.getBoundingClientRect().y - element.closest('.forum-topic-item')!.getBoundingClientRect().y)
          : null
        const bounds = (await row.boundingBox())!
        for (const pill of before)
          expect(pill.x + pill.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThan(2)
        release()
        const loadedRow = detail
          ? page.locator('.mb-4').filter({ has: page.locator('#content') }).first()
          : page.locator('[data-forum-topic="123"]')
        const loadedPills = loadedRow.locator(detail ? ':scope > .mt-12 > *' : '.topic-info-list > *')
        await expect(loadedPills).toHaveCount(3)
        await expect(loadedPills.first()).toBeVisible()
        const after = await dimensions(loadedPills)
        for (let index = 0; index < before.length; index++) {
          expect(Math.abs(before[index].height - after[index].height)).toBeLessThan(1)
          expect(Math.abs(before[index].width - after[index].width)).toBeLessThan(6)
          expect(Math.abs(before[index].x - after[index].x)).toBeLessThan(6)
        }
        const headerAfter = await loadedRow.locator(detail ? ':scope > div' : '.topic-header').first().boundingBox()
        expect(Math.abs(headerBefore!.height - headerAfter!.height)).toBeLessThan(1)
        if (imageBefore) {
          const imageAfter = (await loadedRow.locator('.topic-compact-media').boundingBox())!
          const imageOffsetAfter = await loadedRow.locator('.topic-compact-media').evaluate(element => element.getBoundingClientRect().y - element.closest('.forum-topic-item')!.getBoundingClientRect().y)
          expect(imageBefore.width).toBeCloseTo(imageAfter.width, 1)
          expect(imageBefore.height).toBeCloseTo(imageAfter.height, 1)
          expect(imageOffsetBefore).toBeCloseTo(imageOffsetAfter, 1)
        }
      }
      finally {
        release()
      }
    })
  }
}

for (const width of [320, 390, 768, 959]) {
  test(`mobile settings skeleton preserves header geometry at ${width}px`, { tag: '@source' }, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let release!: () => void
    const pending = new Promise<void>(resolve => release = resolve)
    await page.route('**/SettingsContent.vue*', async (route) => {
      await pending
      await route.continue()
    })
    try {
      await page.goto('feedback#settings')
      const beforeHeader = page.locator('.settings-skeleton-header')
      await expect(beforeHeader).toBeVisible()
      const before = (await beforeHeader.boundingBox())!
      const buttonBefore = (await beforeHeader.getByRole('button').boundingBox())!
      release()
      const header = page.locator('.settings-drawer-header')
      await expect(header).toBeVisible()
      const after = (await header.boundingBox())!
      const buttonAfter = (await header.getByRole('button').boundingBox())!
      expect(Math.abs(before.height - after.height)).toBeLessThan(1)
      expect(Math.abs(before.width - after.width)).toBeLessThan(1)
      expect(buttonBefore.width).toBeCloseTo(buttonAfter.width, 1)
      expect(buttonBefore.height).toBeCloseTo(buttonAfter.height, 1)
      expect(Math.abs(buttonBefore.x - buttonAfter.x)).toBeLessThan(1)
    }
    finally {
      release()
    }
  })
}

for (const width of [960, 1440]) {
  test(`desktop settings skeleton preserves menu group positions at ${width}px`, { tag: '@source' }, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let release!: () => void
    const pending = new Promise<void>(resolve => release = resolve)
    await page.route('**/SettingsContent.vue*', async (route) => {
      await pending
      await route.continue()
    })
    try {
      await page.goto('feedback#settings')
      const skeleton = page.locator('.settings-skeleton-sidebar')
      await expect(skeleton).toBeVisible()
      await page.locator('.settings-dialog').evaluate(async element => Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {}))))
      const before = await skeleton.locator('.settings-skeleton-menu-group').evaluateAll(groups => groups.map(group => group.getBoundingClientRect().y))
      expect(before.length).toBe(2)
      release()
      const menu = page.locator('.settings-dialog-sidebar .settings-menu')
      await expect(menu).toBeVisible()
      const after = await menu.locator('.settings-navigation-group').evaluateAll(groups => groups.map(group => group.getBoundingClientRect().y))
      expect(after.length).toBe(before.length)
      for (let index = 0; index < before.length; index++)
        expect(Math.abs(before[index] - after[index])).toBeLessThan(1)
    }
    finally {
      release()
    }
  })
}

for (const width of [320, 1440]) {
  test(`card cover reserves its dimensions while the image loads at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let release!: () => void
    const pending = new Promise<void>(resolve => release = resolve)
    await page.route('**/86d3c06e1a1adf7ef432cf838f7abb8c_7693471731342377565.png', async (route) => {
      await pending
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="gray"/></svg>' })
    })
    try {
      await page.goto('md-enhance-guide', { waitUntil: 'domcontentloaded' })
      const cover = page.locator('.card-theme-normal .card-cover-container').first()
      await expect(cover).toBeVisible()
      await expect(cover).toHaveClass(/skeleton-animation/)
      const before = (await cover.boundingBox())!
      expect(before.width).toBeGreaterThan(200)
      expect(before.height).toBe(160)
      const footers = await page.locator('.card-theme-normal').evaluateAll(cards => cards.map((card) => {
        const footer = card.querySelector('.card-footer')!
        return { cardWidth: card.clientWidth, footerWidth: footer.getBoundingClientRect().width }
      }))
      expect(footers.length).toBeGreaterThan(1)
      for (const footer of footers)
        expect(Math.abs(footer.cardWidth - footer.footerWidth)).toBeLessThan(1)
      release()
      await expect(cover).not.toHaveClass(/skeleton-animation/)
      const after = (await cover.boundingBox())!
      expect(after.width).toBe(before.width)
      expect(after.height).toBe(before.height)
    }
    finally {
      release()
    }
  })
}
