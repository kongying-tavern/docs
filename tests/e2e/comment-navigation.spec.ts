import { comment, issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const topic = issue({ comments: 21 })
const comments = Array.from({ length: 21 }, (_, index) => comment({ id: 99001 + index, body: `分页评论 ${index + 1}` }, topic))
test.use({ scenario: { topics: [topic], comments } })

test('comment deep link loads the second page and focuses its visible target', async ({ page, forum }) => {
  await page.goto('/feedback/topic/123?comment-page=2#reply-99021')
  const target = page.locator('#reply-99021')
  await expect(target).toContainText('分页评论 21', { timeout: 30_000 })
  await expect(target).toBeFocused()
  await expect(target).toBeInViewport()
  expect(forum.requests.filter(request => request.path.endsWith('/123/comments')).map(request => request.query.get('page'))).toEqual(['1', '2'])
})

test('missing comment terminates after the last page and keeps the topic readable', async ({ page, forum }) => {
  await page.goto('/feedback/topic/123?comment-page=2#reply-999999')
  await expect(page.getByRole('alert')).toContainText('未找到链接中的评论')
  await expect(page.locator('[data-forum-shared-topic="title"]')).toContainText('测试反馈路由可用')
  expect(forum.requests.filter(request => request.path.endsWith('/123/comments')).map(request => request.query.get('page'))).toEqual(['1', '2'])
})

test('pending comments show loading rather than terminal text, then display the received rows', async ({ page, scenario }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => release = resolve)
  scenario.handle = async (request) => {
    if (request.path.endsWith('/123/comments')) {
      await pending
      return { data: [comments[0]], headers: { Total_count: '1', Total_page: '1' } }
    }
  }
  try {
    await page.goto('/feedback/topic/123')
    await expect(page.getByRole('button', { name: '评论加载中…' })).toBeDisabled()
    await expect(page.getByText('没有更多评论', { exact: true })).toHaveCount(0)
  }
  finally { release() }
  await expect(page.locator('#reply-99001')).toContainText('分页评论 1')
  await expect(page.getByText('没有更多评论', { exact: true })).toBeVisible()
})
