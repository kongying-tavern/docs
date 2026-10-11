import type { AuthSessionAccessor } from '../../src/services/authSession'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearApiCache } from '../../src/forum/api/gitee'
import { getGist } from '../../src/forum/api/gitee/gists'
import { getAuthSession, registerAuthSessionAccessor } from '../../src/services/authSession'

vi.mock('../../src/services/apiUtils', async importOriginal => ({
  ...await importOriginal<typeof import('../../src/services/apiUtils')>(),
  isNodeEnvironment: () => false,
}))

let previous: AuthSessionAccessor | null
let generation: number
let token: string
let session: AuthSessionAccessor
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  clearApiCache()
  previous = getAuthSession()
  generation = 1
  token = 'test-old-session-token'
  session = {
    getSessionGeneration: () => generation,
    getAccessToken: () => token,
    isTokenValid: () => true,
    refreshToken: async () => {},
    waitForTokenReady: async () => {},
    isInterKnotTokenValid: () => false,
    getInterKnotAccessToken: () => null,
    refreshSSOAuth: async () => {},
    invalidateInterKnotToken: () => {},
  }
  registerAuthSessionAccessor(session)
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'existing', description: 'Kongying Forum State', public: false, files: {} }), { headers: { 'Content-Type': 'application/json' } }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  registerAuthSessionAccessor(previous)
  clearApiCache()
})

test('a session already replaced before request preparation never sends HTTP', async () => {
  generation++
  await expect(getGist('existing', { expectedSessionGeneration: 1 })).rejects.toThrow('session changed')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('a session replaced while waiting for a token never sends HTTP with the new account token', async () => {
  session.waitForTokenReady = async () => {
    generation++
    token = 'test-new-account-token'
  }
  await expect(getGist('existing', { expectedSessionGeneration: 1 })).rejects.toThrow('session changed')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('normal token rotation within the same session remains allowed', async () => {
  session.waitForTokenReady = async () => {
    token = 'test-refreshed-token'
  }
  await expect(getGist('existing', { expectedSessionGeneration: 1 })).resolves.toMatchObject({ id: 'existing' })
  expect(fetchMock).toHaveBeenCalledOnce()
})
