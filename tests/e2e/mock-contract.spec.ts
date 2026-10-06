import { expect, test } from '@playwright/test'
import { installForumApi } from './support/forum-api'

test('Mock separates detail from comments and blocks unknown reads and accidental writes', async ({ page }) => {
  const api = await installForumApi(page)
  await page.goto('/feedback/topic/123')
  const values = await page.evaluate(async () => {
    const base = 'https://gitee.com/api/v5/repos/KYJGYSDT/Feedback/issues'
    const detail = await (await fetch(`${base}/123`)).json()
    const comments = await (await fetch(`${base}/123/comments`)).json()
    const blocked = await Promise.all([
      fetch(`${base}/unhandled/resource`).then(() => false, () => true),
      fetch(base, { method: 'POST', body: '{}' }).then(() => false, () => true),
    ])
    return { number: detail.number, array: Array.isArray(comments), target: comments[0].target.issue.number, blocked }
  })
  expect(values).toEqual({ number: '123', array: true, target: '123', blocked: [true, true] })
  expect(api.unexpected).toEqual([
    'GET /api/v5/repos/KYJGYSDT/Feedback/issues/unhandled/resource',
    'POST /api/v5/repos/KYJGYSDT/Feedback/issues',
  ])
})
