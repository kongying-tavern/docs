import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const imageMetadata = '{thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"480"}'
test.use({ scenario: { topics: [issue({ body: `![测试图片](https://example.com/preview.png)${imageMetadata}\n![另一张图片](https://example.com/preview.png?second)${imageMetadata}` })] } })

test.describe('mobile image gestures', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('tap stays fitted, pinch zooms, and one remaining finger pans', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('https://example.com/preview.png*', route => route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#7799bb"/></svg>',
    }))
    await page.goto('feedback/topic/123')
    await page.locator('.forum-image-previewer button').filter({ has: page.locator('img') }).first().tap()
    const preview = page.locator('.forum-preview-root')
    await expect(preview).not.toHaveClass(/entering/)
    await expect(preview.locator('.forum-preview-stage')).toHaveCSS('padding-top', '72px')
    await expect(preview.locator('.forum-preview-stage')).toHaveCSS('padding-bottom', '72px')
    await expect(preview.locator('.forum-preview-cards')).toHaveCSS('top', '12px')
    await expect(preview.locator('.forum-preview-close')).toHaveCSS('width', '44px')
    await expect(preview.locator('.forum-preview-close')).toHaveCSS('height', '44px')
    const stack = preview.locator('.forum-preview-stack')
    const transform = () => stack.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform)
      return { scale: matrix.a, x: matrix.e, y: matrix.f }
    })
    await preview.locator('.forum-preview-image').last().tap()
    expect((await transform()).scale).toBe(1)
    const session = await page.context().newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', points: { x: number, y: number, id: number }[]) =>
      session.send('Input.dispatchTouchEvent', { type, touchPoints: points })
    await touch('touchStart', [{ x: 160, y: 400, id: 1 }, { x: 230, y: 400, id: 2 }])
    await touch('touchMove', [{ x: 125, y: 400, id: 1 }, { x: 265, y: 400, id: 2 }])
    await expect.poll(async () => (await transform()).scale).toBeCloseTo(2)
    await touch('touchEnd', [{ x: 265, y: 400, id: 2 }])
    const before = await transform()
    await touch('touchMove', [{ x: 155, y: 420, id: 1 }])
    await expect.poll(async () => (await transform()).x).toBeCloseTo(before.x + 30)
    await touch('touchEnd', [])
    expect((await transform()).scale).toBeCloseTo(2)
    await expect(preview).toBeVisible()
    await touch('touchStart', [{ x: 125, y: 400, id: 1 }, { x: 265, y: 400, id: 2 }])
    await touch('touchMove', [{ x: 160, y: 400, id: 1 }, { x: 230, y: 400, id: 2 }])
    await touch('touchEnd', [])
    await expect.poll(async () => (await transform()).scale).toBe(1)
    await touch('touchStart', [{ x: 195, y: 400, id: 1 }])
    await touch('touchMove', [{ x: 195, y: 540, id: 1 }])
    await touch('touchCancel', [])
    await expect(preview).toBeVisible()
    await touch('touchStart', [{ x: 195, y: 400, id: 1 }])
    await touch('touchMove', [{ x: 195, y: 540, id: 1 }])
    await touch('touchEnd', [])
    await expect(preview).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test.describe('long image reading', () => {
  test.use({ scenario: { topics: [issue({ body: '![长图](https://example.com/portrait.svg){width:"400",height:"4000"}' })] } })

  for (const mobile of [false, true]) {
    test.describe(mobile ? 'mobile reader' : 'desktop reader', () => {
      test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile })
      test(`long image supports reading and gesture zoom without a toolbar on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
        const errors: string[] = []
        page.on('pageerror', error => errors.push(error.message))
        await page.route('https://example.com/portrait.svg', route => route.fulfill({
          contentType: 'image/svg+xml',
          body: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4000">${Array.from({ length: 20 }, (_, i) => `<rect y="${i * 200}" width="400" height="200" fill="${i % 2 ? '#dbeafe' : '#f1f5f9'}"/><text x="24" y="${i * 200 + 90}" font-size="28" fill="#334155">Section ${i + 1}</text>`).join('')}</svg>`,
        }))
        await page.addInitScript(() => localStorage.setItem('forum-image-preview-panel-collapsed', 'true'))
        await page.goto('feedback/topic/123')
        await page.locator('.forum-image-previewer button').first().click()
        const preview = page.locator('.forum-preview-root')
        await expect(preview).not.toHaveClass(/entering/)
        const reader = preview.locator('.forum-long-reader-viewport')
        const image = reader.locator('img')
        await expect(reader).toBeVisible()
        const map = preview.getByRole('slider', { name: '长图位置导航' })
        await expect(map).toHaveCount(mobile ? 0 : 1)
        if (mobile) {
          await expect(reader).toHaveClass(/scroll-fade-b/)
          await expect(reader).not.toHaveClass(/scroll-fade-t/)
          await expect.poll(() => reader.evaluate(el => getComputedStyle(el).maskImage)).not.toBe('none')
        }
        else {
          await expect(reader).not.toHaveClass(/scroll-fade-b/)
        }
        const bounds = await image.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds!.width).toBeGreaterThan(mobile ? 300 : 350)
        expect(bounds!.height).toBeGreaterThan(page.viewportSize()!.height)
        if (mobile) {
          await image.tap({ position: { x: bounds!.width / 2, y: 100 } })
          expect((await image.boundingBox())!.width).toBeCloseTo(bounds!.width, 0)
          const session = await page.context().newCDPSession(page)
          await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 500, id: 1 }] })
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: 250, id: 1 }] })
          await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
          await expect(preview).toBeVisible()
          // Keep native swipe momentum out of the subsequent pinch-anchor measurement.
          let previousScroll = -1
          let stableScrolls = 0
          await expect.poll(async () => {
            const scroll = await reader.evaluate(element => element.scrollTop)
            stableScrolls = scroll === previousScroll ? stableScrolls + 1 : 0
            previousScroll = scroll
            return stableScrolls
          }).toBeGreaterThanOrEqual(3)
          const beforePinch = (await image.boundingBox())!.width
          const pinchCenter = { x: 110, y: 250 }
          const focalPoint = () => image.evaluate((el, point) => {
            const box = el.getBoundingClientRect()
            return { x: (point.x - box.left) / box.width, y: (point.y - box.top) / box.height }
          }, pinchCenter)
          await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 70, y: 250, id: 1 }, { x: 150, y: 250, id: 2 }] })
          // Starting the pinch stops the preceding swipe's native momentum.
          const beforeFocal = await focalPoint()
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 30, y: 250, id: 1 }, { x: 190, y: 250, id: 2 }] })
          await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          await expect.poll(async () => (await image.boundingBox())!.width).toBeGreaterThan(beforePinch)
          const afterFocal = await focalPoint()
          expect(Math.abs(afterFocal.x - beforeFocal.x)).toBeLessThan(0.005)
          expect(Math.abs(afterFocal.y - beforeFocal.y)).toBeLessThan(0.005)
        }
        await reader.evaluate(element => element.scrollTo({ top: 800 }))
        await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
        await expect(preview).toBeVisible()
        if (!mobile) {
          const beforeZoom = (await map.locator('.forum-long-reader-window').boundingBox())!.height
          await reader.hover()
          await page.keyboard.down('Control')
          await page.mouse.wheel(0, -200)
          await page.keyboard.up('Control')
          await expect.poll(async () => (await image.boundingBox())!.width).toBeGreaterThan(bounds!.width)
          await expect.poll(async () => (await map.locator('.forum-long-reader-window').boundingBox())!.height).toBeLessThan(beforeZoom)
        }
        await expect(preview.locator('.forum-long-reader button, .forum-long-reader progress')).toHaveCount(0)
        if (mobile) {
          await expect(reader).toHaveClass(/\bscroll-fade\b/)
          await expect.poll(() => reader.evaluate(el => Number.parseFloat(getComputedStyle(el).getPropertyValue('--scroll-fade-t')))).toBeGreaterThan(0)
          await reader.evaluate(el => el.scrollTo({ top: el.scrollHeight }))
          await expect(reader).not.toHaveClass(/scroll-fade-b/)
          await expect(reader).toHaveClass(/scroll-fade-t/)
          await reader.evaluate(el => el.scrollTo({ top: 800 }))
          await expect(reader).toHaveClass(/\bscroll-fade\b/)
          await reader.evaluate(el => el.scrollTo({ top: 0 }))
          await expect(reader).toHaveClass(/scroll-fade-b/)
          await expect(reader).not.toHaveClass(/scroll-fade-t/)
          await reader.evaluate(el => el.scrollTo({ top: 800 }))
          await expect(reader).toHaveClass(/\bscroll-fade\b/)
        }
        await page.screenshot({ path: `test-results/forum/long-image-${mobile ? 'mobile' : 'desktop'}.png` })
        await preview.locator('.forum-preview-close').click()
        await expect(preview).toHaveCount(0)
        expect(errors).toEqual([])
      })
    })
  }
})

test.describe('long image mobile safe areas', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, scenario: { topics: [issue({ body: '![long](https://example.com/notch.svg){width:"400",height:"4000"}\n![other](https://example.com/notch.svg?other){width:"400",height:"4000"}' })] } })

  test('notched screens keep image content clear of close, cards and image navigation', async ({ page }) => {
    const session = await page.context().newCDPSession(page)
    await session.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 44, bottom: 34, left: 0, right: 0 } })
    await page.route('https://example.com/notch.svg*', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4000"/>' }))
    await page.goto('feedback/topic/123')
    await page.locator('.forum-image-previewer button').filter({ has: page.locator('img') }).first().tap()
    const preview = page.locator('.forum-preview-root')
    const stage = preview.locator('.forum-preview-stage')
    await expect(stage).toHaveCSS('padding-top', '116px')
    await expect(stage).toHaveCSS('padding-bottom', '106px')
    const reader = (await preview.locator('.forum-long-reader-viewport').boundingBox())!
    for (const selector of ['.forum-preview-close', '.forum-preview-cards']) {
      const control = (await preview.locator(selector).boundingBox())!
      expect(reader.y).toBeGreaterThanOrEqual(control.y + control.height)
    }
    const dots = (await preview.locator('.forum-preview-dots').boundingBox())!
    expect(reader.y + reader.height).toBeLessThanOrEqual(dots.y)
    await preview.locator('.forum-preview-close').tap()
    await expect(preview).toHaveCount(0)
  })
})

test('side panel stays collapsed across images and browser reloads', async ({ page }) => {
  await page.route('https://example.com/preview.png*', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="red"/></svg>',
  }))
  await page.goto('feedback/topic/123')
  await page.locator('.forum-image-previewer button').first().click()
  const preview = page.locator('.forum-preview-root')
  const toggle = preview.locator('.forum-preview-panel-toggle')
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(preview.locator('.preview-side-panel')).toHaveCount(0)
  await expect(preview).toHaveCSS('overflow-x', 'hidden')
  await expect(page.locator('html')).toHaveCSS('scrollbar-gutter', 'auto')
  const coverage = await preview.evaluate(element => ({
    right: element.getBoundingClientRect().right,
    viewport: window.innerWidth,
    gutter: getComputedStyle(document.documentElement).scrollbarGutter,
  }))
  expect(coverage.right, `Preview must cover the reserved ${coverage.gutter} scrollbar gutter`).toBe(coverage.viewport)
  await page.screenshot({ path: 'test-results/forum/image-preview-panel-collapsed.png' })
  await preview.locator('.forum-preview-close').click()
  await expect(preview).toHaveCount(0)
  await expect(page.locator('html')).toHaveCSS('scrollbar-gutter', 'stable')
  await page.locator('.forum-image-previewer button').nth(1).click()
  await expect(preview).toBeVisible()
  await expect(preview.locator('.preview-side-panel')).toHaveCount(0)
  await preview.locator('.forum-preview-close').click()
  await expect(preview).toHaveCount(0)
  await page.reload()
  await page.locator('.forum-image-previewer button').first().click()
  await expect(preview).toBeVisible()
  await expect(preview.locator('.preview-side-panel')).toHaveCount(0)
  await toggle.click()
  await expect(preview.locator('.preview-side-panel')).toBeVisible()
  await expect(preview).not.toHaveClass(/panel-entering/)
  await expect(toggle).toBeVisible()
})

test('image preview releases its dialog and can reopen after closing', { tag: '@source' }, async ({ page }) => {
  await page.route('https://example.com/preview.png*', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="red"/></svg>',
  }))
  await page.goto('feedback/topic/123')
  const thumbnails = page.locator('.forum-image-previewer button')
  const thumbnail = thumbnails.first()
  await expect(thumbnail).toBeEnabled({ timeout: 30_000 })
  for (let cycle = 0; cycle < 6; cycle++) {
    await thumbnails.nth(cycle % 2).click()
    const preview = page.locator('.forum-preview-root')
    await expect(preview).toBeVisible()
    if (cycle === 0) {
      await page.keyboard.press('Escape')
    }
    else {
      await expect(preview.locator('.forum-preview-close')).toBeVisible()
      await preview.locator('.forum-preview-close').click()
    }
    await expect(preview).toHaveCount(0)
    if (cycle === 0) {
      // Simulate the parent replacing its attachment list after a data refresh.
      // The source URLs and keyed image children remain the same.
      await thumbnail.evaluate((element) => {
        interface ImageComponent {
          type: { __file?: string }
          parent: ImageComponent | null
          props: { images: { src: string }[] }
        }
        let component = (element as HTMLElement & { __vueParentComponent: ImageComponent }).__vueParentComponent
        while (component && !component.type.__file?.endsWith('/ForumImage.vue'))
          component = component.parent!
        if (!component)
          throw new Error('ForumImage component not found')
        component.props.images = component.props.images.map(image => ({ ...image }))
      })
      await expect(thumbnails.nth(0)).toBeEnabled()
      await expect(thumbnails.nth(1)).toBeEnabled()
    }
  }
})

test('image preview can reopen inside the topic sheet', async ({ page }) => {
  await page.route('https://example.com/preview.png*', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="red"/></svg>',
  }))
  await page.goto('feedback')
  await page.locator('.forum-topic-item').first().getByRole('button', { name: /评论/ }).first().click()
  const thumbnails = page.locator('.topic-preview-dialog .forum-image-previewer button')
  const thumbnail = thumbnails.first()
  await expect(thumbnail).toBeEnabled({ timeout: 30_000 })
  for (let cycle = 0; cycle < 6; cycle++) {
    await thumbnails.nth(cycle % 2).click()
    const preview = page.locator('.forum-preview-root')
    await expect(preview).toBeVisible()
    await expect(preview.locator('.forum-preview-close')).toBeVisible()
    await preview.locator('.forum-preview-close').click()
    await expect(preview).toHaveCount(0)
  }
})
