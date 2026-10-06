import { expect, test } from './support/test'

async function assertDetail(page: import('@playwright/test').Page) {
  await expect(page.locator('[data-forum-shared-topic="title"]')).toContainText('测试反馈路由可用')
  await expect(page.locator('[data-forum-shared-topic="content"], #content')).toContainText('正文内容')
  await expect(page.locator('#reply-99001')).toContainText('这是一条评论。')
}

test('列表进入详情，评论真实渲染，后退和前进保留可交互页面', async ({ page, forum }) => {
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30_000 })
  await page.locator('.forum-topic-item h4').first().click()
  await expect(page).toHaveURL(/\/feedback\/topic\/123$/)
  await assertDetail(page)
  expect(forum.requests.some(request => request.path.endsWith('/issues/123/comments'))).toBe(true)
  await page.goBack()
  await expect(page).toHaveURL(/\/feedback$/)
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)
  await page.goForward()
  await expect(page).toHaveURL(/\/feedback\/topic\/123$/)
  await assertDetail(page)
})

test('详情深链加载正确的评论数组与作者', async ({ page }) => {
  const response = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/issues/123/comments'))
  await page.goto('/feedback/topic/123')
  expect(Array.isArray(await (await response).json())).toBe(true)
  await assertDetail(page)
  await expect(page.locator('[data-forum-shared-topic="author"]')).toContainText('Alice')
})
