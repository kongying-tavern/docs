import assert from 'node:assert/strict'
import { HTTPError } from 'ky'
import { test } from 'vitest'
import {
  extractErrorMessages,
  GiteeAPIError,
  isErrorsOnlyPayload,
  isPhoneBindingRequiredError,
  toGiteeAPIError,
} from '../../src/forum/api/gitee/errors'
import { GiteeApiErrorType } from '../../src/forum/api/gitee/types'

const context = { method: 'post' as const, endpoint: '/repos/KYJGYSDT/Feedback/issues' }

function httpError(status: number, data: unknown, statusText = '') {
  const response = new Response(JSON.stringify(data ?? null), { status, statusText })
  const error = new HTTPError(
    response,
    new Request('https://gitee.com/api/v5/repos/KYJGYSDT/Feedback/issues', { method: 'POST' }),
    {} as ConstructorParameters<typeof HTTPError>[2],
  )
  // ky assigns the pre-parsed body after construction; the parser under test reads it there.
  error.data = data
  return error
}

test('error bodies normalize across provider and framework envelopes', () => {
  assert.deepEqual(extractErrorMessages('  request failed  '), ['request failed'])
  assert.deepEqual(extractErrorMessages({ message: 'from message', detail: 'from detail' }), ['from message'])
  assert.deepEqual(extractErrorMessages({ detail: 'from detail' }), ['from detail'])
  assert.deepEqual(extractErrorMessages({ title: 'from title' }), ['from title'])

  // JSON:API 数组与其中的嵌套对象递归展开
  assert.deepEqual(extractErrorMessages({ errors: [{ message: 'first' }, 'second'] }), ['first', 'second'])

  // Rails 字段映射：base 记录级错误优先，其余保持出现顺序
  assert.deepEqual(extractErrorMessages({ name: ['taken'], base: ['record level'] }), ['record level', 'taken'])
  assert.deepEqual(extractErrorMessages({ errors: { base: 'record level', name: 'taken' } }), ['record level', 'taken'])

  // 空白、非对象与非字符串字段都不产生消息，避免把空错误渲染给用户
  assert.deepEqual(extractErrorMessages('   '), [])
  assert.deepEqual(extractErrorMessages({ message: '  ' }), [])
  assert.deepEqual(extractErrorMessages({}), [])
  assert.deepEqual(extractErrorMessages(null), [])
  assert.deepEqual(extractErrorMessages(undefined), [])
  assert.deepEqual(extractErrorMessages([{ message: 'ignored' }]), [])
  assert.deepEqual(extractErrorMessages({ count: 3 }), [])
})

test('malformed 2xx payloads only count as errors when no resource identity is present', () => {
  assert.equal(isErrorsOnlyPayload({ errors: [{ message: 'invalid' }] }), true)
  assert.equal(isErrorsOnlyPayload({ errors: { base: 'invalid' } }), true)
  assert.equal(isErrorsOnlyPayload({ base: ['invalid'] }), true)

  // 空对象、缺字段的成功 issue 与任何带身份键的响应都不能当成错误体
  assert.equal(isErrorsOnlyPayload({}), false)
  assert.equal(isErrorsOnlyPayload(null), false)
  assert.equal(isErrorsOnlyPayload('invalid'), false)
  assert.equal(isErrorsOnlyPayload({ id: 1, number: '123', title: 'created' }), false)
  assert.equal(isErrorsOnlyPayload({ labels: [], base: ['invalid'] }), false)
  assert.equal(isErrorsOnlyPayload({ errors: 5 }), false)
  assert.equal(isErrorsOnlyPayload({ nested: { base: 'invalid' } }), false)
})

test('HTTP failures classify provider wording without over-classifying other failures', () => {
  const rateLimit = toGiteeAPIError(httpError(403, { message: 'Rate Limit Exceeded' }, 'Forbidden'), context)
  assert.equal(rateLimit.type, GiteeApiErrorType.RateLimitExceeded)
  assert.equal(rateLimit.isExceededRateLimit(), true)
  assert.equal(rateLimit.isUnauthorized(), false)
  assert.equal(rateLimit.state, 403)
  assert.equal(rateLimit.message, 'Rate limit exceeded')
  assert.equal(rateLimit.endpoint, context.endpoint)

  const unauthorized = toGiteeAPIError(httpError(401, { message: '401 Unauthorized: token expired' }, 'Unauthorized'), context)
  assert.equal(unauthorized.type, GiteeApiErrorType.Unauthorized)
  assert.equal(unauthorized.isUnauthorized(), true)
  assert.equal(unauthorized.message, 'token expired')

  // 同一状态码但文案不匹配时保留原始消息，不冒充限流或鉴权失败
  const other = toGiteeAPIError(httpError(403, { message: 'Repository is archived' }, 'Forbidden'), context)
  assert.equal(other.type, GiteeApiErrorType.ApiError)
  assert.equal(other.isExceededRateLimit(), false)
  assert.equal(other.state, 403)
  assert.equal(other.message, 'Repository is archived')

  // 401 上的限流文案仍按限流处理，状态码单独保留
  const limited401 = toGiteeAPIError(httpError(401, { message: 'Rate Limit Exceeded' }, 'Unauthorized'), context)
  assert.equal(limited401.isExceededRateLimit(), true)
  assert.equal(limited401.state, 401)
})

test('unclassified failures keep the original error as cause and stay reportable', () => {
  const network = new Error('fetch failed')
  const wrapped = toGiteeAPIError(network, context)
  assert.equal(wrapped.type, GiteeApiErrorType.ApiError)
  assert.equal(wrapped.message, 'fetch failed')
  assert.equal(wrapped.cause, network)
  assert.equal(wrapped.state, undefined)

  const coerced = toGiteeAPIError('plain failure', context)
  assert.equal(coerced.type, GiteeApiErrorType.ApiError)
  assert.equal(coerced.message, 'plain failure')
  assert.ok(coerced.cause instanceof Error)

  const existing = new GiteeAPIError(GiteeApiErrorType.Unauthorized, { message: 'already wrapped' })
  assert.equal(toGiteeAPIError(existing, context), existing)

  const json = wrapped.toJSON()
  assert.equal(json.name, 'GiteeAPIError')
  assert.equal(json.type, GiteeApiErrorType.ApiError)
  assert.equal(json.endpoint, context.endpoint)
  assert.equal(json.message, 'fetch failed')
  assert.equal(json.date, new Date(wrapped.date).toISOString())
})

test('phone binding detection needs both the provider wording and a Gitee error', () => {
  const binding = new GiteeAPIError(GiteeApiErrorType.ApiError, { message: '请先绑定手机号后再操作' })
  assert.equal(isPhoneBindingRequiredError(binding), true)
  assert.equal(isPhoneBindingRequiredError(new GiteeAPIError(GiteeApiErrorType.ApiError, { message: 'other failure' })), false)
  assert.equal(isPhoneBindingRequiredError(new Error('请先绑定手机号')), false)
  assert.equal(isPhoneBindingRequiredError(undefined), false)
})
