import type { useSSOAuth } from '../../src/forum/hooks/useSSOAuth'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, test, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { log } from '../../src/forum/composables/auth/auth-logger'
import { useTokenManager } from '../../src/forum/composables/auth/useTokenManager'
import { useSSORefreshManager } from '../../src/forum/hooks/useSSORefreshManager'

const cleanup: (() => void)[] = []
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  for (const method of ['info', 'warn', 'error', 'success'] as const)
    vi.spyOn(log, method).mockImplementation(() => {})
})
afterEach(() => {
  cleanup.splice(0).forEach(stop => stop())
  vi.useRealTimers()
})
function setup() {
  const scope = effectScope()
  const manager = scope.run(() => useTokenManager())!
  manager.setTokens({ accessToken: 'main', refreshToken: 'refresh', expiresIn: 3600 })
  manager.setSSOToken('interKnot', { accessToken: 'sso', expiresIn: 900 })
  const request = vi.fn(async () => {})
  const refresh = scope.run(() => useSSORefreshManager(manager, { refreshInterKnotToken: request } as unknown as ReturnType<typeof useSSOAuth>))!
  cleanup.push(() => {
    refresh.stopAllSSORefresh()
    scope.stop()
  })
  return { manager, request, refresh }
}

test('concurrent SSO calls keep the in-flight guard until the original finishes', async () => {
  const { request, refresh } = setup()
  let finish!: () => void
  request.mockImplementation(() => new Promise<void>((resolve) => {
    finish = resolve
  }))
  const first = refresh.refreshSSOToken('interKnot')
  await refresh.refreshSSOToken('interKnot')
  assert.equal(refresh.isRefreshingSSO.value.interKnot, true)
  await refresh.refreshSSOToken('interKnot')
  assert.equal(request.mock.calls.length, 1)
  finish()
  await first
  assert.equal(refresh.isRefreshingSSO.value.interKnot, false)
})

test('stopping and restarting SSO refresh cancels an old retry', async () => {
  const { manager, request, refresh } = setup()
  refresh.startSSOAutoRefresh()
  request.mockRejectedValueOnce(new Error('offline'))
  await refresh.refreshSSOToken('interKnot')
  refresh.stopAllSSORefresh()
  assert.equal(vi.getTimerCount(), 0)
  refresh.startSSOAutoRefresh()
  await vi.advanceTimersByTimeAsync(60_000)
  assert.equal(request.mock.calls.length, 1)
  manager.clearTokens()
  await nextTick()
  assert.equal(refresh.isManagerActive.value, false)
  assert.equal(vi.getTimerCount(), 0)
})

test('an in-flight SSO completion cannot recreate timers after stop', async () => {
  const { request, refresh } = setup()
  refresh.startSSOAutoRefresh()
  let finish!: () => void
  request.mockImplementation(() => new Promise<void>((resolve) => {
    finish = resolve
  }))
  const pending = refresh.refreshSSOToken('interKnot')
  refresh.stopAllSSORefresh()
  finish()
  await pending
  assert.equal(vi.getTimerCount(), 0)
  assert.equal(refresh.isRefreshingSSO.value.interKnot, false)
})

test('SSO retry stops at the configured limit', async () => {
  const { request, refresh } = setup()
  refresh.startSSOAutoRefresh()
  request.mockRejectedValue(new Error('offline'))
  await refresh.refreshSSOToken('interKnot')
  await vi.advanceTimersByTimeAsync(120_000)
  assert.equal(request.mock.calls.length, 3)
  assert.equal(refresh.getDebugInfo().retryCount.interKnot, 3)
  assert.equal(vi.getTimerCount(), 0)
})
