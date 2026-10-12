import { expect, test } from './support/test'

test.use({ scenario: { topics: [], comments: [] } })

const SEARCH_URL = 'feedback/search?q=zzzzqweqwe&filter=all&topicType=all&sort=created'

test('search empty state', async ({ page }) => {
  await page.goto(SEARCH_URL)
  const empty = page.getByTestId('feedback-empty-state')
  await expect(empty).toHaveAttribute('data-state', 'search')
  await expect(empty).toHaveRole('status')
  await expect(empty).toContainText('zzzzqweqwe')
  await page.getByTestId('empty-filter-query').click()
  await expect(page).toHaveURL(/\/feedback\/search(?:\?|$)/)
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBeNull()
  await expect(page.getByRole('combobox')).toHaveValue('')
})

test('list error state', async ({ page, scenario }) => {
  scenario.handle = request => request.method === 'GET' && (request.path === '/api/v5/search/issues' || /\/issues\/999999$/.test(request.path)) ? { status: 500, data: { message: 'Server error' } } : undefined
  await page.goto(SEARCH_URL)
  await expect(page.getByText('加载失败', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('请稍后重试，或检查网络连接。')).toBeVisible()
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})

test('list rate-limit error state', async ({ page, scenario }) => {
  scenario.handle = request => request.method === 'GET' && (request.path === '/api/v5/search/issues' || /\/issues\/999999$/.test(request.path)) ? { status: 403, data: { message: 'Rate Limit Exceeded' } } : undefined
  await page.goto(SEARCH_URL)
  await expect(page.getByText('加载失败', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('请求过于频繁，请登录后重试')).toBeVisible()
  // 「登录」文案与侧栏按钮同名，限定内容区精确匹配
  await expect(page.locator('#VPContent').getByRole('button', { name: '登录', exact: true })).toBeVisible()
})

test('list unauthorized error state', async ({ page, scenario }) => {
  scenario.handle = request => request.method === 'GET' && (request.path === '/api/v5/search/issues' || /\/issues\/999999$/.test(request.path)) ? { status: 401, data: { message: '401 Unauthorized' } } : undefined
  await page.goto(SEARCH_URL)
  await expect(page.getByText('加载失败', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(page.locator('#VPContent').getByRole('button', { name: '登录', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})

test('user page empty state', async ({ page }) => {
  await page.goto('feedback/user/alice?filter=all')
  await expect(page.getByTestId('feedback-empty-state')).toHaveAttribute('data-state', 'feedback')
  // 未登录时主按钮按设计显示登录文案（限定内容区，侧边栏同文案按钮不会混淆）
  await expect(page.locator('#VPContent').getByRole('button', { name: '登录后提交反馈' })).toBeVisible()
  await page.getByTestId('empty-filter-closed').click()
  await expect(page).toHaveURL(/\/feedback\/user\/alice\/closed(?:\?|$)/)
  await expect(page.getByTestId('empty-filter-all')).toBeVisible()
})

test('topic error state', async ({ page, scenario }) => {
  scenario.handle = request => request.method === 'GET' && (request.path === '/api/v5/search/issues' || /\/issues\/999999$/.test(request.path)) ? { status: 500, data: { message: 'Server error' } } : undefined
  await page.goto('feedback/topic/999999')
  await expect(page.getByText('加载失败', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('请稍后重试，或检查网络连接。')).toBeVisible()
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})
