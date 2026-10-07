import assert from 'node:assert/strict'
import { HTTPError } from 'ky'
import { afterEach, beforeEach, test, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { oauth } from '../../src/forum/api/gitee'
import { log } from '../../src/forum/composables/auth/auth-logger'
import { useTokenManager } from '../../src/forum/composables/auth/useTokenManager'
import { useAuthRefresh } from '../../src/forum/hooks/useAuthRefresh'
import { createAuthError } from '../../src/services/authErrors'

vi.mock('../../src/forum/api/gitee', () => ({ oauth: { refreshToken: vi.fn() } }))
const cleanup: (() => void)[] = []
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  vi.mocked(oauth.refreshToken).mockReset()
  for (const method of ['info', 'warn', 'error', 'success'] as const)
    vi.spyOn(log, method).mockImplementation(() => {})
})
afterEach(() => {
  cleanup.splice(0).forEach(stop => stop())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
function setup(expiresIn = 3600) {
  const scope = effectScope()
  const manager = scope.run(() => useTokenManager())!
  manager.setTokens({ accessToken: 'old', refreshToken: 'refresh', expiresIn })
  const refresh = scope.run(() => useAuthRefresh(manager))!
  cleanup.push(() => {
    refresh.stopAutoRefresh()
    scope.stop()
  })
  return { manager, refresh }
}
const response = () => ({ success: true as const, data: { accessToken: 'new', refreshToken: 'new-refresh', expiresIn: 3600, scope: '', tokenType: 'bearer', createdAt: Date.now() } })

test('concurrent refresh callers share one request and receive the new token', async () => {
  const { manager, refresh } = setup()
  vi.mocked(oauth.refreshToken).mockResolvedValue(response())
  await Promise.all([refresh.refreshToken(), refresh.refreshToken()])
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 1)
  assert.equal(manager.localAuth.value?.accessToken, 'new')
  assert.equal(manager.isTokenRefreshing.value, false)
})

test('a transient refresh error backs off and preserves the session', async () => {
  const { manager, refresh } = setup(1)
  vi.mocked(oauth.refreshToken).mockResolvedValueOnce({ success: false, error: createAuthError.networkError(new Error('offline')) }).mockResolvedValueOnce(response())
  const pending = refresh.refreshToken()
  await vi.advanceTimersByTimeAsync(5000)
  await pending
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 2)
  assert.equal(manager.localAuth.value?.accessToken, 'new')
  assert.equal(refresh.retryCount.value, 0)
})

test('a rejected refresh credential clears the session without retrying', async () => {
  const { manager, refresh } = setup(1)
  const error = new HTTPError(new Response(null, { status: 401 }), new Request('https://example.test/token'), {} as ConstructorParameters<typeof HTTPError>[2])
  vi.mocked(oauth.refreshToken).mockResolvedValue({ success: false, error: createAuthError.tokenRefreshFailed(error) })
  const pending = refresh.refreshToken()
  const joined = manager.waitForRefreshComplete().catch(() => {})
  await assert.rejects(pending)
  await joined
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 1)
  assert.equal(manager.localAuth.value, null)
  assert.equal(vi.getTimerCount(), 0)
})

test('auto refresh start is idempotent and stop cancels scheduled refreshes', async () => {
  const { manager, refresh } = setup(100)
  refresh.startAutoRefresh()
  refresh.startAutoRefresh()
  assert.equal(vi.getTimerCount(), 1)
  refresh.stopAutoRefresh()
  manager.setTokens({ accessToken: 'changed', refreshToken: 'refresh', expiresIn: 50 })
  await nextTick()
  await vi.advanceTimersByTimeAsync(100_000)
  assert.equal(vi.getTimerCount(), 0)
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 0)
})

test('another tab refreshing while waiting for the lock skips the stale request', async () => {
  const { manager, refresh } = setup(1)
  vi.stubGlobal('navigator', { locks: { request: async (_name: string, run: () => Promise<void>) => {
    manager.setTokens({ accessToken: 'other-tab', refreshToken: 'rotated', expiresIn: 3600 })
    await run()
  } } })
  await refresh.refreshToken()
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 0)
  assert.equal(manager.localAuth.value?.accessToken, 'other-tab')
})

test('persistent network failure exhausts bounded background rounds', async () => {
  const { manager, refresh } = setup(1)
  vi.mocked(oauth.refreshToken).mockResolvedValue({ success: false, error: createAuthError.networkError(new Error('offline')) })
  const pending = refresh.refreshToken().catch(() => {})
  const joined = manager.waitForRefreshComplete().catch(() => {})
  await vi.advanceTimersByTimeAsync(35_000)
  await Promise.all([pending, joined])
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 4)
  await vi.advanceTimersByTimeAsync(6 * 80_000)
  assert.equal(vi.getTimerCount(), 0)
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 9)
  assert.equal(manager.localAuth.value?.accessToken, 'old')
})

test('an in-flight refresh cannot restart scheduling after auto refresh stops', async () => {
  const { refresh } = setup(100)
  refresh.startAutoRefresh()
  let finish!: (value: ReturnType<typeof response>) => void
  vi.mocked(oauth.refreshToken).mockImplementation(() => new Promise((resolve) => {
    finish = resolve
  }))
  const pending = refresh.refreshToken()
  refresh.stopAutoRefresh()
  finish(response())
  await pending
  assert.equal(vi.getTimerCount(), 0)
})

function deferredResponse() {
  let finish!: (value: Awaited<ReturnType<typeof oauth.refreshToken>>) => void
  const promise = new Promise<Awaited<ReturnType<typeof oauth.refreshToken>>>((resolve) => {
    finish = resolve
  })
  return { promise, finish }
}

test('a cleared session cannot be resurrected by an in-flight refresh', async () => {
  const { manager, refresh } = setup()
  const old = deferredResponse()
  vi.mocked(oauth.refreshToken).mockReturnValue(old.promise)
  const pending = refresh.refreshToken()
  manager.clearTokens()
  old.finish(response())
  await pending
  assert.equal(manager.localAuth.value, null)
  assert.equal(vi.getTimerCount(), 0)
})

test('an old successful refresh preserves the relogged session and its SSO token', async () => {
  const { manager, refresh } = setup()
  const old = deferredResponse()
  vi.mocked(oauth.refreshToken).mockReturnValue(old.promise)
  const pending = refresh.refreshToken()
  refresh.stopAutoRefresh()
  manager.clearTokens()
  manager.setTokens({ accessToken: 'relogin', refreshToken: 'relogin-refresh', expiresIn: 3600 })
  manager.setSSOToken('interKnot', { accessToken: 'relogin-sso', expiresIn: 3600 })
  old.finish(response())
  await pending
  assert.equal(manager.localAuth.value?.accessToken, 'relogin')
  assert.equal(manager.ssoAuth.value.interKnot?.accessToken, 'relogin-sso')
  assert.equal(vi.getTimerCount(), 0)
})

test('an old refresh cannot settle a new request or clear its busy state', async () => {
  const { manager, refresh } = setup()
  const old = deferredResponse()
  const current = deferredResponse()
  vi.mocked(oauth.refreshToken).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
  const oldPending = refresh.refreshToken()
  manager.clearTokens()
  manager.setTokens({ accessToken: 'relogin', refreshToken: 'relogin-refresh', expiresIn: 3600 })
  const currentPending = refresh.refreshToken()
  let settled = false
  const joined = manager.waitForRefreshComplete().then(() => {
    settled = true
  })
  old.finish(response())
  await oldPending
  await Promise.resolve()
  assert.equal(settled, false)
  assert.equal(manager.isTokenRefreshing.value, true)
  assert.equal(manager.localAuth.value?.accessToken, 'relogin')
  current.finish(response())
  await Promise.all([currentPending, joined])
  assert.equal(settled, true)
  assert.equal(manager.isTokenRefreshing.value, false)
  assert.equal(manager.localAuth.value?.accessToken, 'new')
})

for (const status of [401, 403, 500]) {
  test(`an old HTTP ${status} refresh failure leaves the new session and request intact`, async () => {
    const { manager, refresh } = setup()
    const old = deferredResponse()
    const current = deferredResponse()
    vi.mocked(oauth.refreshToken).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
    const oldPending = refresh.refreshToken()
    const rejected = assert.rejects(oldPending)
    refresh.stopAutoRefresh()
    manager.clearTokens()
    manager.setTokens({ accessToken: 'relogin', refreshToken: 'relogin-refresh', expiresIn: 3600 })
    const currentPending = refresh.refreshToken()
    const joined = manager.waitForRefreshComplete()
    const error = new HTTPError(new Response(null, { status }), new Request('https://example.test/token'), {} as ConstructorParameters<typeof HTTPError>[2])
    old.finish({ success: false, error: createAuthError.tokenRefreshFailed(error) })
    await rejected
    assert.equal(manager.localAuth.value?.accessToken, 'relogin')
    assert.equal(manager.isTokenRefreshing.value, true)
    assert.equal(vi.getTimerCount(), 0)
    assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 2)
    current.finish(response())
    await Promise.all([currentPending, joined])
  })
}

test('clearing the session while waiting for a Web Lock never sends its old credential', async () => {
  const { manager, refresh } = setup()
  vi.stubGlobal('navigator', { locks: { request: async (_name: string, run: () => Promise<void>) => {
    manager.clearTokens()
    manager.setTokens({ accessToken: 'relogin', refreshToken: 'relogin-refresh', expiresIn: 3600 })
    await run()
  } } })
  await refresh.refreshToken()
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 0)
  assert.equal(manager.localAuth.value?.accessToken, 'relogin')
})

test('clearing the session during backoff prevents retries with a new login', async () => {
  const { manager, refresh } = setup(1)
  vi.mocked(oauth.refreshToken).mockResolvedValue({ success: false, error: createAuthError.networkError(new Error('offline')) })
  const pending = refresh.refreshToken()
  await vi.advanceTimersByTimeAsync(1)
  manager.clearTokens()
  manager.setTokens({ accessToken: 'relogin', refreshToken: 'relogin-refresh', expiresIn: 3600 })
  await vi.advanceTimersByTimeAsync(5000)
  await pending
  assert.equal(vi.mocked(oauth.refreshToken).mock.calls.length, 1)
  assert.equal(manager.localAuth.value?.accessToken, 'relogin')
  assert.equal(vi.getTimerCount(), 0)
})
