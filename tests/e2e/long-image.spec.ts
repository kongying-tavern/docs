import type { Route } from '@playwright/test'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { topics: [issue({ body: '![长截图](https://assets.webp.inter-knot.site/images/long.jpeg)\n![普通图片](https://example.com/normal.svg)' })] } })

test('desktop list long thumbnails fill their cells without letterboxing', async ({ page, scenario }) => {
  scenario.topics!.splice(0, 1, issue({ body: '![长截图](https://example.com/tall.svg){width:"1920",height:"5400"}\n![另一张长图](https://example.com/longer.svg)\n![竖图](https://example.com/portrait.svg)' }))
  await page.route('https://example.com/tall.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="5400"><rect width="1920" height="5400" fill="#dbeafe"/></svg>' }))
  await page.route('https://example.com/longer.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4000"><rect width="400" height="4000" fill="#f1f5f9"/></svg>' }))
  await page.route('https://example.com/portrait.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2400"><rect width="1000" height="2400" fill="#cbd5e1"/></svg>' }))
  await page.goto('feedback')
  const images = page.locator('.topic-media .forum-image-source')
  await expect(images).toHaveCount(3)
  for (const image of await images.all()) {
    await expect(image).toHaveCSS('visibility', 'visible')
    const geometry = await image.evaluate((el) => {
      const image = el as HTMLImageElement
      const box = image.getBoundingClientRect()
      const parent = image.parentElement!.getBoundingClientRect()
      const button = image.closest('button')!.getBoundingClientRect()
      return { width: box.width, height: box.height, parentWidth: parent.width, parentHeight: parent.height, buttonHeight: button.height, fit: getComputedStyle(image).objectFit, aspect: getComputedStyle(image.parentElement!).aspectRatio }
    })
    expect(geometry.fit).toBe('cover')
    expect(Math.abs(geometry.height - geometry.parentHeight)).toBeLessThan(1)
    expect(Math.abs(geometry.width - geometry.parentWidth)).toBeLessThan(1)
    expect(Math.abs(geometry.parentHeight - (geometry.buttonHeight - 2))).toBeLessThan(1)
  }
})

test('natural dimensions select the long reader and switching images resets reading state', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://webp.assets.interknot.site/images/long.jpeg', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="5400"><rect width="1920" height="5400" fill="#dbeafe"/></svg>',
  }))
  await page.route('https://example.com/normal.svg', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#f1f5f9"/></svg>',
  }))
  await page.goto('feedback/topic/123')
  const thumbnail = page.locator('.forum-image-previewer button').filter({ has: page.locator('img[src="https://webp.assets.interknot.site/images/long.jpeg"]') }).first()
  await expect(thumbnail.locator('.forum-long-image-label')).toBeVisible()
  await expect(thumbnail.locator('.forum-image-source')).toHaveCSS('object-position', '50% 0%')
  await thumbnail.click()
  const preview = page.locator('.forum-preview-root')
  const reader = preview.locator('.forum-long-reader-viewport')
  await expect(reader).toBeVisible()
  await expect(preview.locator('.preview-side-panel')).toBeVisible()
  const map = preview.getByRole('slider', { name: '长图位置导航' })
  await expect(map).toBeVisible()
  await expect(reader).toHaveCSS('scrollbar-width', 'thin')
  await page.mouse.move(0, 0)
  await expect(reader).toHaveCSS('scrollbar-color', 'rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)')
  const widthBeforeHover = await reader.evaluate(el => el.clientWidth)
  const bounds = await reader.boundingBox()
  const panel = await preview.locator('.preview-side-panel').boundingBox()
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(panel!.x)
  await reader.hover()
  await expect(reader).not.toHaveCSS('scrollbar-color', 'rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)')
  expect(await reader.evaluate(el => el.clientWidth)).toBe(widthBeforeHover)
  await page.mouse.wheel(0, 500)
  await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await expect.poll(async () => Number(await map.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
  await map.focus()
  await page.keyboard.press('Home')
  await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBe(0)
  const frame = map.locator('.forum-long-reader-window')
  const frameBox = await frame.boundingBox()
  const mapBox = await map.boundingBox()
  await page.mouse.move(frameBox!.x + frameBox!.width / 2, frameBox!.y + frameBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(mapBox!.x + mapBox!.width / 2, mapBox!.y + mapBox!.height - frameBox!.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => Number(await map.getAttribute('aria-valuenow'))).toBeGreaterThan(90)
  await map.click({ position: { x: mapBox!.width / 2, y: 4 } })
  await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBe(0)
  await map.focus()
  await page.keyboard.press('End')
  await expect(map).toHaveAttribute('aria-valuenow', '100')
  await page.keyboard.press('Home')
  await expect(map).toHaveAttribute('aria-valuenow', '0')
  await reader.evaluate(el => el.scrollTo({ top: 500 }))
  const image = reader.locator('img')
  const readerBox = (await reader.boundingBox())!
  const clickPoint = { x: readerBox.x + readerBox.width * 0.3, y: readerBox.y + readerBox.height * 0.4 }
  const sourcePoint = () => image.evaluate((el, point) => {
    const box = el.getBoundingClientRect()
    return { x: (point.x - box.left) / box.width, y: (point.y - box.top) / box.height, width: box.width }
  }, clickPoint)
  const beforeClick = await sourcePoint()
  const beforeScroll = await reader.evaluate(el => el.scrollTop)
  await page.mouse.click(clickPoint.x, clickPoint.y)
  await expect.poll(async () => (await sourcePoint()).width).toBeGreaterThan(beforeClick.width * 1.9)
  const afterClick = await sourcePoint()
  expect(Math.abs(afterClick.x - beforeClick.x)).toBeLessThan(0.002)
  expect(Math.abs(afterClick.y - beforeClick.y)).toBeLessThan(0.002)
  await page.mouse.click(clickPoint.x, clickPoint.y)
  await expect.poll(async () => (await sourcePoint()).width).toBeCloseTo(beforeClick.width, 0)
  await expect.poll(() => reader.evaluate(el => el.scrollTop)).toBeCloseTo(beforeScroll, 0)
  await page.mouse.move(clickPoint.x, clickPoint.y)
  await page.mouse.down()
  await page.mouse.move(clickPoint.x + 30, clickPoint.y + 30, { steps: 4 })
  await page.mouse.up()
  expect((await sourcePoint()).width).toBeCloseTo(beforeClick.width, 0)
  await page.mouse.move(clickPoint.x, clickPoint.y)
  await page.mouse.down()
  await reader.evaluate(el => el.scrollTop += 100)
  await page.mouse.up()
  expect((await sourcePoint()).width).toBeCloseTo(beforeClick.width, 0)
  await reader.focus()
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await sourcePoint()).width).toBeGreaterThan(beforeClick.width * 1.9)
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await sourcePoint()).width).toBeCloseTo(beforeClick.width, 0)
  await preview.getByRole('button', { name: '下一张图片', exact: true }).click()
  await expect(reader).toHaveCount(0)
  await expect(preview.locator('.forum-preview-stack')).toBeVisible()
  await preview.getByRole('button', { name: '上一张图片', exact: true }).click()
  await expect(reader).toBeVisible()
  await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBe(0)
  await expect(preview.locator('.forum-long-reader button, .forum-long-reader progress')).toHaveCount(0)
  await preview.locator('.forum-preview-panel-toggle').click()
  await expect(preview.locator('.preview-side-panel')).toHaveCount(0)
  await expect(preview.locator('.forum-preview-stage')).toHaveCSS('padding-top', '72px')
  await expect(preview.locator('.forum-preview-stage')).toHaveCSS('padding-bottom', '72px')
  await page.setViewportSize({ width: 1100, height: 800 })
  const cardsBox = (await preview.locator('.forum-preview-cards').boundingBox())!
  const dotsBox = (await preview.locator('.forum-preview-dots').boundingBox())!
  const resizedReader = (await reader.boundingBox())!
  expect(resizedReader.y).toBeGreaterThanOrEqual(cardsBox.y + cardsBox.height)
  expect(resizedReader.y + resizedReader.height).toBeLessThanOrEqual(dotsBox.y)
  await preview.locator('.forum-preview-close').click()
  await expect(preview).toHaveCount(0)
  expect(errors).toEqual([])
})

test('late thumbnail dimensions preserve an undisplayed long image reading position and zoom', async ({ page, scenario }) => {
  scenario.topics!.splice(0, 1, issue({ body: ['first', 'slow', 'third', 'long'].map(name => `![${name}](https://example.com/${name}.svg)`).join('\n') }))
  const pending: Route[] = []
  await page.route('https://example.com/*.svg', async (route) => {
    if (route.request().url().endsWith('/slow.svg')) {
      pending.push(route)
      return
    }
    const height = route.request().url().endsWith('/long.svg') ? 4000 : 300
    await route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${height}"/>` })
  })
  await page.goto('feedback', { waitUntil: 'domcontentloaded' })
  const first = page.locator('.topic-media .forum-image-source[src="https://example.com/first.svg"]').first()
  await expect(first).toHaveCSS('visibility', 'visible')
  await first.locator('..').locator('..').click()
  const preview = page.locator('.forum-preview-root')
  await expect(preview).not.toHaveClass(/entering/)
  await preview.getByRole('button', { name: '上一张图片', exact: true }).click()
  const reader = preview.locator('.forum-long-reader-viewport')
  await expect(reader).toBeVisible()
  const img = reader.locator('img')
  await reader.evaluate(el => el.scrollTo({ top: 600 }))
  await reader.focus()
  await page.keyboard.press('Enter')
  const initialWidth = (await img.boundingBox())!.width
  const initialScroll = await reader.evaluate(el => el.scrollTop)
  await expect.poll(() => pending.length).toBeGreaterThan(0)
  for (const route of pending.splice(0))
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"/>' })
  await expect(page.locator('.topic-media .forum-image-source[src="https://example.com/slow.svg"]').first()).toHaveCSS('visibility', 'visible')
  await expect(reader).toBeVisible()
  expect((await img.boundingBox())!.width).toBeCloseTo(initialWidth, 0)
  expect(await reader.evaluate(el => el.scrollTop)).toBeCloseTo(initialScroll, 0)
  await preview.locator('.forum-preview-close').click()
})
