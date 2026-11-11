import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import UnoCSS from 'unocss/vite'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const vitepressRequire = createRequire(require.resolve('vitepress/package.json'))
const vue = vitepressRequire('@vitejs/plugin-vue').default
const root = fileURLToPath(new URL('../../../', import.meta.url)).replaceAll('\\', '/').replace(/\/$/, '')
const fixture = fileURLToPath(new URL('./fixtures/main.ts', import.meta.url)).replaceAll('\\', '/')
const entry = fileURLToPath(new URL('./fixtures/server.ts', import.meta.url)).replaceAll('\\', '/')

test('keyboard shortcut SSR and browser regression', { timeout: 120000 }, async (t) => {
  const server = await createServer({
    root,
    cacheDir: `${root}/node_modules/.vite-keyboard-shortcut`,
    configFile: false,
    plugins: [vue(), UnoCSS(), {
      name: 'keyboard-shortcut-test-page',
      configureServer(server) {
        server.middlewares.use('/keyboard-shortcut-test', async (_req, res, next) => {
          try {
            const { render } = await server.ssrLoadModule(entry)
            const html = await render()
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(`<html><head><meta charset="utf-8"><title>Keyboard shortcuts</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app">${html}</div><script type="module" src="/@fs/${fixture}"></script></body></html>`)
          }
          catch (error) {
            next(error)
          }
        })
      },
    }],
    resolve: {
      dedupe: ['vue', 'vue-i18n'],
      alias: { '@': `${root}/.vitepress/theme`, '~': `${root}/src` },
    },
    optimizeDeps: { entries: [fixture], include: ['vue', 'vue-i18n', 'cn', '@vueuse/core'] },
    server: { host: '127.0.0.1', port: 0 },
  })
  t.after(() => server.close())
  await server.listen()
  const url = `http://127.0.0.1:${server.httpServer.address().port}/keyboard-shortcut-test`
  const response = await fetch(url)
  const html = await response.text()
  assert.equal(response.status, 200, html)
  assert.match(html, /data-platform="unknown"/)
  assert.match(html, /Ctrl \/ ⌘/)

  const browser = await chromium.launch({ channel: process.env.KEYBOARD_BROWSER_CHANNEL || 'chrome', headless: true })
  t.after(() => browser.close())
  for (const [platform, expected, mod, meta] of [
    ['MacIntel', 'mac', '⌘', '⌘'],
    ['Win32', 'windows', 'Ctrl', '⊞'],
    ['Linux x86_64', 'linux', 'Ctrl', 'Meta'],
  ]) {
    await t.test(`hydrates ${expected} including a delayed instance`, async () => {
      const page = await browser.newPage({ viewport: { width: 375, height: 800 } })
      const failures = []
      page.on('pageerror', error => failures.push(error.message))
      page.on('console', (message) => {
        if (/hydration|mismatch/i.test(message.text()))
          failures.push(message.text())
      })
      await page.addInitScript((platform) => {
        Object.defineProperty(navigator, 'platform', { value: platform })
        Object.defineProperty(navigator, 'userAgentData', { value: undefined })
      }, platform)
      await page.goto(url)
      try {
        await page.waitForFunction((expected) => {
          const shortcuts = [...document.querySelectorAll('#auto [data-slot="keyboard-shortcut"], #deferred [data-slot="keyboard-shortcut"]')]
          return shortcuts.length === 2 && shortcuts.every(el => el.getAttribute('data-platform') === expected)
        }, expected)
      }
      catch (error) {
        throw new Error(`${error.message}\nBrowser errors: ${JSON.stringify(failures)}\n${await page.locator('body').textContent()}`)
      }
      const keys = id => page.locator(`#${id} [data-slot="kbd"]`)
      assert.deepEqual(await keys('auto').allTextContents(), [mod, 'K'])
      const keycap = await keys('auto').first().evaluate((element) => {
        const style = getComputedStyle(element)
        return { height: element.getBoundingClientRect().height, padding: style.paddingLeft, fontSize: style.fontSize, shadow: style.boxShadow }
      })
      assert.ok(keycap.height >= 20, 'keycaps retain their readable height')
      assert.ok(Number.parseFloat(keycap.padding) > 0, 'key labels have horizontal padding')
      assert.ok(Number.parseFloat(keycap.fontSize) >= 12, 'key labels retain a readable size')
      assert.notEqual(keycap.shadow, 'none')
      assert.deepEqual(await keys('deferred').allTextContents(), [mod, 'K'])
      assert.deepEqual(await keys('explicit').allTextContents(), [expected === 'mac' ? '⌃' : 'Ctrl', meta, 'K'])
      assert.deepEqual(await keys('fixed').allTextContents(), ['Ctrl', 'Alt', 'P'])
      await page.getByLabel('Platform').selectOption('mac')
      await page.waitForFunction(() => document.querySelector('#fixed [data-slot="keyboard-shortcut"]')?.getAttribute('data-platform') === 'mac')
      assert.deepEqual(await keys('fixed').allTextContents(), ['⌘', '⌥', 'P'])
      assert.equal(await page.locator('#sequence [aria-keyshortcuts]').count(), 0)
      assert.deepEqual(await keys('sequence').allTextContents(), ['Ctrl', 'Shift', 'A', 'Ctrl', 'Shift', 'D', '↑'])
      assert.equal(await page.locator('#sequence .sr-only').textContent(), 'Control plus Shift plus A, then Control plus Shift plus D, then Arrow Up')
      const accessible = await page.locator('#sequence').ariaSnapshot()
      assert.equal(accessible.match(/then/g)?.length, 2, accessible)
      assert.ok(!accessible.includes('↑'), accessible)
      assert.equal(await page.locator('#sequence [data-slot="kbd"] .keyboard-shortcut-separator').count(), 0)
      assert.deepEqual(await keys('mixed').allTextContents(), ['Ctrl', 'K', 'M'])
      assert.deepEqual(await keys('chords').allTextContents(), ['Ctrl', 'K', 'Ctrl', 'Alt', 'C'])
      const emphasis = await keys('chords').evaluateAll(elements => elements.map((element) => {
        const style = getComputedStyle(element)
        return { weight: Number(style.fontWeight), color: style.color }
      }))
      assert.ok(emphasis.slice(0, 2).every(key => key.weight > emphasis[2].weight), 'the leading combination is bold')
      assert.notEqual(emphasis[0].color, emphasis[2].color, 'the leading combination has stronger contrast')
      assert.equal(await page.locator('#chords .keyboard-shortcut-separator').count(), 3)
      assert.ok(!(await page.locator('#mixed .keyboard-shortcut-visual').textContent()).includes(','))
      const sequenceGap = await page.locator('#chords [data-slot="kbd-group"]').evaluateAll(([first, second]) => second.getBoundingClientRect().left - first.getBoundingClientRect().right)
      assert.ok(sequenceGap >= 10, `sequence steps need a visible gap: ${sequenceGap}`)
      const groups = await page.locator('#sequence [data-slot="kbd-group"]').evaluateAll(elements => elements.map((element) => {
        const box = element.getBoundingClientRect()
        return { top: box.top, bottom: box.bottom, width: box.width, keys: [...element.querySelectorAll('[data-slot="kbd"]')].map(key => key.getBoundingClientRect().top) }
      }))
      assert.equal(groups.length, 3)
      assert.ok(groups[1].top >= groups[0].bottom, JSON.stringify(groups))
      for (const group of groups)
        assert.ok(group.keys.every(top => top === group.keys[0]), JSON.stringify(group))
      const light = await keys('auto').first().evaluate(el => getComputedStyle(el).backgroundColor)
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      const dark = await keys('auto').first().evaluate(el => getComputedStyle(el).backgroundColor)
      assert.notEqual(light, dark)
      assert.deepEqual(failures, [])
      await page.close()
    })
  }
})
