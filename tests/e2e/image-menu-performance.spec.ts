import { writeFile } from 'node:fs/promises'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 1440, height: 900 }, scenario: { topics: Array.from({ length: 20 }, (_, index) => issue({ id: 900001 + index, number: String(123 + index), body: Array.from({ length: 3 }, (_, image) => `![image](https://example.com/image-${image}.svg)`).join('\n') })) } })

test('image menu input latency in a populated list', async ({ page }) => {
  await page.route('https://example.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"/>' }))
  await page.addInitScript(() => {
    const results: Record<string, number> = {}
    Object.assign(window, { menuPerformance: results })
    document.addEventListener('contextmenu', () => {
      const start = performance.now()
      function frame() {
        const menu = document.querySelector('[data-slot="context-menu-content"]')
        if (menu && !results.menuMounted)
          results.menuMounted = performance.now() - start
        if (menu && Number(getComputedStyle(menu).opacity) >= 0.99)
          results.menuOpaque = performance.now() - start
        else
          requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }, true)
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element) || !event.target.closest('[id="imageOpen"]'))
        return
      const start = performance.now()
      function frame() {
        const preview = document.querySelector('.forum-preview-root')
        if (preview)
          results.previewMounted = performance.now() - start
        else
          requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }, true)
    let keyProbe: { start: number, queries: number, original: Document['querySelector'] } | undefined
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'z')
        return
      const probe = { start: performance.now(), queries: 0, original: document.querySelector }
      keyProbe = probe
      Reflect.set(document, 'querySelector', (selector: string) => {
        probe.queries++
        return probe.original.call(document, selector)
      })
    }, true)
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'z' || !keyProbe)
        return
      Reflect.set(document, 'querySelector', keyProbe.original)
      results.keyQueries = keyProbe.queries
      results.keyHandling = performance.now() - keyProbe.start
      keyProbe = undefined
    })
  })
  await page.goto('feedback')
  const image = page.locator('.topic-media .forum-image-source').first()
  await expect(image).toHaveCSS('visibility', 'visible')
  await page.locator('.topic-media [data-forum-image-rail-item]').first().focus()
  await page.keyboard.press('z')
  await image.click({ button: 'right' })
  const menu = page.getByRole('menu')
  await expect(menu).toHaveCSS('opacity', '1')
  await expect(menu).toHaveCSS('animation-name', 'none')
  await expect(page.locator('body')).toHaveCSS('pointer-events', 'auto')
  await menu.screenshot({ path: test.info().outputPath('context-menu.png') })
  await menu.locator('[id="imageOpen"]').click()
  await expect(page.locator('.forum-preview-root')).toBeVisible()
  const metrics = await page.evaluate(() => Reflect.get(window, 'menuPerformance') as Record<string, number>)
  const report = test.info().outputPath('menu-performance.json')
  await writeFile(report, JSON.stringify(metrics, null, 2))
  await test.info().attach('menu-performance.json', { path: report, contentType: 'application/json' })
  expect(metrics.keyQueries).toBe(0)
})
