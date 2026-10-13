import { fileURLToPath } from 'node:url'
import { expect, test } from './support/test'

test('offscreen cached comment counts do not initialize character measurements', { tag: '@source' }, async ({ page, forum }) => {
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30_000 })
  const moduleUrl = `/@fs/${fileURLToPath(new URL('./support/reaction-cache-probe.ts', import.meta.url)).replaceAll('\\', '/')}`
  await page.evaluate(async (url) => {
    const { mountReactionCacheProbe } = await import(url)
    const probe = await mountReactionCacheProbe()
    document.getElementById('reaction-cache-probe')!.addEventListener('show-second', () => probe.showSecond())
  }, moduleUrl)
  const probe = page.locator('#reaction-cache-probe')
  await expect(probe.locator('[aria-live="polite"]')).toContainText('3')
  const before = forum.requests.filter(request => request.path === '/api/reactions').length
  await page.evaluate(() => {
    const root = document.getElementById('reaction-cache-probe')!
    const original = Element.prototype.getBoundingClientRect
    let reads = 0
    root.setAttribute('data-offscreen-layout-reads', '0')
    Element.prototype.getBoundingClientRect = function () {
      if (this.closest('[data-probe="offscreen"]'))
        root.setAttribute('data-offscreen-layout-reads', String(++reads))
      return original.call(this)
    }
    root.dispatchEvent(new Event('show-second'))
  })
  await expect(probe.locator('[data-probe="offscreen"] [aria-live="polite"]')).toContainText('3')
  await expect(probe).toHaveAttribute('data-offscreen-layout-reads', '0')
  expect(forum.requests.filter(request => request.path === '/api/reactions')).toHaveLength(before)
})
