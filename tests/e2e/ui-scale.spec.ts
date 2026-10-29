import { issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

for (const width of [390, 1450]) {
  for (const size of [12, 14, 18]) {
    test(`saved UI size ${size} scales text, icons, and controls at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((size) => {
        localStorage.setItem('site-ui-font-size', String(size))
        localStorage.setItem('site-motion-preference', 'reduce')
      }, size)
      await page.goto('feedback')
      await expect(page.locator('html')).toHaveAttribute('data-ui-font-size', String(size))
      const comment = page.locator('[data-action="comment"]').first()
      await expect(comment).toBeVisible()
      const geometry = await comment.evaluate((button) => {
        const style = getComputedStyle(button)
        const icon = getComputedStyle(button.querySelector('span')!)
        return {
          font: Number.parseFloat(style.fontSize),
          height: button.getBoundingClientRect().height,
          icon: Number.parseFloat(icon.width),
          rootFont: getComputedStyle(document.documentElement).fontSize,
          overflow: document.documentElement.scrollWidth - innerWidth,
        }
      })
      const scale = size / 14
      expect(geometry.font).toBeCloseTo(size, 1)
      expect(geometry.height).toBeCloseTo((width < 960 ? 36 : 32) * scale, 1)
      expect(geometry.icon).toBeCloseTo(20 * scale, 1)
      expect(geometry.rootFont).toBe('16px')
      expect(geometry.overflow).toBeLessThanOrEqual(1)
      const state = page.locator('.forum-topic-lifecycle').first()
      expect(await state.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(12 * scale, 1)
      expect(await state.locator('.forum-topic-lifecycle-icon').evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(12 * scale, 1)
      expect(await state.locator('.forum-topic-copy-icon').evaluate(element => Number.parseFloat(getComputedStyle(element).height))).toBeCloseTo(12 * scale, 1)
      const title = page.locator('main a[href$="/topic/123"]').first()
      expect(await title.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)))
        .toBeCloseTo(18 * scale, 1)
      if (width === 1450) {
        expect((await page.locator('.VPSidebar').boundingBox())!.width).toBeGreaterThan(280)
        expect((await page.locator('.VPSidebar').boundingBox())!.width).toBeLessThan(320)
      }
    })
  }
}

test('desktop size changes apply immediately and survive mobile resizing and reload', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('feedback#settings')
  const large = page.getByRole('button', { name: '大', exact: true })
  await expect(large).toBeVisible()
  await large.click()
  await expect(page.locator('html')).toHaveAttribute('data-ui-font-size', '18')
  const dialog = page.getByRole('dialog', { name: '设置', exact: true })
  await expect.poll(() => dialog.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(18, 1)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(large).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-ui-font-size', '18')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-ui-font-size', '18')
  await expect(page.getByRole('button', { name: '大', exact: true })).toHaveCount(0)
})

test.describe('source CSS control metrics', () => {
  test.use({ scenario: { following: false } })
  for (const size of [12, 14, 18]) {
    test(`mobile editor scales glyphs and text while preserving touch floors at ${size}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.addInitScript(({ size, auth }) => {
        localStorage.setItem('USER-AUTH', auth)
        localStorage.setItem('site-ui-font-size', String(size))
        localStorage.setItem('site-motion-preference', 'reduce')
      }, { size, auth: localAuth() })
      await page.goto('feedback/topic/123')
      await page.locator('.mobile-comment-entry-text').click()
      const editor = page.getByRole('dialog', { name: '评论', exact: true })
      await expect(editor.locator('[contenteditable="true"]')).toBeVisible()
      const geometry = await editor.locator('.editor-tools-mobile').evaluate((tools) => {
        const button = tools.querySelector('.editor-tool-actions button')!
        const publish = tools.querySelector('.editor-publish')!
        const glyph = button.querySelector('.icon-btn')!
        const rect = button.getBoundingClientRect()
        const inset = Number.parseFloat(getComputedStyle(button, '::before').top)
        return {
          button: rect.height,
          publish: publish.getBoundingClientRect().height,
          glyph: glyph.getBoundingClientRect().width,
          text: Number.parseFloat(getComputedStyle(publish).fontSize),
          line: Number.parseFloat(getComputedStyle(publish).lineHeight),
          hitHeight: rect.height - inset * 2,
          overflow: document.documentElement.scrollWidth - innerWidth,
        }
      })
      const scale = size / 14
      expect(geometry.button).toBeCloseTo(Math.max(36, 36 * scale), 1)
      expect(geometry.publish).toBeCloseTo(Math.max(36, 36 * scale), 1)
      expect(geometry.glyph).toBeCloseTo(24 * scale, 1)
      expect(geometry.text).toBeCloseTo(size, 1)
      expect(geometry.line).toBeCloseTo(20 * scale, 1)
      expect(geometry.hitHeight).toBeGreaterThanOrEqual(43.9)
      expect(geometry.overflow).toBeLessThanOrEqual(1)
    })
  }
})

test('windowed list retains its visible anchor when the UI preference changes', async ({ page, scenario }) => {
  const topics = Array.from({ length: 120 }, (_, index) => issue({
    id: 970000 + index,
    number: `IS${index}`,
    title: `FEAT:尺寸变化反馈 ${index}`,
    body: '用于验证字号变化后的长列表测量与定位。'.repeat(10 + index % 8),
    comments: 0,
  }))
  scenario.handle = request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
    ? { data: topics, headers: { 'Total_count': '120', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    : undefined
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.addInitScript(() => localStorage.setItem('site-motion-preference', 'reduce'))
  await page.goto('feedback')
  const list = page.locator('.topic-list')
  await expect(list).toHaveAttribute('data-total-items', '120', { timeout: 30_000 })
  await expect(list).toHaveAttribute('data-windowed', 'true')
  await page.evaluate(() => window.scrollTo({ top: 15_000, behavior: 'instant' }))
  const visible = () => list.locator(':scope > li[data-topic-id]').evaluateAll((rows) => {
    const row = rows.find((row) => {
      const rect = row.getBoundingClientRect()
      return rect.bottom > 64 && rect.top < innerHeight
    }) as HTMLElement | undefined
    return row ? { id: row.dataset.topicId!, top: row.getBoundingClientRect().top } : undefined
  })
  await expect.poll(visible).toBeTruthy()
  // Wait for the scroll's estimated rows and ResizeObserver measurements to settle.
  let previous = await visible()
  let stable = 0
  await expect.poll(async () => {
    const current = await visible()
    stable = current?.id === previous?.id && current && previous && Math.abs(current.top - previous.top) < 1 ? stable + 1 : 0
    previous = current
    return stable
  }, { intervals: [100] }).toBeGreaterThanOrEqual(3)
  const anchor = (await visible())!
  await page.evaluate(() => {
    localStorage.setItem('site-ui-font-size', '18')
    window.dispatchEvent(new StorageEvent('storage', { key: 'site-ui-font-size', newValue: '18', storageArea: localStorage }))
  })
  await expect(page.locator('html')).toHaveAttribute('data-ui-font-size', '18')
  const row = list.locator(`li[data-topic-id="${anchor.id}"]`)
  await expect(row).toBeAttached()
  await expect.poll(() => row.evaluate((element, top) => Math.abs(element.getBoundingClientRect().top - top), anchor.top))
    .toBeLessThan(12)
  expect(await list.locator(':scope > li[data-topic-id]').count()).toBeLessThan(50)
})

test('switch thumb positions scale with the track in both checked and pressed states', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('feedback#settings')
  const toggle = page.getByRole('switch', { name: '使用指针光标', exact: true })
  const thumb = toggle.locator('[data-slot="switch-thumb"]')
  for (const [label, size] of [['小', 12], ['标准', 14], ['大', 18]] as const) {
    await page.getByRole('button', { name: label, exact: true }).click()
    if (await toggle.getAttribute('aria-checked') === 'true')
      await toggle.click()
    const scale = size / 14
    const offset = () => thumb.evaluate(element => Number.parseFloat(getComputedStyle(element).translate))
    await expect.poll(offset).toBeCloseTo(3 * scale, 1)
    await toggle.click()
    await expect.poll(offset).toBeCloseTo(18 * scale, 1)
    await toggle.hover()
    await page.mouse.down()
    await expect.poll(offset).toBeCloseTo(16 * scale, 1)
    await page.mouse.up()
    await expect.poll(offset).toBeCloseTo(3 * scale, 1)
    await page.mouse.down()
    await expect.poll(offset).toBeCloseTo(5 * scale, 1)
    await page.mouse.up()
    await expect.poll(offset).toBeCloseTo(18 * scale, 1)
  }
})
