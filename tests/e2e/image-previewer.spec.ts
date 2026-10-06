import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const imageMetadata = '{thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"480"}'
test.use({ scenario: { topics: [issue({ body: `![测试图片](https://example.com/preview.png)${imageMetadata}\n![另一张图片](https://example.com/preview.png?second)${imageMetadata}` })] } })

test.describe('portrait image spacing and click zoom', () => {
  test.use({ scenario: { topics: [issue({ body: '![长图](https://example.com/portrait.svg){width:"400",height:"4000"}' })] } })

  test('collapsed preview fits tall images and animates click zoom', async ({ page }) => {
    await page.route('https://example.com/portrait.svg', route => route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4000"><rect width="400" height="4000" fill="red"/></svg>',
    }))
    await page.addInitScript(() => localStorage.setItem('forum-image-preview-panel-collapsed', 'true'))
    await page.goto('/feedback/topic/123')
    await page.locator('.forum-image-previewer button').first().click()
    const preview = page.locator('.forum-preview-root')
    await expect(preview).not.toHaveClass(/entering/)
    const image = preview.locator('.forum-preview-image').last()
    const bounds = await image.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.y).toBeGreaterThanOrEqual(32)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 32)
    await image.click()
    const stack = preview.locator('.forum-preview-stack')
    await expect(stack).toHaveCSS('transition-property', 'transform')
    await expect(stack).toHaveCSS('transition-duration', '0.36s')
    await expect(stack).toHaveClass(/flipping/)
    expect(await stack.evaluate(element => element.getAnimations().some(animation =>
      animation instanceof CSSTransition && animation.transitionProperty === 'transform'))).toBe(true)
    await expect(stack).not.toHaveClass(/flipping/)
    await expect.poll(() => stack.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).a)).toBe(2)
  })
})

test('side panel stays collapsed across images and browser reloads', async ({ page }) => {
  await page.route('https://example.com/preview.png*', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="red"/></svg>',
  }))
  await page.goto('/feedback/topic/123')
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

test('image preview releases its dialog and can reopen after closing', async ({ page }) => {
  await page.route('https://example.com/preview.png*', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="red"/></svg>',
  }))
  await page.goto('/feedback/topic/123')
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
  await page.goto('/feedback')
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
