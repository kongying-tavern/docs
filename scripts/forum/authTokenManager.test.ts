/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import assert from 'node:assert/strict'
import test from 'node:test'
import { useTokenManager } from '../../.vitepress/theme/composables/useTokenManager'

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
