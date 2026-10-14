import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { currentUser, issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 1440, height: 900 }, scenario: { topics: [issue({ body: '![手机截图](https://example.com/phone.jpeg)' })] } })

test('phone screenshots have readable top crops and configurable preview menus', async ({ page }) => {
  await page.route('https://example.com/phone.jpeg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2400"><rect width="1080" height="2400" fill="#ddd"/></svg>' }))
  await page.goto('feedback')
  const image = page.locator('.topic-media .forum-image-source').first()
  await expect(image).toHaveCSS('visibility', 'visible')
  await expect(image).toHaveCSS('object-position', '50% 0%')
  expect((await image.boundingBox())!.width).toBeGreaterThan(180)
  await expect(page.locator('.topic-media .forum-long-image-label')).toBeVisible()
  await image.click({ button: 'right' })
  const menu = page.getByRole('menu')
  await expect(menu).toHaveCSS('min-width', '256px')
  const copyRow = menu.locator('[id="imageCopy"]')
  await expect(copyRow.locator('.i-lucide-copy')).toBeVisible()
  await expect(copyRow.locator('[data-slot="forum-menu-shortcut"] kbd:not([data-slot="kbd-group"])')).toHaveCount(3)
  const rowBounds = (await copyRow.boundingBox())!
  const keyBounds = (await copyRow.locator('[data-slot="forum-menu-shortcut"]').boundingBox())!
  expect(rowBounds.x + rowBounds.width - keyBounds.x - keyBounds.width).toBeLessThan(12)
  await expect(menu.getByRole('menuitem', { name: /复制图片链接/ })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: /查看图片原数据/ })).toHaveCount(0)
  await menu.getByRole('menuitem', { name: /查看图片/ }).click()
  const preview = page.locator('.forum-preview-root')
  await expect(preview).toBeVisible()
  await page.locator('[data-slot="context-menu-content"]').waitFor({ state: 'detached' })
  const panel = preview.locator('.preview-side-panel')
  await expect(preview.locator('.forum-preview-panel-toggle')).toBeVisible()
  await preview.locator('.forum-preview-panel-toggle').focus()
  await expect(preview.locator('.forum-preview-panel-toggle')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(panel).toBeHidden()
  await expect(preview.locator('.forum-long-reader-viewport img')).toHaveClass(/cursor-zoom-in/)
  await page.keyboard.press('Enter')
  await expect(panel).toBeVisible()
  await page.keyboard.press('i')
  await expect(panel).toBeHidden()
  await page.evaluate(() => {
    const key = 'forum-keyboard-shortcuts-v1'
    const value = JSON.stringify({ overrides: { imagePanel: { enabled: true, binding: 'J' }, imageClose: { enabled: true, binding: 'Q' } } })
    localStorage.setItem(key, value)
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value, storageArea: localStorage }))
  })
  await expect(preview.locator('.forum-preview-panel-toggle')).toHaveAttribute('title', 'J')
  await page.keyboard.press('i')
  await expect(panel).toBeHidden()
  await page.keyboard.press('j')
  await expect(panel).toBeVisible()
  await preview.locator('.forum-long-reader-viewport img').click({ button: 'right' })
  await expect(menu.getByRole('menuitem', { name: /显示／隐藏右侧面板/ })).toContainText('J')
  await page.evaluate(() => {
    const key = 'forum-keyboard-shortcuts-v1'
    const value = JSON.stringify({ overrides: { imagePanel: { enabled: true, binding: 'Mod+Shift+K' }, imageClose: { enabled: true, binding: 'Q' } } })
    localStorage.setItem(key, value)
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value, storageArea: localStorage }))
  })
  await expect(menu.locator('[id="imagePanel"] [data-slot="kbd-group"] > kbd')).toHaveText(['Ctrl', 'Shift', 'K'])
  await expect(preview.locator('.forum-preview-panel-toggle')).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+K')
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(preview).toBeVisible()
  await page.keyboard.press('q')
  await expect(preview).toBeHidden()
  await page.reload()
  await image.click()
  await expect(preview.locator('.forum-preview-panel-toggle')).toHaveAttribute('title', 'Ctrl+Shift+K')
  await expect(preview.getByRole('button', { name: '关闭', exact: true })).toBeVisible()
  await preview.getByRole('button', { name: '关闭', exact: true }).focus()
  await expect(preview.getByRole('button', { name: '关闭', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(preview).toBeHidden()
})

test('pending image downloads do not block closing the preview', async ({ page }) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2400"/>'
  let finishRequest: (() => void) | undefined
  await page.addInitScript(() => Reflect.deleteProperty(window, 'showSaveFilePicker'))
  await page.route('https://example.com/phone.jpeg', async (route) => {
    if (route.request().resourceType() === 'fetch')
      await new Promise<void>(resolve => finishRequest = resolve)
    await route.fulfill({ contentType: 'image/svg+xml', body: svg }).catch(() => {})
  })
  await page.goto('feedback')
  await page.locator('.topic-media .forum-image-source').first().click()
  const preview = page.locator('.forum-preview-root')
  await expect(preview).toBeVisible()
  await preview.locator('.forum-long-reader-viewport img').click({ button: 'right' })
  await page.getByRole('menuitem', { name: /图片另存为/ }).click()
  await expect.poll(() => !!finishRequest).toBe(true)
  let downloads = 0
  page.on('download', () => downloads++)
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  finishRequest?.()
  await expect(page.getByText('已保存图片', { exact: true })).toHaveCount(0)
  expect(downloads).toBe(0)
})

test('image copy writes PNG and save fallback downloads original bytes', async ({ page }) => {
  await page.goto('feedback')
  const jpeg = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 64
    canvas.getContext('2d')!.fillRect(0, 0, 32, 64)
    return canvas.toDataURL('image/jpeg').split(',')[1]
  })
  const original = Buffer.from(jpeg, 'base64')
  await page.route('https://example.com/phone.jpeg', route => route.fulfill({ contentType: 'image/jpeg', body: original }))
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'showSaveFilePicker')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      write: async (items: ClipboardItem[]) => {
        const type = items[0].types[0]
        const blob = await items[0].getType(type)
        if (type === 'text/plain')
          sessionStorage.setItem('copied-image-link', await blob.text())
        else
          sessionStorage.setItem('copied-image-type', blob.type)
      },
      writeText: async (text: string) => sessionStorage.setItem('copied-image-link', text),
    } })
  })
  await page.reload()
  const image = page.locator('.topic-media .forum-image-source').first()
  await expect(image).toHaveCSS('visibility', 'visible')
  await image.click({ button: 'right' })
  await page.getByRole('menu').locator('[id="imageCopy"]').click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('copied-image-type'))).toBe('image/png')
  await image.click({ button: 'right' })
  await page.getByRole('menuitem', { name: /复制图片链接/ }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('copied-image-link'))).toBe('https://example.com/phone.jpeg')
  await image.click({ button: 'right' })
  const downloading = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: /图片另存为/ }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('phone.jpeg')
  expect(await readFile((await download.path())!)).toEqual(original)
  await page.route('https://example.com/phone.jpeg', route => route.abort())
  await image.click({ button: 'right' })
  await page.getByRole('menu').locator('[id="imageCopy"]').click()
  await expect(page.getByText('操作失败，请检查网络或浏览器权限后重试', { exact: true })).toBeVisible()
})

test('administrators inspect resource data without closing the preview', async ({ page, scenario }) => {
  scenario.user = currentUser
  scenario.handle = request => request.path === '/api/v5/orgs/KYJGYSDT/members' ? { data: [currentUser] } : undefined
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 16
    return canvas.toDataURL().split(',')[1]
  })
  await page.route('https://example.com/phone.jpeg', route => route.fulfill({ contentType: 'image/png', body: Buffer.from(png, 'base64') }))
  await page.goto('feedback/topic/123')
  const image = page.locator('.forum-image-source').first()
  await expect(image).toHaveCSS('visibility', 'visible')
  await image.click()
  const preview = page.locator('.forum-preview-root')
  await expect(preview).toBeVisible()
  await preview.locator('.forum-preview-stack').click({ button: 'right' })
  await page.getByRole('menuitem', { name: /查看图片原数据/ }).click()
  const dialog = page.locator('[data-image-metadata]')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('image/png')
  await expect(dialog).toContainText('phone.jpeg')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(preview).toBeVisible()
  await page.route('https://example.com/phone.jpeg', route => route.abort())
  await preview.locator('.forum-preview-stack').click({ button: 'right' })
  await page.getByRole('menuitem', { name: /查看图片原数据/ }).click()
  await expect(dialog).toContainText('资源信息读取失败')
  await expect(dialog).toContainText('16 × 16')
  await expect(dialog).toContainText('phone.jpeg')
})

test('shortcut settings record and disable image panel bindings', async ({ page }) => {
  await page.goto('settings#shortcuts')
  const row = page.locator('.shortcut-row').filter({ has: page.locator('#shortcut-label-imagePanel') })
  await expect(row).toBeVisible()
  await row.getByRole('button').click()
  const recorder = page.locator('[data-shortcut-recorder]')
  await expect(recorder).toBeFocused()
  await page.keyboard.press('j')
  await page.getByRole('dialog').getByRole('button', { name: '保存', exact: true }).click()
  await expect(row).toContainText('J')
  await row.getByRole('switch').click()
  await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  await page.reload()
  await expect(row).toContainText('J')
  await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
})

test('save as uses the existing file system wrapper when supported', async ({ page }) => {
  await page.addInitScript(() => {
    let saved = new Blob()
    Object.defineProperty(window, 'showOpenFilePicker', { configurable: true, value: async () => [] })
    Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: async (options: { suggestedName: string }) => {
      sessionStorage.setItem('picker-name', options.suggestedName)
      return {
        getFile: async () => new File([saved], options.suggestedName),
        createWritable: async () => ({
          write: async (blob: Blob) => { saved = blob },
          close: async () => { sessionStorage.setItem('picker-size', String(saved.size)) },
        }),
      }
    } })
  })
  await page.route('https://example.com/phone.jpeg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2400"/>' }))
  await page.goto('feedback')
  const image = page.locator('.topic-media .forum-image-source').first()
  await expect(image).toHaveCSS('visibility', 'visible')
  await image.click({ button: 'right' })
  await page.getByRole('menuitem', { name: /图片另存为/ }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('picker-name'))).toBe('phone.jpeg')
  await expect.poll(() => page.evaluate(() => Number(sessionStorage.getItem('picker-size')))).toBeGreaterThan(0)
})
