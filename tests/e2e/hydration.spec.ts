import process from 'node:process'
import { localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

const preview = process.env.FORUM_E2E_PREVIEW === 'true'
const base = preview ? '/docs/' : '/'

test.describe('production hydration', () => {
  test.skip(!preview, 'Hydration must be checked against the built SSR HTML')
  test.use({ timezoneId: 'America/New_York', viewport: { width: 1440, height: 900 }, scenario: { following: false } })

  for (const loggedIn of [false, true]) {
    test(`saved sidebar preferences hydrate and survive reload (logged in: ${loggedIn})`, async ({ page }) => {
      await page.addInitScript(({ auth, loggedIn }) => {
        if (loggedIn)
          localStorage.setItem('USER-AUTH', auth)
        for (const [section, open] of [['submitted', 'true'], ['participated', 'false'], ['followed', 'true']]) {
          const key = `forum-sidebar-${section}-open`
          if (localStorage.getItem(key) === null)
            localStorage.setItem(key, open)
        }
      }, { auth: localAuth(), loggedIn })
      await page.goto(`${base}feedback`)
      const sections = page.locator('.forum-sidebar-section')
      await expect(sections).toHaveCount(3)
      const checkPreferences = async () => {
        await expect(sections.nth(0)).toHaveJSProperty('open', true)
        await expect(sections.nth(1)).toHaveJSProperty('open', false)
        await expect(sections.nth(2)).toHaveJSProperty('open', true)
      }
      await checkPreferences()
      await page.reload()
      await checkPreferences()
    })
  }

  for (const locale of ['', 'en/', 'ja/']) {
    test(`${locale || 'root/'}forum shell matches the client sidebar`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (message) => {
        if (/hydration|mismatch/i.test(message.text()) || message.type() === 'error')
          errors.push(message.text())
      })
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}${locale}feedback`)
      await expect(page.locator('.forum-context-aside')).toBeVisible()
      await expect(page.locator('.VPSidebar')).toBeVisible()
      expect(errors).toEqual([])
    })

    test(`${locale || 'root/'}blog dates hydrate across time zones`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (message) => {
        if (/hydration|mismatch/i.test(message.text()) || message.type() === 'error')
          errors.push(message.text())
      })
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}${locale}blog/`)
      const time = page.locator('.blog-featured time').first()
      await expect(time).toBeVisible()
      // Once mounted, dates still use the visitor's time zone and locale.
      const localDate = await time.evaluate(element => new Intl.DateTimeFormat(
        element.getAttribute('data-locale') || document.documentElement.lang,
        { dateStyle: 'medium' },
      ).format(new Date(element.getAttribute('datetime')!)))
      await expect(time).toHaveText(localDate)
      expect(errors).toEqual([])
    })
  }
})
