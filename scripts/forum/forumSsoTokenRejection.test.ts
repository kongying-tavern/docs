/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { isAccessTokenRejectionStatus, isExpiredUserAccessTokenBody } from '../../src/apis/interknot.site/utils'

test('401 is always a token rejection regardless of body', () => {
  assert.equal(isAccessTokenRejectionStatus(401, undefined), true)
  assert.equal(isAccessTokenRejectionStatus(401, { message: 'anything' }), true)
})

test('hub 500 Expired user access token bodies are token rejections', () => {
  assert.equal(isAccessTokenRejectionStatus(500, { statusCode: 500, message: 'Expired user access token' }), true)
  assert.equal(isAccessTokenRejectionStatus(500, { statusMessage: 'Expired user access token' }), true)
})

test('other 500 bodies and other statuses are not token rejections', () => {
  assert.equal(isAccessTokenRejectionStatus(500, { message: 'Internal Server Error' }), false)
  assert.equal(isAccessTokenRejectionStatus(500, undefined), false)
  assert.equal(isAccessTokenRejectionStatus(500, 'string body'), false)
  assert.equal(isAccessTokenRejectionStatus(403, { message: 'Expired user access token' }), false)
  assert.equal(isAccessTokenRejectionStatus(502, undefined), false)
})

test('isExpiredUserAccessTokenBody ignores non-object and unrelated bodies', () => {
  assert.equal(isExpiredUserAccessTokenBody(undefined), false)
  assert.equal(isExpiredUserAccessTokenBody(null), false)
  assert.equal(isExpiredUserAccessTokenBody('Expired user access token'), false)
  assert.equal(isExpiredUserAccessTokenBody({}), false)
  assert.equal(isExpiredUserAccessTokenBody({ message: 'nope', statusMessage: 'nope' }), false)
})

test('beforeRetry reads ky-parsed error.data instead of re-reading the consumed response body', async () => {
  const source = await readFile(new URL('../../src/apis/interknot.site/index.ts', import.meta.url), 'utf8')
  assert.match(source, /isAccessTokenRejectionStatus\(error\.response\.status/)
  assert.doesNotMatch(source, /isAccessTokenRejection\(error\.response\)/)
  // 刷新失败必须回退节流时间戳，否则窗口内后续被拒请求无法重试刷新
  assert.match(source, /lastServerDrivenSSORefreshAt = 0/)
})
