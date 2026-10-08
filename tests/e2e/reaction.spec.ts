import { currentUser, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { following: false, user: currentUser } })

test('话题 reaction 读取服务端计数并把切换结果写回', async ({ page, forum }) => {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('/feedback/topic/123')

  const group = page.locator('[data-forum-reaction="topic"]')
  const like = group.getByRole('button', { name: '赞同', exact: true })
  const dislike = group.getByRole('button', { name: '不赞同', exact: true })

  await expect(group).toContainText('3', { timeout: 30_000 })
  await expect(like).toHaveAttribute('aria-pressed', 'false')
  await expect(dislike).toHaveAttribute('aria-pressed', 'false')

  await like.click()
  await expect(like).toHaveAttribute('aria-pressed', 'true')
  await expect(group).toContainText('4')
  expect(forum.requests.some(request => request.path === '/api/reactions/add' && request.query.get('action') === 'like')).toBe(true)

  // 再次点击同一侧是撤销，计数回到服务端返回的权威值
  await like.click()
  await expect(like).toHaveAttribute('aria-pressed', 'false')
  await expect(group).toContainText('3')
  expect(forum.requests.some(request => request.path === '/api/reactions/add' && request.query.get('action') === 'revoke')).toBe(true)

  // 反向评价只切换状态，不动赞同计数
  await dislike.click()
  await expect(dislike).toHaveAttribute('aria-pressed', 'true')
  await expect(like).toHaveAttribute('aria-pressed', 'false')
  await expect(group).toContainText('3')
})

test('reaction 请求失败时回滚到失败前的计数', async ({ page }) => {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let writes = 0
  // Registered after the shared fixture, so it takes precedence for this endpoint only.
  await page.route('**/api/reactions/add**', (route) => {
    writes++
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
  })
  await page.goto('/feedback/topic/123')

  const group = page.locator('[data-forum-reaction="topic"]')
  const like = group.getByRole('button', { name: '赞同', exact: true })
  await expect(group).toContainText('3', { timeout: 30_000 })

  await like.click()
  await expect(like).toHaveAttribute('aria-pressed', 'false')
  await expect(group).toContainText('3')
  expect(writes).toBe(1)
})
