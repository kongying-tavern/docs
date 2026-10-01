/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import assert from 'node:assert/strict'
import test from 'node:test'
import { describeError, formatTraceId } from '../../services/telemetry/describeError'

test('describeError surfaces the concrete error text instead of ids', () => {
  assert.equal(describeError(new Error('Failed to fetch')), 'Failed to fetch')

  class GiteeAPIError extends Error {
    state = 403
    method = 'POST'
    endpoint = '/api/v5/repos/x/issues'
  }
  GiteeAPIError.prototype.name = 'GiteeAPIError'

  assert.equal(
    describeError(new GiteeAPIError('手机号未绑定')),
    'GiteeAPIError: 手机号未绑定 · HTTP 403 · POST /api/v5/repos/x/issues',
  )
  assert.equal(describeError('boom'), 'boom')
  assert.equal(describeError({ code: 'E_NET' }), '{"code":"E_NET"}')
  // 无名无内容的错误没有可展示的信息
  const blank = new Error('placeholder')
  blank.message = ''
  assert.equal(describeError(blank), null)
  assert.equal(describeError(undefined), null)
  assert.equal(describeError(null), null)
  assert.equal(describeError({}), null)
})

test('describeError keeps pathological messages bounded', () => {
  const detail = describeError(new Error('x'.repeat(400)))
  assert.equal(detail?.length, 301)
})

test('trace id merges session and error id, and disappears when reporting is off', () => {
  assert.equal(formatTraceId({ errorId: 'tp-x7k2m9a1', sessionId: 'ab12cd34' }), 'ab12cd34-tp-x7k2m9a1')
  assert.equal(formatTraceId({ errorId: 'tp-x7k2m9a1', sessionId: null }), 'tp-x7k2m9a1')
  assert.equal(formatTraceId({ errorId: null, sessionId: 'ab12cd34' }), 'ab12cd34')
  // 上报关闭时 reportError 返回 null，报错信息里不该再出现任何标识
  assert.equal(formatTraceId(null), null)
  assert.equal(formatTraceId(undefined), null)
  assert.equal(formatTraceId({}), null)
})
