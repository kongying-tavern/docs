import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { beforeEach, test, vi } from 'vitest'
import { redirectAuth, validateOAuthState } from '../../src/forum/api/gitee/oauth'

// State validation never calls the token endpoint.
vi.mock('../../src/forum/api/gitee/client', () => ({ oauthFetcher: {} }))

const STATE_KEY = 'gitee-oauth-state'
let session: Map<string, string>

function storage(values: Map<string, string>) {
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

beforeEach(() => {
  session = new Map()
  vi.stubGlobal('sessionStorage', storage(session))
  vi.stubGlobal('localStorage', storage(new Map()))
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal('location', { protocol: 'https:', host: 'yuanshen.site', href: '' })
})

test('authorization sends a cryptographically generated state and accepts it only once', () => {
  const random = vi.spyOn(webcrypto, 'getRandomValues')
  const url = new URL(redirectAuth('zh'))
  const state = url.searchParams.get('state')
  assert.equal(random.mock.calls.length, 1)
  assert.equal((random.mock.calls[0][0] as Uint8Array).byteLength, 16)
  assert.match(state!, /^[\da-f]{32}$/)
  assert.equal(session.get(STATE_KEY), state)
  assert.equal(url.origin, 'https://gitee.com')
  assert.equal(url.pathname, '/oauth/authorize')
  assert.equal(validateOAuthState(state), true)
  assert.equal(session.has(STATE_KEY), false)
  assert.equal(validateOAuthState(state), false)
})

test('missing, empty and mismatched callback states fail closed and consume the stored state', () => {
  for (const callback of [null, '', 'forged', 'EXPECTED']) {
    session.set(STATE_KEY, 'expected')
    assert.equal(validateOAuthState(callback), false)
    assert.equal(session.has(STATE_KEY), false)
    assert.equal(validateOAuthState('expected'), false)
  }
  assert.equal(validateOAuthState('expected'), false)
})

test('a new authorization replaces the earlier state', () => {
  const first = new URL(redirectAuth('zh')).searchParams.get('state')
  const second = new URL(redirectAuth('zh')).searchParams.get('state')
  assert.notEqual(first, second)
  assert.equal(session.get(STATE_KEY), second)
  assert.equal(validateOAuthState(first), false)
})

test('authorization does not navigate when state storage or secure randomness fails', () => {
  vi.stubGlobal('sessionStorage', {
    setItem() { throw new Error('Storage unavailable') },
  })
  assert.throws(() => redirectAuth('zh'), /Storage unavailable/)
  assert.equal(location.href, '')

  vi.stubGlobal('sessionStorage', storage(session))
  vi.spyOn(webcrypto, 'getRandomValues').mockImplementation(() => {
    throw new Error('Randomness unavailable')
  })
  assert.throws(() => redirectAuth('zh'), /Randomness unavailable/)
  assert.equal(location.href, '')
  assert.equal(session.has(STATE_KEY), false)
})
