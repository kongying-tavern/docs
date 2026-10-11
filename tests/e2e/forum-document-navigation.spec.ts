import process from 'node:process'
import { expect, test } from './support/test'

const preview = process.env.FORUM_E2E_PREVIEW === 'true'
const base = preview ? '/docs/' : '/'

for (const intent of ['hover', 'focus', 'click'] as const) {
  test(`forum entry warms on ${intent} from a document`, async ({ page }) => {
    test.skip(!preview, 'Chunk loading assertions require production bundles')
    const chunks: string[] = []
    const errors: string[] = []
    page.on('request', request => chunks.push(request.url()))
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}manual/client/`)
    await expect(page.locator('.vp-doc')).toContainText('使用帮助')
    const entryChunks = () => chunks.filter(url => /\/(?:Forum|ForumSidebar|ForumRouteView)\.[^/]+\.js$/.test(url))
    expect(entryChunks()).toEqual([])
    await page.getByRole('button', { name: '帮助和反馈', exact: true }).click()
    const link = page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('link', { name: '问题反馈', exact: true })
    await expect(link).toBeVisible()
    if (intent === 'click') {
      // Programmatic activation exercises navigation without preceding hover/focus.
      await link.evaluate(element => (element as HTMLAnchorElement).click())
    }
    else {
      if (intent === 'hover')
        await link.hover()
      else
        await link.focus()
      await expect.poll(() => entryChunks().length).toBe(3)
      await expect(page).toHaveURL(new RegExp(`${base}manual/client/$`))
      await link.click()
    }
    await expect(page.locator('.forum-context-aside')).toBeVisible()
    expect(entryChunks()).toHaveLength(3)
    expect(new Set(entryChunks()).size).toBe(3)
    expect(errors).toEqual([])
  })
}

for (const connection of [{ saveData: true, effectiveType: '4g' }, { saveData: false, effectiveType: '2g' }]) {
  test(`forum entry respects network preference ${JSON.stringify(connection)}`, async ({ page }) => {
    test.skip(!preview, 'Chunk loading assertions require production bundles')
    await page.addInitScript((value) => {
      Object.defineProperty(navigator, 'connection', { configurable: true, value })
    }, connection)
    const chunks: string[] = []
    page.on('request', request => chunks.push(request.url()))
    await page.goto(`${base}manual/client/`)
    await page.getByRole('button', { name: '帮助和反馈', exact: true }).click()
    const link = page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('link', { name: '问题反馈', exact: true })
    await link.hover()
    await link.focus()
    // Events run synchronously; wait one frame before checking their requests.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
    expect(chunks.filter(url => /\/(?:Forum|ForumSidebar|ForumRouteView)\.[^/]+\.js$/.test(url))).toEqual([])
    await link.click()
    await expect(page.locator('.forum-context-aside')).toBeVisible()
  })
}

for (const entry of ['feedback', 'feedback?sort=updated', 'feedback#forum-preload-check', 'feedback/topic/123']) {
  test(`first document navigation from ${entry} renders the full body`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error')
        errors.push(message.text())
    })
    const chunks: string[] = []
    page.on('request', request => chunks.push(request.url()))
    await page.goto(`${base}${entry}`)
    const entryUrl = new URL(`${base}${entry}`, page.url()).href
    await expect(page.locator('.forum-context-aside')).toBeVisible()
    await expect(page).toHaveURL(entryUrl)
    const link = page.locator(`${entry.includes('/topic/') ? '.forum-sidebar-link' : '.forum-aside-document-item'}[href="${base}manual/client/"]`)
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${base}manual/client/$`))
    await expect(page.locator('.vp-doc')).toContainText('使用帮助')
    await expect(page.locator('.vp-doc a').filter({ hasText: '基础使用教程' })).toBeVisible()
    expect(errors).toEqual([])
    if (preview)
      expect(chunks.filter(url => /manual_client_index.*\.lean\.js$/.test(url))).toEqual([])
    await page.setViewportSize({ width: 800, height: 900 })
    await expect(page.locator('.vp-doc')).toContainText('常见问题')
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.locator('.vp-doc')).toContainText('使用帮助')
    await page.goBack()
    await expect(page).toHaveURL(entryUrl)
    await expect(page.locator('.forum-context-aside')).toBeVisible()
  })
}
