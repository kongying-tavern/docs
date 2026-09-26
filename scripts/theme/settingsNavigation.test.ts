/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  consumeSettingsReturnUrl,
  rememberSettingsReturnUrl,
} from '../../src/services/settingsNavigation'

test('settings return URL only survives until it is consumed', () => {
  assert.equal(consumeSettingsReturnUrl(), null)

  rememberSettingsReturnUrl('/feedback#comments')
  assert.equal(consumeSettingsReturnUrl(), '/feedback#comments')
  assert.equal(consumeSettingsReturnUrl(), null)
})

test('the latest settings return URL replaces the previous one', () => {
  rememberSettingsReturnUrl('/feedback#first')
  rememberSettingsReturnUrl('/feedback#second')

  assert.equal(consumeSettingsReturnUrl(), '/feedback#second')
})
