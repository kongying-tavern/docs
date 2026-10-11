import { currentUser, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: {
  user: currentUser,
  handle: request => request.path === '/oauth/token'
    ? { data: { access_token: 'synthetic-oauth-token', refresh_token: 'synthetic-refresh', expires_in: 86400, token_type: 'bearer', scope: 'user_info', created_at: Math.floor(Date.now() / 1000) } }
    : undefined,
} })

for (const mode of ['exchange', 'existing-session', 'denied'] as const) {
  test(`OAuth callback returns to rendered original page: ${mode}`, async ({ page, forum, baseURL }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(({ mode, auth, target }) => {
      if (!location.pathname.endsWith('/callback'))
        return
      sessionStorage.setItem('redirect-link', target)
      sessionStorage.setItem('gitee-oauth-state', 'synthetic-state')
      if (mode === 'existing-session')
        localStorage.setItem('USER-AUTH', auth)
    }, { mode, auth: localAuth(), target: new URL('feedback?from=oauth', baseURL).href })
    await page.goto(mode === 'denied'
      ? 'callback?error=access_denied&state=synthetic-state'
      : 'callback?code=synthetic-code&state=synthetic-state')
    await expect(page).toHaveURL(/\/feedback\?from=oauth$/)
    // URL alone misses the regression: replaceState changed it while leaving callback mounted.
    await expect(page.locator('.callback-page')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '测试反馈路由可用' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('redirect-link'))).toBeNull()
    expect(forum.requests.filter(request => request.path === '/oauth/token')).toHaveLength(mode === 'exchange' ? 1 : 0)
    expect(errors).toEqual([])
  })
}

test('callback exposes return URL immediately but keeps progress until token exchange completes', async ({ page, baseURL }) => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/oauth/token', async (route) => {
    await pending
    await route.fallback()
  })
  await page.addInitScript((target) => {
    if (!location.pathname.endsWith('/callback'))
      return
    sessionStorage.setItem('redirect-link', target)
    sessionStorage.setItem('gitee-oauth-state', 'synthetic-state')
  }, new URL('feedback?from=oauth', baseURL).href)
  try {
    await page.goto('callback?code=synthetic-code&state=synthetic-state')
    await expect(page).toHaveURL(/\/feedback\?from=oauth$/)
    await expect(page.locator('.callback-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: '测试反馈路由可用' })).toHaveCount(0)
  }
  finally {
    release()
  }
  await expect(page.locator('.callback-page')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '测试反馈路由可用' })).toBeVisible()
})

test('OAuth return restores the original document anchor after rendering', async ({ page, baseURL }) => {
  await page.addInitScript((target) => {
    if (!location.pathname.endsWith('/callback'))
      return
    sessionStorage.setItem('redirect-link', target)
    sessionStorage.setItem('gitee-oauth-state', 'synthetic-state')
  }, new URL('support-us#sponsor-acknowledgement', baseURL).href)
  await page.goto('callback?code=synthetic-code&state=synthetic-state')
  await expect(page).toHaveURL(/\/support-us#sponsor-acknowledgement$/)
  await expect(page.locator('.callback-page')).toHaveCount(0)
  await expect(page.locator('#sponsor-acknowledgement')).toBeInViewport()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})
