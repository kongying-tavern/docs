import assert from 'node:assert/strict'
import { test } from 'vitest'
import { useTokenManager } from '../../src/forum/composables/auth/useTokenManager'

test('replacing the main access token invalidates its SSO token', () => {
  const manager = useTokenManager()
  const mainAuth = { refreshToken: 'refresh', expiresIn: 3600 }

  manager.setTokens({ ...mainAuth, accessToken: 'main-old' })
  manager.setSSOToken('interKnot', { accessToken: 'sso-old', expiresIn: 3600 })
  manager.setTokens({ ...mainAuth, accessToken: 'main-old' })
  assert.equal(manager.ssoAuth.value.interKnot.accessToken, 'sso-old')

  manager.setTokens({ ...mainAuth, accessToken: 'main-new' })
  assert.deepEqual(manager.ssoAuth.value.interKnot, {})
})

test('new logins invalidate pending session work while token refresh keeps its generation', () => {
  const manager = useTokenManager()
  const auth = { accessToken: 'first', refreshToken: 'refresh', expiresIn: 3600 }
  const initial = manager.getSessionGeneration()
  manager.setTokens(auth, { newSession: true })
  assert.equal(manager.getSessionGeneration(), initial + 1)
  manager.setTokens({ ...auth, accessToken: 'refreshed' })
  assert.equal(manager.getSessionGeneration(), initial + 1)
  manager.setTokens({ ...auth, accessToken: 'replacement' }, { newSession: true })
  assert.equal(manager.getSessionGeneration(), initial + 2)
  manager.clearTokens()
  assert.equal(manager.getSessionGeneration(), initial + 3)
})
