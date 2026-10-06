import { expect, test } from './support/test'

for (const width of [1440, 390]) {
  test(`Markdown demos render typed props and independent spoiler attributes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' || message.text().startsWith('[Vue warn]'))
        errors.push(message.text())
    })
    await page.goto('/md-enhance-guide')
    await expect(page).toHaveTitle('Markdown 增强语法指南 | 空荧酒馆')
    const demo = page.locator('.vp-md-demo').first()
    await demo.locator('summary').click()
    await expect(demo).toHaveAttribute('open', '')
    await page.locator('.vp-md-demo').evaluateAll(demos => demos.forEach(demo => (demo as HTMLDetailsElement).open = true))

    const spoiler = (text: string) => page.locator('.inline-spoiler').filter({ hasText: text }).first()
    await expect(spoiler('自定义宽度')).toHaveCSS('width', '200px')
    await expect(spoiler('更长的内容')).toHaveCSS('width', '300px')
    await expect(spoiler('宽度和对齐')).toHaveCSS('width', '250px')
    await expect(spoiler('宽度和对齐')).toHaveCSS('text-align', 'center')
    await expect(spoiler('右对齐')).toHaveCSS('text-align', 'right')
    await expect(page.locator('.mt-4').filter({ hasText: '刮开这里查看隐藏内容' }).last()).toHaveCSS('width', '300px')

    await expect(page.locator('[data-slot="accordion-content"]').filter({ hasText: '这里是默认 slot 的内容。' })).toBeVisible()
    const namedSlot = page.getByRole('button', { name: '命名 Slot：Markdown 内容', exact: true })
    await expect(namedSlot).toHaveAttribute('aria-expanded', 'true')
    await namedSlot.click()
    await expect(namedSlot).toHaveAttribute('aria-expanded', 'false')
    await namedSlot.click()
    await expect(namedSlot).toHaveAttribute('aria-expanded', 'true')

    const canvas = spoiler('自定义宽度').locator('canvas')
    await canvas.scrollIntoViewIfNeeded()
    const box = (await canvas.boundingBox())!
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.mouse.down()
    for (let y = 5; y < box.height; y += 15) {
      for (let x = 5; x < box.width; x += 15)
        await page.mouse.move(box.x + x, box.y + y)
    }
    await page.mouse.up()
    await expect(canvas).toBeHidden()
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
