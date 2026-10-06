import type { AuthSessionAccessor } from '../../src/services/authSession'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test, { mock } from 'node:test'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { getAuthSession, registerAuthSessionAccessor } from '../../src/services/authSession'

// Supply Vite's browser flag for this module while executing its real ky hooks in Node.
const browserModule = new URL('../../src/apis/interknot.site/index.ts', import.meta.url).href
const loader = registerHooks({
  load(url, context, nextLoad) {
    const result = nextLoad(url, context)
    if (url.split('?')[0] !== browserModule || !result.source)
      return result
    const source = typeof result.source === 'string' ? result.source : new TextDecoder().decode(result.source)
    return { ...result, source: `import.meta.env = { SSR: false };\n${source}` }
  },
})
const { fetcher, SSO_SESSION_CONTEXT } = await import('../../src/apis/interknot.site')
const { useUserInfoStore } = await import('../../src/forum/stores/auth/useUserInfo')
loader.deregister()

let clock = Date.now()

async function setup() {
  const app = createSSRApp({
    setup() {
      useUserInfoStore().fingerprint = { visitorId: 'test-device', confidence: { score: 1 }, components: {}, version: 'test' }
      return () => null
    },
  })
  app.use(createPinia())
  await renderToString(app)
  const previous = getAuthSession()
  let accessToken: string | null = 'old-sso'
  let valid = true
  let refreshes = 0
  let failRefresh = false
  const session: AuthSessionAccessor = {
    isTokenValid: () => true,
    getAccessToken: () => 'main-token',
    refreshToken: async () => {},
    waitForTokenReady: async () => {},
    isInterKnotTokenValid: () => valid,
    getInterKnotAccessToken: () => accessToken,
    invalidateInterKnotToken: () => {
      valid = false
      accessToken = null
    },
    refreshSSOAuth: async () => {
      refreshes++
      if (failRefresh)
        throw new Error('Refresh failed')
      accessToken = 'new-sso'
      valid = true
    },
  }
  registerAuthSessionAccessor(session)
  clock += 20_000
  const time = mock.method(Date, 'now', () => clock)
  return {
    session,
    refreshes: () => refreshes,
    failRefresh: (value: boolean) => failRefresh = value,
    restore() {
      time.mock.restore()
      registerAuthSessionAccessor(previous)
    },
  }
}

test('a server-rejected SSO token is refreshed and the real HTTP retry carries the new Bearer', async () => {
  const state = await setup()
  const bearers: Array<string | null> = []
  const client = fetcher.extend({
    retry: { limit: 1, delay: () => 0 },
    fetch: async (input, init) => {
      const request = new Request(input, init)
      bearers.push(request.headers.get('Authorization'))
      if (bearers.length === 1)
        return new Response(JSON.stringify({ message: 'Expired user access token' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      return new Response('{}', { headers: { 'Content-Type': 'application/json' } })
    },
  })
  try {
    await client.get('test').json()
    assert.deepEqual(bearers, ['Bearer old-sso', 'Bearer new-sso'])
    assert.equal(state.refreshes(), 1)
  }
  finally { state.restore() }
})

test('refresh failure allows another rejected request to refresh inside the throttle window', async () => {
  const state = await setup()
  const client = fetcher.extend({
    retry: { limit: 1, delay: () => 0 },
    fetch: async () => new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }),
  })
  try {
    state.failRefresh(true)
    await assert.rejects(client.get('test'))
    assert.equal(state.refreshes(), 1)
    state.failRefresh(false)
    // Keep beforeRequest from doing the refresh, so this verifies beforeRetry's throttle rollback.
    state.session.isInterKnotTokenValid = () => true
    await assert.rejects(client.get('test'))
    assert.equal(state.refreshes(), 2)
  }
  finally { state.restore() }
})

test('SSO session requests keep their explicit Bearer and do not enter token refresh', async () => {
  const state = await setup()
  const bearers: Array<string | null> = []
  const client = fetcher.extend({
    retry: { limit: 1, delay: () => 0 },
    fetch: async (input, init) => {
      bearers.push(new Request(input, init).headers.get('Authorization'))
      return new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } })
    },
  })
  try {
    await assert.rejects(client.post('test', { context: SSO_SESSION_CONTEXT, headers: { Authorization: 'Bearer explicit' } }))
    assert.deepEqual(bearers, ['Bearer explicit', 'Bearer explicit'])
    assert.equal(state.refreshes(), 0)
    assert.equal(state.session.getInterKnotAccessToken(), 'old-sso')
  }
  finally { state.restore() }
})

test('an upload without retries invalidates a rejected token and the next request refreshes first', async () => {
  const state = await setup()
  const bearers: Array<string | null> = []
  const client = fetcher.extend({
    retry: 0,
    fetch: async (input, init) => {
      bearers.push(new Request(input, init).headers.get('Authorization'))
      return new Response('{}', { status: bearers.length === 1 ? 401 : 200, headers: { 'Content-Type': 'application/json' } })
    },
  })
  try {
    await assert.rejects(client.post('test'))
    assert.equal(state.session.getInterKnotAccessToken(), null)
    assert.equal(state.refreshes(), 0)
    await client.post('test')
    assert.deepEqual(bearers, ['Bearer old-sso', 'Bearer new-sso'])
    assert.equal(state.refreshes(), 1)
  }
  finally { state.restore() }
})
