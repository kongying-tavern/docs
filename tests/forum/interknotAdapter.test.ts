import type { INTER_KNOT } from '../../src/apis/interknot.site/api'
import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { logout, refreshToken } from '../../src/apis/interknot.site/oauth'
import { getPageReaction, setPageReaction } from '../../src/apis/interknot.site/reactions'
import { generateRandomString, normalizeSSOAuth, signToken } from '../../src/apis/interknot.site/utils'
import { AuthError, AuthErrorType } from '../../src/services/authErrors'

const mocks = vi.hoisted(() => ({
  requests: [] as Array<{ method: string, path: string, options: Record<string, unknown> }>,
  respond: (() => {
    throw new Error('response not configured')
  }) as () => unknown,
}))

vi.mock('~/apis/interknot.site', () => ({
  SSO_SESSION_CONTEXT: { ssoSession: true },
  fetcher: {
    get: (path: string, options: Record<string, unknown> = {}) => {
      mocks.requests.push({ method: 'get', path, options })
      return { json: async () => mocks.respond() }
    },
    post: (path: string, options: Record<string, unknown> = {}) => {
      mocks.requests.push({ method: 'post', path, options })
      return { json: async () => mocks.respond() }
    },
  },
}))

test('sso signatures bind the token to a fresh nonce', async () => {
  const signature = await signToken('token-a', 'nonce-1')
  assert.match(signature, /^[a-f0-9]{64}$/)
  assert.equal(await signToken('token-a', 'nonce-1'), signature)
  assert.notEqual(await signToken('token-a', 'nonce-2'), signature)
  assert.notEqual(await signToken('token-b', 'nonce-1'), signature)

  const nonce = generateRandomString(16)
  assert.match(nonce, /^[A-Z0-9]{16}$/i)
  assert.notEqual(generateRandomString(16), generateRandomString(16))
})

test('sso responses normalize to the local session shape and clamp expired tokens', () => {
  vi.useFakeTimers()
  try {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const valid = normalizeSSOAuth({
      statusCode: 200,
      data: { token: 'abc', createdAt: '2025-12-31T23:59:00.000Z', expiresAt: '2026-01-01T01:00:00.000Z' },
    } as INTER_KNOT.AuthResponse)
    assert.equal(valid.accessToken, 'abc')
    assert.equal(valid.createdAt, Date.parse('2025-12-31T23:59:00.000Z'))
    assert.equal(valid.expiresTime, Date.parse('2026-01-01T01:00:00.000Z'))
    assert.equal(valid.expiresIn, 3600)

    // 已过期的响应不能产生负数剩余时长
    const expired = normalizeSSOAuth({
      statusCode: 200,
      data: { token: 'stale', createdAt: '2025-01-01T00:00:00.000Z', expiresAt: '2025-06-01T00:00:00.000Z' },
    } as INTER_KNOT.AuthResponse)
    assert.equal(expired.expiresIn, 0)
  }
  finally {
    vi.useRealTimers()
  }
})

test('sso refresh posts a signed token through the session context', async () => {
  mocks.requests.length = 0
  mocks.respond = () => ({
    statusCode: 200,
    data: {
      token: 'fresh-token',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    },
  })

  const result = await refreshToken('access-token')
  assert.ok(result.success, 'refresh must succeed for a 2xx response')
  assert.equal(result.data.accessToken, 'fresh-token')

  assert.equal(mocks.requests.length, 1)
  const [request] = mocks.requests
  assert.equal(request.method, 'post')
  assert.equal(request.path, 'sso/refresh-token')
  // 会话接口必须跳过 SSO hooks 且不重试，否则刷新请求会等待自己
  assert.deepEqual(request.options.context, { ssoSession: true })
  assert.equal(request.options.retry, 0)

  const payload = request.options.json as { token: string, provider: string, signature: string, nonce: string }
  assert.equal(payload.token, 'access-token')
  assert.equal(payload.provider, 'gitee')
  assert.match(payload.nonce, /^[A-Z0-9]{16}$/i)
  assert.equal(payload.signature, await signToken('access-token', payload.nonce))
})

test('sso refresh failures surface as a typed auth error', async () => {
  const failure = new Error('hub unavailable')
  mocks.respond = () => {
    throw failure
  }

  const result = await refreshToken('access-token')
  assert.equal(result.success, false)
  assert.ok(AuthError.isAuthError(result.error, AuthErrorType.SSO_REFRESH_FAILED))
  assert.equal(result.error.message, 'SSO token refresh failed: interknot')
  assert.equal(result.error.originalError, failure)
})

test('sso logout sends its own bearer and reports failures as logout failures', async () => {
  mocks.requests.length = 0
  mocks.respond = () => ({ statusCode: 200, data: { success: true } })

  const result = await logout('token-123')
  assert.ok(result.success)
  assert.equal(mocks.requests[0].path, 'sso/logout')
  assert.equal(mocks.requests[0].options.retry, 0)
  assert.deepEqual(mocks.requests[0].options.headers, { Authorization: 'Bearer token-123' })

  await logout()
  assert.deepEqual(mocks.requests[1].options.headers, {})

  mocks.respond = () => {
    throw new Error('logout failed')
  }
  const failed = await logout('token-123')
  assert.equal(failed.success, false)
  assert.ok(AuthError.isAuthError(failed.error, AuthErrorType.SSO_REFRESH_FAILED))
  assert.equal(failed.error.message, 'SSO token refresh failed: interknot-logout')
})

test('reaction queries pass through the provider envelope untouched', async () => {
  // 逻辑测试跑在 node 环境，import.meta.env.SSR 默认为 true；浏览器分支需要显式关闭
  vi.stubEnv('SSR', false)
  mocks.requests.length = 0
  const payload: INTER_KNOT.ReactionResponse = {
    statusCode: 200,
    statusMessage: 'OK',
    data: { reaction: null, state: null },
  }
  mocks.respond = () => payload
  const resource = 'https://yuanshen.site/feedback/topic/123'

  // 消费方按 statusCode 判定成败，适配层不得改写信封
  assert.deepEqual(await getPageReaction({ url: resource }), payload)
  assert.equal(mocks.requests[0].path, 'reactions')
  assert.equal(mocks.requests[0].options.cache, 'no-store')
  assert.deepEqual(mocks.requests[0].options.searchParams, { userId: undefined, url: resource })

  await setPageReaction('like', { url: resource, userId: '99' })
  assert.equal(mocks.requests[1].path, 'reactions/add')
  assert.equal(mocks.requests[1].options.retry, 0)
  assert.deepEqual(mocks.requests[1].options.searchParams, { action: 'like', userId: '99', url: resource })
})

test('reaction queries stay inert during SSR', async () => {
  mocks.requests.length = 0
  assert.equal(await getPageReaction({ url: 'https://yuanshen.site/feedback/topic/123' }), null)
  assert.equal(await setPageReaction('like', { url: 'https://yuanshen.site/feedback/topic/123' }), null)
  assert.equal(mocks.requests.length, 0)
})
