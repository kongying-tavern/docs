import { issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test('preview keeps the topic visible after comment failure and allows retry', async ({ page, scenario }) => {
  let failing = true
  scenario.handle = request => request.path.endsWith('/issues/123/comments') && failing
    ? { status: 403, data: { message: 'Comment request failed' } }
    : undefined
  await page.goto('feedback')
  await page.locator('.forum-topic-item').first().getByRole('button', { name: /评论/ }).first().click()
  const dialog = page.locator('.topic-preview-dialog')
  await expect(dialog.locator('.topic-title-link')).toContainText('测试反馈路由可用')
  const retry = dialog.getByRole('button', { name: '重试', exact: true })
  await expect(retry).toBeVisible()
  failing = false
  await retry.click()
  await expect(dialog.locator('.comment-list')).toContainText('这是一条评论。')
})

for (const closed of [false, true]) {
  test.describe(`preview with ${closed ? 'closed' : 'empty'} comments`, () => {
    test.use({ scenario: { topics: [issue({ comments: closed ? -1 : 0 })], comments: [] } })
    test('renders without waiting for unavailable comments', async ({ page, forum }) => {
      await page.goto('feedback')
      const row = page.locator('.forum-topic-item').first()
      await expect(row).toBeVisible({ timeout: 30_000 })
      await row.focus()
      await row.press('Enter')
      const dialog = page.locator('.topic-preview-dialog')
      await expect(dialog.locator('.topic-title-link')).toContainText('测试反馈路由可用')
      if (closed) {
        await expect(dialog.locator('.forum-comment-surface')).toHaveCount(0)
        expect(forum.requests.filter(request => request.path.endsWith('/issues/123/comments'))).toHaveLength(0)
      }
      else {
        await expect(dialog.locator('.comment-list .forum-empty-state')).toBeVisible()
        await expect(dialog).not.toContainText('评论加载中')
      }
    })
  })
}

test('preview keeps topic content visible and recovers after the comment module times out', { tag: '@source' }, async ({ page }) => {
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
    await page.locator('.forum-topic-item').first().getByRole('button', { name: /评论/ }).first().click()
    const dialog = page.locator('.topic-preview-dialog')
    await expect(dialog.locator('.topic-title-link')).toContainText('测试反馈路由可用')
    await expect(dialog.locator('[data-async-error]')).toBeVisible({ timeout: 20_000 })
    await expect(dialog).toContainText('正文内容：这是一条用于浏览器冒烟测试的反馈。')
    await dialog.getByRole('button', { name: '重试', exact: true }).click()
    release()
    await expect(dialog.locator('.comment-list')).toContainText('这是一条评论。')
  }
  finally {
    release()
  }
})

test('keyboard focus preloads comments before the first preview opens', async ({ page, forum }) => {
  await page.goto('feedback')
  const row = page.locator('.forum-topic-item').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.focus()
  await expect.poll(() => forum.requests.filter(request => request.path.endsWith('/issues/123/comments')).length).toBe(1)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.topic-preview-dialog')).toHaveCount(0)
  await row.press('Enter')
  const dialog = page.locator('.topic-preview-dialog')
  await expect(dialog.locator('.comment-list')).toContainText('这是一条评论。')
  await expect(dialog).not.toContainText('评论加载中')
  expect(forum.requests.filter(request => request.path.endsWith('/issues/123/comments'))).toHaveLength(1)
})

test('preview renders the topic while comment prefetch is pending and reuses the result', async ({ page, scenario, forum }) => {
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
    const row = page.locator('.forum-topic-item').first()
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.hover()
    await expect.poll(() => commentRequests().length).toBe(1)
    await expect(page.locator('.topic-preview-dialog')).toHaveCount(0)
    await row.getByRole('button', { name: /评论/ }).first().click()
    const dialog = page.locator('.topic-preview-dialog')
    await expect(dialog.locator('.topic-title-link')).toContainText('测试反馈路由可用')
    await expect(dialog).toContainText('正文内容：这是一条用于浏览器冒烟测试的反馈。')
    await expect(dialog).toContainText('评论加载中')
    expect(commentRequests()).toHaveLength(1)
    release()
    await expect(dialog.locator('.comment-list')).toContainText('这是一条评论。')
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await row.getByRole('button', { name: /评论/ }).first().click()
    await expect(dialog.locator('.comment-list')).toContainText('这是一条评论。')
    await expect(dialog).not.toContainText('评论加载中')
    expect(commentRequests()).toHaveLength(1)
  }
  finally {
    release()
  }
})

test('save-data skips speculative preview loading but still warms on intent', { tag: '@source' }, async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' }, configurable: true })
  })
  let requested = false
  await page.route('**/ForumCommentArea.vue*', async (route) => {
    requested = true
    await route.continue()
  })
  await page.goto('feedback')
  const row = page.locator('.forum-topic-item').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  expect(requested).toBe(false)
  await row.hover()
  await expect.poll(() => requested).toBe(true)
})

test('desktop preview finishes idle preload before any user interaction', { tag: '@source' }, async ({ page }) => {
  let requested = false
  await page.route('**/ForumCommentArea.vue*', async (route) => {
    requested = true
    await route.continue()
  })
  await page.goto('feedback')
  const row = page.locator('.forum-topic-item').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => requested).toBe(true)
  await page.waitForLoadState('networkidle')
  await row.getByRole('button', { name: /评论/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').locator('.preview-body > p[role="status"]')).toHaveCount(0)
})

test('authenticated mobile editor is downloaded before opening, with no loading placeholder', { tag: '@source' }, async ({ page, scenario }) => {
  scenario.following = false
  await page.setViewportSize({ width: 375, height: 812 })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let requested = false
  await page.route('**/ForumRichTextarea.vue*', async (route) => {
    requested = true
    await route.continue()
  })
  await page.goto('feedback/topic/123')
  const entry = page.locator('.mobile-comment-entry')
  await expect(entry).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => requested).toBe(true)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.mobile-comment-dialog')).toHaveCount(0)
  await entry.click()
  const drawer = page.locator('.mobile-comment-dialog')
  await expect(drawer.locator('[contenteditable="true"]')).toBeFocused()
  await expect(drawer.getByRole('status')).toHaveCount(0)
})

test('preview shows topic content and stays cancelable while comments download is pending', { tag: '@source' }, async ({ page }) => {
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
    await page.locator('.forum-topic-item').first().getByRole('button', { name: /评论/ }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('status')).toBeVisible()
    await expect(dialog.locator('.topic-title-link')).toContainText('测试反馈路由可用')
    await expect(dialog).toContainText('正文内容：这是一条用于浏览器冒烟测试的反馈。')
    await dialog.getByRole('button', { name: '关闭', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    release()
    await expect(dialog).toHaveCount(0)
  }
  finally {
    release()
  }
})

test('slow mobile editor import keeps drawer responsive and focuses after mounting', { tag: '@source' }, async ({ page, scenario }) => {
  scenario.following = false
  await page.setViewportSize({ width: 375, height: 812 })
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let requested = false
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/ForumRichTextarea.vue*', async (route) => {
    requested = true
    await pending
    await route.continue()
  })
  try {
    await page.goto('feedback/topic/123')
    const entry = page.locator('.mobile-comment-entry')
    await expect(entry).toBeVisible({ timeout: 30_000 })
    await expect.poll(() => requested).toBe(true)
    await entry.click()
    const drawer = page.locator('.mobile-comment-dialog')
    await expect(drawer).toBeVisible()
    await expect(drawer.locator('[contenteditable="true"]')).toHaveCount(0)
    release()
    const editor = drawer.locator('[contenteditable="true"]')
    await expect(editor).toBeFocused()
    await editor.fill('异步加载后的草稿')
    await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 10, y: 10 } })
    await expect(drawer).toHaveCount(0)
    await entry.click()
    await expect(editor).toBeFocused()
    await expect(editor).toContainText('异步加载后的草稿')
  }
  finally {
    release()
  }
})
