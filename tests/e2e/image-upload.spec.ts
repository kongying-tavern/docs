import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { fileURLToPath } from 'node:url'
import { currentUser, localAuth } from './fixtures/gitee'
import { animatedPng, animatedWebp, png } from './fixtures/images'
import { expect, test } from './support/test'

test.use({ scenario: { following: false, user: { ...currentUser, id: 2 }, comments: [] } })

async function openForm(page: Page) {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('/feedback')
  await page.getByRole('button', { name: '新建反馈', exact: true }).click()
  await page.locator('[data-publish-type-chooser]').getByRole('button').filter({ hasText: '我想要' }).click()
  const form = page.locator('.compact-form')
  await expect(form).toBeVisible()
  return form
}

test('one editor drop creates one attachment and one request', async ({ page, scenario, forum }) => {
  scenario.handle = request => request.path === '/api/images/upload'
    ? { data: { statusCode: 200, data: { pathname: 'drop.png', size: png.length } } }
    : undefined
  const form = await openForm(page)
  const dataTransfer = await page.evaluateHandle((bytes) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([new Uint8Array(bytes)], 'drop.png', { type: 'image/png' }))
    return transfer
  }, [...png])
  await form.locator('[contenteditable="true"]').dispatchEvent('drop', { dataTransfer })
  await expect(form.locator('[data-status="uploaded"]')).toHaveCount(1)
  expect(forum.requests.filter(request => request.path === '/api/images/upload')).toHaveLength(1)
})

test('simultaneous duplicates and later reselection reuse one upload; different bytes upload separately', async ({ page, scenario, forum }) => {
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  scenario.handle = async (request) => {
    if (request.path !== '/api/images/upload')
      return
    await wait
    return { data: { statusCode: 200, data: { pathname: 'shared.png', size: png.length } } }
  }
  const form = await openForm(page)
  const input = form.locator('input[type="file"]')
  await input.setInputFiles([
    { name: 'first.png', mimeType: 'image/png', buffer: png },
    { name: 'renamed.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(form.locator('[data-status="uploading"]')).toHaveCount(2)
  await expect.poll(() => forum.requests.filter(request => request.path === '/api/images/upload').length).toBe(1)
  await form.getByRole('button', { name: '移除 first.png', exact: true }).click()
  release()
  await expect(form.locator('[data-status="uploaded"]')).toHaveCount(1)
  await input.setInputFiles({ name: 'again.png', mimeType: 'image/png', buffer: png })
  await expect(form.locator('[data-status="uploaded"]')).toHaveCount(2)
  expect(forum.requests.filter(request => request.path === '/api/images/upload')).toHaveLength(1)
  await input.setInputFiles({ name: 'again.png', mimeType: 'image/png', buffer: Buffer.concat([png, Buffer.from([0])]) })
  await expect(form.locator('[data-status="uploaded"]')).toHaveCount(3)
  expect(forum.requests.filter(request => request.path === '/api/images/upload')).toHaveLength(2)
})

test.describe('legacy upload picker', () => {
  test.use({ hasTouch: true, scenario: { following: false, user: currentUser, comments: [] } })
  test('the visible picker opens by keyboard and has a visible focus indicator', async ({ page, scenario }) => {
    scenario.handle = request => request.path === '/api/images/upload'
      ? { data: { statusCode: 200, data: { pathname: 'keyboard.png', size: png.length } } }
      : undefined
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('/feedback')
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    const form = page.locator('.form-container')
    const trigger = form.locator('.forum-image-upload').getByRole('button', { name: '添加图片', exact: true })
    await page.keyboard.press('Tab')
    await trigger.focus()
    const focus = await trigger.evaluate((element) => {
      const style = getComputedStyle(element)
      return { visible: element.matches(':focus-visible'), style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
    })
    expect(focus.visible).toBe(true)
    expect(focus.style).not.toBe('none')
    expect(focus.width).toBeGreaterThan(0)
    const selecting = page.waitForEvent('filechooser')
    await page.keyboard.press('Enter')
    await (await selecting).setFiles({ name: 'keyboard.png', mimeType: 'image/png', buffer: png })
    await expect(form.locator('[data-status="uploaded"]')).toHaveCount(1)
  })
  test('touch recovery controls fit the small legacy thumbnail without overlapping', async ({ page, scenario }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    scenario.handle = request => request.path === '/api/images/upload'
      ? { status: 503, data: { message: 'Synthetic image failure' } }
      : undefined
    await page.goto('/feedback')
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    const form = page.locator('.form-container')
    await form.locator('input[type="file"]').setInputFiles({ name: 'legacy.png', mimeType: 'image/png', buffer: png })
    await expect(form.locator('[data-status="failed"]')).toHaveCount(1)
    await form.locator('[data-status="failed"]').evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
    })
    const retry = await form.getByRole('button', { name: '重新上传 legacy.png', exact: true }).boundingBox()
    const remove = await form.getByRole('button', { name: '移除 legacy.png', exact: true }).boundingBox()
    expect(retry!.width).toBeGreaterThanOrEqual(44)
    expect(remove!.width).toBeGreaterThanOrEqual(44)
    const overlaps = retry!.x < remove!.x + remove!.width && retry!.x + retry!.width > remove!.x
      && retry!.y < remove!.y + remove!.height && retry!.y + retry!.height > remove!.y
    expect(overlaps).toBe(false)
  })
})

test.describe('touch upload recovery', () => {
  test.use({ hasTouch: true })
  for (const width of [320, 390]) {
    test(`failed upload has usable controls and retries at ${width}px`, async ({ page, scenario, forum }) => {
      await page.setViewportSize({ width, height: 900 })
      let attempts = 0
      scenario.handle = (request) => {
        if (request.path !== '/api/images/upload')
          return
        attempts++
        return attempts === 1
          ? { status: 503, data: { message: 'Synthetic image failure' } }
          : { data: { statusCode: 200, data: { pathname: 'retry.png', size: png.length } } }
      }
      const form = await openForm(page)
      await form.locator('input[type="file"]').setInputFiles({ name: 'retry.png', mimeType: 'image/png', buffer: png })
      await expect(form.locator('[data-status="failed"]')).toHaveCount(1)
      const contrast = await form.locator('[data-status="failed"] .text-ui-10').evaluate((element) => {
        // The brightest possible image is the worst case for white overlay text.
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const context = canvas.getContext('2d')!
        context.fillStyle = 'white'
        context.fillRect(0, 0, 1, 1)
        context.fillStyle = getComputedStyle(element.parentElement!).backgroundColor
        context.fillRect(0, 0, 1, 1)
        const background = context.getImageData(0, 0, 1, 1).data
        context.clearRect(0, 0, 1, 1)
        context.fillStyle = getComputedStyle(element).color
        context.fillRect(0, 0, 1, 1)
        const foreground = context.getImageData(0, 0, 1, 1).data
        const luminance = (color: Uint8ClampedArray) => {
          const linear = [...color].slice(0, 3).map((channel) => {
            const value = channel / 255
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
          })
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
        }
        return (luminance(foreground) + 0.05) / (luminance(background) + 0.05)
      })
      expect(contrast).toBeGreaterThanOrEqual(4.5)
      for (const button of await form.locator('[data-status="failed"] button').all()) {
        const bounds = await button.boundingBox()
        expect(bounds?.width).toBeGreaterThanOrEqual(44)
        expect(bounds?.height).toBeGreaterThanOrEqual(44)
      }
      await expect(form.getByRole('button', { name: '提交反馈', exact: true })).toBeVisible()
      const retry = form.getByRole('button', { name: '重新上传 retry.png', exact: true })
      await retry.focus()
      await page.keyboard.press('Enter')
      await expect(form.locator('[data-status="uploaded"]')).toHaveCount(1)
      expect(forum.requests.filter(request => request.path === '/api/images/upload')).toHaveLength(2)
    })
  }
})

const compressionModule = `/@fs/${fileURLToPath(new URL('../../src/forum/services/form/compressImageForUpload.ts', import.meta.url)).replaceAll('\\', '/')}`
for (const [name, type, fixture] of [
  ['WebP', 'image/webp', animatedWebp],
  ['APNG', 'image/png', animatedPng],
] as const) {
  test(`compression preserves every frame of animated ${name}`, async ({ page }) => {
    await page.goto('/feedback')
    const result = await page.evaluate(async ({ content, modulePath, type }) => {
      const { compressImageForUpload } = await import(modulePath)
      const original = new File([new Uint8Array(content)], 'animated', { type })
      const bitmap = await createImageBitmap(original)
      bitmap.close()
      const compressed = await compressImageForUpload(original)
      return { unchanged: compressed === original, bytes: compressed.size }
    }, { content: [...fixture()], modulePath: compressionModule, type })
    expect(result.bytes).toBeGreaterThan(512 * 1024)
    expect(result.unchanged).toBe(true)
  })
}

test('static JPEG compression still reduces bytes and retains image dimensions', async ({ page }) => {
  await page.goto('/feedback')
  const result = await page.evaluate(async (modulePath) => {
    const { compressImageForUpload } = await import(modulePath)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1024
    const context = canvas.getContext('2d')!
    const pixels = context.createImageData(1024, 1024)
    let random = 12345
    for (let i = 0; i < pixels.data.length; i++) {
      random = Math.imul(random, 1664525) + 1013904223
      pixels.data[i] = i % 4 === 3 ? 255 : random >>> 24
    }
    context.putImageData(pixels, 0, 0)
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 1))
    const original = new File([blob], 'static.jpg', { type: 'image/jpeg' })
    const compressed = await compressImageForUpload(original)
    const bitmap = await createImageBitmap(compressed)
    const result = { originalBytes: original.size, bytes: compressed.size, width: bitmap.width, height: bitmap.height, type: compressed.type }
    bitmap.close()
    return result
  }, compressionModule)
  expect(result.originalBytes).toBeGreaterThan(512 * 1024)
  expect(result.bytes).toBeLessThan(result.originalBytes)
  expect([result.width, result.height, result.type]).toEqual([1024, 1024, 'image/jpeg'])
})
