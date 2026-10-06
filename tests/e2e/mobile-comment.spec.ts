import { Buffer } from 'node:buffer'
import { comment, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 375, height: 812 }, scenario: { following: false } })

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64')

for (const width of [375, 1280]) {
  test(`unsent comment guards site navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('/feedback/topic/123')
    if (width === 375)
      await page.locator('.mobile-comment-entry-text').click()
    const editor = page.locator('[contenteditable="true"]').first()
    await editor.fill('导航时保留的评论')
    if (width === 375) {
      await page.mouse.click(2, 2)
      await expect(page.getByRole('dialog', { name: '评论', exact: true })).toHaveCount(0)
    }
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.id = 'draft-navigation-test'
      link.href = '/feedback'
      link.textContent = '返回反馈列表'
      document.body.append(link)
    })
    page.once('dialog', dialog => dialog.dismiss())
    await page.locator('#draft-navigation-test').dispatchEvent('click')
    await expect(page).toHaveURL(/\/feedback\/topic\/123$/)
    if (width === 375)
      await page.locator('.mobile-comment-entry-text').click()
    await expect(editor).toContainText('导航时保留的评论')
    if (width === 375)
      await page.mouse.click(2, 2)
    page.once('dialog', dialog => dialog.accept())
    await page.locator('#draft-navigation-test').dispatchEvent('click')
    await expect(page).toHaveURL(/\/feedback$/)
  })
}

test('mobile editor retains text, mention, emoji and attachment across close and failed submit; retry clears once', async ({ page, scenario, forum }) => {
  let posts = 0
  let created: GITEE.Comment | undefined
  scenario.handle = (request) => {
    if (request.method === 'POST' && request.path === '/api/images/upload')
      return { data: { statusCode: 200, statusMessage: '', data: { pathname: 'e2e-upload.png', size: png.length } } }
    if (request.method === 'POST' && request.path.endsWith('/issues/123/comments')) {
      posts++
      if (posts === 1)
        return { status: 400, data: { message: 'Synthetic submit failure' } }
      const body = new URLSearchParams(String(request.body)).get('body')
        ?? (JSON.parse(String(request.body)) as { body: string }).body
      created = comment({ id: 99002, body })
      return { data: created }
    }
    if (request.method === 'GET' && request.path.endsWith('/issues/123/comments'))
      return { data: created ? [comment(), created] : [comment()], headers: { Total_count: created ? '2' : '1', Total_page: '1' } }
    if (request.method === 'POST' && request.path === '/api/v5/gists') {
      const body = JSON.parse(String(request.body)) as Record<string, unknown>
      return { data: { ...body, id: 'synthetic-forum-state' } }
    }
  }
  await page.route('https://webp.assets.interknot.site/e2e-upload.png', route => route.fulfill({ contentType: 'image/png', body: png }))
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('/feedback/topic/123')
  await page.locator('.mobile-comment-entry').click()
  const drawer = page.getByRole('dialog', { name: '评论', exact: true })
  const editor = drawer.locator('[contenteditable="true"]')
  await editor.fill('移动草稿保留')
  await drawer.getByRole('button', { name: '提及成员' }).click()
  await drawer.getByRole('button', { name: 'Alice @alice', exact: true }).click()
  await expect(editor).toContainText('@alice')
  await drawer.locator('.editor-tools-row button[aria-label]').first().click()
  await drawer.locator('.emoji-list button').first().click()
  await expect(editor.locator('[data-emoji]')).toHaveCount(1)
  await drawer.locator('input[type="file"]').setInputFiles({ name: 'tiny.png', mimeType: 'image/png', buffer: png })
  await expect.poll(() => forum.requests.filter(request => request.path === '/api/images/upload').length).toBe(1)
  await expect(drawer.getByRole('button', { name: '发布', exact: true })).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
  await page.getByRole('button', { name: '继续编辑评论…' }).click()
  await expect(drawer).toBeVisible()
  await expect(editor).toBeVisible()
  await expect(editor).toContainText('移动草稿保留')
  await expect(editor).toContainText('@alice')
  await expect(drawer).toContainText('1/4')
  await expect(drawer.getByRole('button', { name: '发布', exact: true })).toBeVisible()
  await drawer.getByRole('button', { name: '发布', exact: true }).click()
  await expect(drawer.getByRole('alert')).toBeVisible()
  await expect(editor).toContainText('移动草稿保留')
  await expect(drawer).toContainText('1/4')
  await drawer.getByRole('button', { name: '发布', exact: true }).click()
  await expect(drawer).toHaveCount(0)
  await expect(page.locator('#reply-99002')).toContainText('移动草稿保留')
  expect(posts).toBe(2)
  expect(forum.requests.filter(request => request.path === '/api/images/upload')).toHaveLength(1)
  await page.locator('.mobile-comment-entry').click()
  await expect(editor).toHaveText('')
  await expect(drawer.locator('.editor-tools-row')).not.toContainText('1/4')
})

for (const tool of ['emoji', 'mention', 'upload'] as const) {
  test(`mobile detail entry opens ${tool} directly`, async ({ page }, testInfo) => {
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('/feedback/topic/123')
    const entry = page.locator('.mobile-comment-entry')
    const panel = page.getByRole('dialog', { name: '评论', exact: true })
    const editor = panel.locator('[contenteditable="true"]')
    if (tool === 'emoji') {
      await expect(entry.getByRole('button', { name: '表情', exact: true })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('entry-shortcuts.png') })
      await entry.getByRole('button', { name: '表情', exact: true }).click()
      await expect(panel.locator('.emoji-list')).toBeVisible()
      await panel.locator('.emoji-list button').first().click()
      await expect(editor.locator('[data-emoji]')).toHaveCount(1)
      await expect(panel.locator('.emoji-list')).toBeVisible()
    }
    else if (tool === 'mention') {
      await entry.getByRole('button', { name: '提及成员', exact: true }).click()
      await expect(editor).toContainText('@')
      await expect(editor).toBeFocused()
      await expect(panel.locator('.mention-person').first()).toBeVisible()
    }
    else {
      const chooser = page.waitForEvent('filechooser')
      await entry.getByRole('button', { name: '添加图片', exact: true }).click()
      expect((await chooser).isMultiple()).toBe(true)
      await expect(panel).toBeVisible()
    }
  })
}

test('mobile mention recommendations mark selections and remain open for additional choices', async ({ page }, testInfo) => {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('/feedback/topic/123')
  await page.locator('.mobile-comment-entry').getByRole('button', { name: '提及成员', exact: true }).click()
  const panel = page.getByRole('dialog', { name: '评论', exact: true })
  const editor = panel.locator('[contenteditable="true"]')
  const row = panel.locator('.mention-recommendations')
  const alice = row.getByRole('button', { name: 'Alice @alice', exact: true })
  await alice.click()
  await expect(row).toBeVisible()
  await expect(alice).toHaveAttribute('aria-pressed', 'true')
  await expect(editor).toBeFocused()
  const second = row.locator('.mention-person[aria-pressed="false"]').first()
  const secondName = await second.getAttribute('aria-label')
  await second.click()
  await expect(row.getByRole('button', { name: secondName!, exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(editor.locator('.mention')).toHaveCount(2)
  await alice.click()
  await expect(editor.locator('.mention')).toHaveCount(2)
  const columns = await row.evaluate((el) => {
    const item = el.querySelector('.mention-person')!
    return (el.clientWidth - 16) / item.getBoundingClientRect().width
  })
  expect(columns).toBeCloseTo(4.5, 1)
  await page.screenshot({ path: testInfo.outputPath('mention-selections.png') })
  await editor.pressSequentially('正文')
  await expect(row).toHaveCount(0)
  await panel.getByRole('button', { name: '提及成员', exact: true }).click()
  await expect(row).toBeVisible()
  await expect(row.getByRole('button', { name: 'Alice @alice', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await panel.getByRole('button', { name: '展开编辑窗口', exact: true }).click()
  await expect(row).toHaveCount(0)
})

test('mobile editor shows skeleton while loading and aligns enlarged toolbar controls', async ({ page }, testInfo) => {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let release!: () => void
  const ready = new Promise<void>(resolve => release = resolve)
  await page.route('**/ForumRichTextarea.vue*', async (route) => {
    await ready
    await route.continue()
  })
  await page.goto('/feedback/topic/123')
  await page.locator('.mobile-comment-entry').getByRole('button', { name: '提及成员', exact: true }).click()
  const panel = page.getByRole('dialog', { name: '评论', exact: true })
  await expect(panel.locator('.comment-editor-skeleton')).toBeVisible()
  await expect(panel.locator('.comment-editor-skeleton-person')).toHaveCount(5)
  release()
  await expect(panel.locator('[contenteditable="true"]')).toBeFocused()
  await expect(panel.locator('.comment-editor-skeleton')).toHaveCount(0)
  const dimensions = await panel.locator('.editor-tools-row').evaluate((row) => {
    const icon = row.querySelector('.editor-tool-actions button')!
    const publish = row.querySelector('.editor-publish')!
    const a = icon.getBoundingClientRect()
    const b = publish.getBoundingClientRect()
    const glyph = icon.querySelector('.icon-btn')!.getBoundingClientRect()
    return { iconHeight: a.height, publishHeight: b.height, glyphWidth: glyph.width, centerDifference: Math.abs(a.y + a.height / 2 - b.y - b.height / 2) }
  })
  expect(dimensions.iconHeight).toBe(36)
  expect(dimensions.publishHeight).toBe(36)
  expect(dimensions.glyphWidth).toBe(24)
  expect(dimensions.centerDifference).toBeLessThan(1)
  await page.screenshot({ path: testInfo.outputPath('toolbar-mention.png') })
  await panel.locator('[contenteditable="true"]').fill('正文')
  await expect(panel.locator('.mention-recommendations')).toHaveCount(0)
  await page.locator('[data-slot=dialog-overlay]').click({ position: { x: 4, y: 4 } })
  await expect(panel).toHaveCount(0)
  await expect(page.locator('.mobile-comment-entry-text')).toBeFocused()
})

test('mobile comment morph respects reduced motion and restores entry focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('/feedback/topic/123')
  const entry = page.locator('.mobile-comment-entry-text')
  await entry.click()
  const panel = page.getByRole('dialog', { name: '评论', exact: true })
  await expect(panel.locator('[contenteditable="true"]')).toBeFocused()
  await expect(panel).toHaveClass(/motion-reduced/)
  expect(await panel.evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  await page.locator('[data-slot=dialog-overlay]').click({ position: { x: 4, y: 4 } })
  await expect(panel).toHaveCount(0)
  await expect(entry).toBeFocused()
})
