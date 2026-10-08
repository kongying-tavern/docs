import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const topics = [
  issue({ number: '123', title: 'FEAT:needle suggestion', comments: 0 }),
  issue({ id: 900002, number: '124', title: 'BUG:needle defect', labels: [{ name: 'TYP-BUG' }], comments: 0 }),
  issue({ id: 900003, number: '125', title: 'FEAT:unrelated suggestion', comments: 0 }),
  issue({ id: 900004, number: '126', title: 'FEAT:needle resolved', state: 'progressing', comments: 0, updated_at: '2026-09-01T00:00:00Z' }),
]
test.use({ scenario: { topics, comments: [] } })

test('search URL drives keyword, type and sorting requests and survives reload', async ({ page, forum }) => {
  await page.goto('/feedback/search/feat?q=needle&sort=updated')
  const rows = page.locator('.forum-topic-item')
  await expect(rows).toHaveCount(1)
  await expect(rows).toContainText('needle suggestion')
  const request = forum.requests.find(request => request.path === '/api/v5/search/issues')!
  expect(Object.fromEntries(request.query)).toMatchObject({ q: 'needle', label: 'TYP-FEAT', sort: 'updated_at' })
  expect(request.query.get('state')).toBe('open')
  await page.reload()
  await expect(rows).toHaveCount(1)
  await expect(rows).toContainText('needle suggestion')
  expect(new URL(page.url()).searchParams.get('q')).toBe('needle')
})

test('failed search retries through the visible action and replaces its error with results', async ({ page, scenario, forum }) => {
  let fail = true
  scenario.handle = request => request.path === '/api/v5/search/issues' && fail
    ? { status: 400, data: { message: 'Synthetic error' } }
    : undefined
  await page.goto('/feedback/search/feat?q=needle')
  await expect(page.getByText('加载失败', { exact: true })).toBeVisible()
  fail = false
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)
  await expect(page.getByText('加载失败', { exact: true })).toHaveCount(0)
  expect(forum.requests.filter(request => request.path === '/api/v5/search/issues')).toHaveLength(2)
})

// 同路径只换 query 时 VitePress 不加载页面，论坛路由状态靠 onAfterRouteChange 回灌；
// 漏掉这一步的表现是地址栏变了、列表仍按旧条件渲染
test('keyword typed into the toolbar search refilters the list in place', async ({ page, forum }) => {
  await page.goto('/feedback')
  const rows = page.locator('.forum-topic-item')
  await expect(rows).toHaveCount(3)

  await page.locator('.search-field-trigger').click()
  await page.keyboard.type('needle')
  await page.keyboard.press('Enter')

  await expect(rows).toHaveCount(2)
  await expect(page.locator('.forum-topic-item', { hasText: 'unrelated suggestion' })).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('q')).toBe('needle')
  const search = forum.requests.find(request => request.path === '/api/v5/search/issues')
  expect(search?.query.get('q')).toBe('needle')
})

test('aside tag chips refilter the list in place', async ({ page }) => {
  await page.goto('/feedback')
  const rows = page.locator('.forum-topic-item')
  await expect(rows).toHaveCount(3)

  await page.locator('.forum-tag-filter').first().click()

  await expect(rows).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('q')).toContain('tags:')
})
