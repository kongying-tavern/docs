import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { topics: [issue({ body: '预览正文。\n![测试图片](https://example.com/preview-sheet.svg){width:"640",height:"480"}' })] } })

test.beforeEach(async ({ page }) => {
  await page.route('https://example.com/preview-sheet.svg', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#7799bb"/></svg>',
  }))
})

test('mobile images do not prefetch comments for an unavailable side panel', async ({ page, forum }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('feedback')
  const images = page.locator('.forum-topic-item .forum-image-previewer').first()
  await expect(images).toBeVisible({ timeout: 30_000 })
  await images.dispatchEvent('pointerenter', { bubbles: false })
  await images.getByRole('button').filter({ has: page.locator('img') }).first().click()
  await expect(page.locator('.forum-preview-root')).toBeVisible()
  await expect(page.locator('.preview-side-panel')).toHaveCount(0)
  await page.waitForLoadState('networkidle')
  expect(forum.requests.filter(request => request.path.endsWith('/issues/123/comments'))).toHaveLength(0)
})

test('image intent prefetches comments and both preview surfaces share the result', async ({ page, scenario, forum }) => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  scenario.handle = async (request) => {
    if (request.path.endsWith('/issues/123/comments'))
      await pending
    return undefined
  }
  const commentRequests = () => forum.requests.filter(request => request.path.endsWith('/issues/123/comments'))
  try {
    await page.goto('feedback')
    const images = page.locator('.forum-topic-item .forum-image-previewer').first()
    await expect(images).toBeVisible({ timeout: 30_000 })
    // Exercise image intent independently from the surrounding topic row's handler.
    await images.dispatchEvent('pointerenter', { bubbles: false })
    await expect.poll(() => commentRequests().length).toBe(1)
    await expect(page.locator('.forum-preview-root')).toHaveCount(0)
    await images.getByRole('button').filter({ has: page.locator('img') }).first().click()
    const panel = page.locator('.preview-side-panel')
    await expect(panel.locator('.topic-title-link')).toContainText('测试反馈路由可用')
    await expect(panel).toContainText('预览正文。')
    await expect(panel).toContainText('评论加载中')
    expect(commentRequests()).toHaveLength(1)
    release()
    await expect(panel.locator('.comment-list')).toContainText('这是一条评论。')
    await page.locator('.forum-preview-close').click()
    await expect(page.locator('.forum-preview-root')).toHaveCount(0)
    await page.locator('.forum-topic-item').first().getByRole('button', { name: /评论/ }).first().click()
    const dialog = page.locator('.topic-preview-dialog')
    await expect(dialog.locator('.comment-list')).toContainText('这是一条评论。')
    await expect(dialog).not.toContainText('评论加载中')
    expect(commentRequests()).toHaveLength(1)
  }
  finally {
    release()
  }
})

for (const collapsed of [false, true]) {
  test(`image sheet shows topic before the comment module arrives (${collapsed ? 'expand' : 'open'})`, { tag: '@source' }, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('forum-image-preview-panel-collapsed', String(value)), collapsed)
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/ForumCommentArea.vue*', async (route) => {
      await pending
      await route.continue()
    })
    try {
      await page.goto('feedback')
      const image = page.locator('.forum-topic-item .forum-image-previewer').first().getByRole('button').filter({ has: page.locator('img') }).first()
      await image.click()
      const panel = page.locator('.preview-side-panel')
      if (collapsed) {
        await expect(panel).toHaveCount(0)
        await page.locator('.forum-preview-panel-toggle').click()
      }
      await expect(panel.locator('.topic-title-link')).toContainText('测试反馈路由可用')
      await expect(panel).toContainText('预览正文。')
      await expect(panel.locator('[data-async-loading]')).toBeVisible()
      release()
      await expect(panel.locator('.comment-list')).toContainText('这是一条评论。')
      await page.locator('.forum-preview-close').click()
      await expect(page.locator('.forum-preview-root')).toHaveCount(0)
    }
    finally {
      release()
    }
  })
}
