import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import UnoCSS from 'unocss/vite'
import { createServer } from 'vite'

// Use the root dev dependency; keep the existing explicit installation override.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SWIPE_PLAYWRIGHT_PATH || '@playwright/test')
const vitepressRequire = createRequire(require.resolve('vitepress/package.json'))
const vue = vitepressRequire('@vitejs/plugin-vue').default
const root = fileURLToPath(new URL('../../../', import.meta.url)).replaceAll('\\', '/').replace(/\/$/, '')
const fixture = fileURLToPath(new URL('./fixtures/main.ts', import.meta.url)).replaceAll('\\', '/')

test('swipe actions browser regression', { timeout: 120000 }, async (t) => {
  const server = await createServer({
    root,
    configFile: false,
    plugins: [vue(), UnoCSS(), {
      name: 'swipe-test-page',
      configureServer(server) {
        server.middlewares.use('/swipe-test', (_req, res) => {
          res.setHeader('Content-Type', 'text/html')
          res.end(`<html><head><title>Swipe actions test</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div><script type="module" src="/@fs/${fixture}"></script></body></html>`)
        })
      },
    }],
    resolve: {
      dedupe: ['vue'],
      alias: {
        '@': `${root}/.vitepress/theme`,
        '~': `${root}/src`,
      },
    },
    optimizeDeps: { include: ['vue', '@lucide/vue', 'cn', '@vueuse/core', 'reka-ui', 'class-variance-authority'] },
    server: { host: '127.0.0.1', port: 0 },
  })
  await server.listen()
  t.after(async () => {
    await server.close()
  })
  const browser = await chromium.launch({ channel: process.env.SWIPE_BROWSER_CHANNEL || 'chrome', headless: true })
  t.after(async () => {
    await browser.close()
  })
  const page = await browser.newPage({ viewport: { width: 640, height: 800 }, hasTouch: true })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const url = `http://127.0.0.1:${server.httpServer.address().port}/swipe-test`
  const rows = page.locator('[data-slot="swipe-actions-row"]')
  const content = index => rows.nth(index).locator('.swipe-actions-content')
  const more = index => rows.nth(index).locator('[data-swipe-more]')
  async function home() {
    await page.goto(url)
    try {
      await rows.nth(2).waitFor({ timeout: 15000 })
    }
    catch (error) {
      throw new Error(`${error.message}\nPage errors: ${JSON.stringify(errors)}\n${await page.locator('body').textContent()}`)
    }
  }
  async function offset(index) {
    return content(index).evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)
  }
  async function waitOffset(index, expected) {
    await page.waitForFunction(({ index, expected }) => {
      const el = document.querySelectorAll('.swipe-actions-content')[index]
      return el && Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41 - expected) < 0.5
    }, { index, expected })
  }
  async function swipe(index, dx, dy = 0) {
    const box = await content(index).boundingBox()
    const startX = dx < 0 ? box.x + box.width - 60 : box.x + 40
    const startY = box.y + 20
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + dx, startY + dy, { steps: 8 })
    await page.waitForTimeout(110)
    await page.mouse.up()
  }
  async function touchSwipe(index, dx, dy = 0) {
    const session = await page.context().newCDPSession(page)
    const box = await content(index).boundingBox()
    const startX = dx < 0 ? box.x + box.width - 40 : box.x + 40
    const startY = box.y + box.height / 2
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: startY }] })
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + dx * step / 8, y: startY + dy * step / 8 }] })
      await page.waitForTimeout(20)
    }
    await page.waitForTimeout(110)
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await session.detach()
  }
  await home()
  assert.equal(await page.title(), 'Swipe actions test')
  assert.equal(await page.getByRole('list', { name: 'Inbox' }).count(), 1)
  assert.equal(await page.locator('vite-error-overlay').count(), 0)

  await t.test('short/vertical movement, one open row, outside press and Escape', async () => {
    await swipe(0, 20)
    await waitOffset(0, 0)
    await swipe(0, 10, 80)
    await waitOffset(0, 0)
    await swipe(0, 55)
    await waitOffset(0, 76)
    await swipe(1, -140)
    await waitOffset(0, 0)
    await waitOffset(1, -228)
    await page.keyboard.press('Escape')
    await waitOffset(1, 0)
    await swipe(0, 55)
    await waitOffset(0, 76)
    await page.locator('[data-outside]').click()
    await waitOffset(0, 0)
  })
  await t.test('revealed button, full swipe, disabled full swipe, and drag click suppression', async () => {
    await swipe(0, 55)
    await waitOffset(0, 76)
    await rows.nth(0).locator('[data-swipe-side="leading"]').click()
    assert.equal(await page.locator('output').textContent(), 'read:1')
    await waitOffset(0, 0)
    await swipe(1, -350)
    await page.waitForFunction(() => document.querySelector('output').textContent === 'delete:2')
    await page.waitForFunction(() => document.querySelectorAll('[data-slot="swipe-actions-row"]').length === 2)
    await home()
    await page.getByLabel('Full swipe', { exact: true }).uncheck()
    await swipe(0, -350)
    await waitOffset(0, -228)
    assert.equal(await rows.count(), 3)
    assert.equal(await page.locator('output').textContent(), '')
  })
  await t.test('full right swipe executes keepRow action and then returns home', async () => {
    await home()
    await swipe(0, 350)
    await page.waitForFunction(() => document.querySelector('output').textContent === 'read:1')
    await waitOffset(0, 0)
    assert.equal(await rows.count(), 3)
  })
  await t.test('pointer cancellation never commits an armed gesture', async () => {
    await home()
    const el = content(0)
    // Synthetic pointers cannot be captured by the platform; use a real captured mouse for cancellation.
    const box = await el.boundingBox()
    await page.mouse.move(box.x + box.width - 50, box.y + 20)
    await page.mouse.down()
    await page.mouse.move(box.x + 5, box.y + 20, { steps: 8 })
    await el.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', clientX: box.x + 5, clientY: box.y + 20 })
    await page.mouse.up()
    await waitOffset(0, 0)
    assert.equal(await rows.count(), 3)
    assert.equal(await page.locator('output').textContent(), '')
  })
  await t.test('full swipe and tapped actions show only the chosen opaque cover', async () => {
    await home()
    const box = await content(0).boundingBox()
    await page.mouse.move(box.x + box.width - 40, box.y + 20)
    await page.mouse.down()
    await page.mouse.move(box.x + 5, box.y + 20, { steps: 8 })
    const deleteCover = rows.nth(0).locator('[data-swipe-side="trailing"]').last()
    assert.equal(await deleteCover.getAttribute('data-covering'), 'true')
    assert.equal(await deleteCover.evaluate(el => getComputedStyle(el).opacity), '1')
    assert.equal(await rows.nth(0).locator('[data-swipe-side="trailing"]').first().evaluate(el => getComputedStyle(el).visibility), 'hidden')
    await content(0).dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' })
    await page.mouse.up()
    await waitOffset(0, 0)

    // The first action is not the outermost full-swipe action.
    await swipe(0, -140)
    await waitOffset(0, -228)
    const fail = rows.nth(0).locator('[data-swipe-side="trailing"]').first()
    await fail.click()
    assert.equal(await fail.getAttribute('data-covering'), 'true')
    assert.equal(await fail.evaluate(el => getComputedStyle(el).opacity), '1')
    assert.equal(await deleteCover.evaluate(el => getComputedStyle(el).visibility), 'hidden')
    await page.waitForFunction(() => document.querySelector('[data-errors]').textContent.trim() === 'Errors: 1')
    await waitOffset(0, 0)
  })
  await t.test('keyboard menu, disabled action, async failure and deletion focus', async () => {
    await home()
    await more(0).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: 'Mark read', exact: true }).waitFor()
    assert.equal(await page.getByRole('menuitem', { name: 'Disabled', exact: true }).getAttribute('aria-disabled'), 'true')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Home')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('output').textContent === 'read:1')
    await waitOffset(0, 0)
    await more(0).click()
    await page.getByRole('menuitem', { name: 'Fail', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[data-errors]').textContent.trim() === 'Errors: 1')
    await waitOffset(0, 0)
    await more(0).click()
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'More actions for Message 2')
    await page.waitForFunction(() => document.querySelectorAll('[data-slot="swipe-actions-row"]').length === 2)
    await more(0).click()
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'More actions for Message 3')
    await more(0).click()
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Inbox')
  })
  await t.test('parent rerender keeps an asynchronous action visible and locked until it returns home', async () => {
    await home()
    await page.getByLabel('Slow action', { exact: true }).check()
    await swipe(0, 55)
    await waitOffset(0, 76)
    await rows.nth(0).locator('[data-swipe-side="leading"]').click()
    await page.waitForFunction(() => document.querySelector('output').textContent === 'read:1')
    assert.equal(await rows.nth(0).getAttribute('aria-busy'), 'true')
    assert.equal(await more(0).isDisabled(), true)
    assert.equal(await rows.nth(0).locator('[data-covering="true"] .animate-spin').count(), 1)
    await page.waitForTimeout(100)
    assert.ok(Math.abs(await offset(0) - 76) < 0.5)
    await waitOffset(0, 0)
    await page.waitForFunction(() => document.querySelector('[data-slot="swipe-actions-row"]').getAttribute('aria-busy') === 'false')
    assert.equal(await more(0).isDisabled(), false)
  })
  await t.test('mobile, reduced motion, disabled rows and slotted links', async () => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await home()
    await touchSwipe(0, 55)
    await waitOffset(0, 76)
    if (process.env.SWIPE_SCREENSHOT)
      await page.screenshot({ path: process.env.SWIPE_SCREENSHOT })
    await page.keyboard.press('Escape')
    await waitOffset(0, 0)
    await touchSwipe(1, 5, -80)
    await page.waitForFunction(() => scrollY > 20)
    await waitOffset(1, 0)
    await page.evaluate(() => scrollTo(0, 0))
    await touchSwipe(0, 240)
    await page.waitForFunction(() => document.querySelector('output').textContent === 'read:1')
    await waitOffset(0, 0)
    assert.equal(await rows.count(), 3)
    await rows.nth(0).getByRole('link').click()
    assert.ok(page.url().endsWith('#link'))
    await page.getByLabel('Disable rows', { exact: true }).check()
    await swipe(0, 150)
    assert.equal(await offset(0), 0)
    assert.equal(await more(0).isDisabled(), true)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  })
  assert.deepEqual(errors, [])
})
