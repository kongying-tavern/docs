import type { KyResponse } from 'ky'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { apiCall, clearApiCache, deleteApiCache } from '../../src/forum/api/gitee'

const requests = vi.hoisted(() => ({
  get: vi.fn<() => Promise<KyResponse<unknown>>>(),
  post: vi.fn<() => Promise<KyResponse<unknown>>>(),
}))

vi.mock('../../src/forum/api/gitee/client', () => ({
  prepareRequest: async (_endpoint: string, options: object) => options,
  fetcher: requests,
}))

function response(value = 1): KyResponse<unknown> {
  return new Response(JSON.stringify({ value }), { headers: { 'Content-Type': 'application/json' } }) as KyResponse<unknown>
}

beforeEach(() => {
  clearApiCache()
  requests.get.mockReset().mockImplementation(async () => response())
  requests.post.mockReset().mockImplementation(async () => response())
})
afterEach(() => {
  clearApiCache()
  vi.useRealTimers()
})

test('uncached reads share pending work but never retain completed responses; writes are independent', async () => {
  let release!: (value: KyResponse<unknown>) => void
  requests.get.mockImplementationOnce(() => new Promise(resolve => release = resolve))
  const first = apiCall('get', 'issues')
  const second = apiCall('get', 'issues')
  await Promise.resolve()
  release(response())
  await Promise.all([first, second])
  expect(requests.get).toHaveBeenCalledTimes(1)
  await apiCall('get', 'issues')
  expect(requests.get).toHaveBeenCalledTimes(2)
  await Promise.all([apiCall('post', 'issues'), apiCall('post', 'issues')])
  expect(requests.post).toHaveBeenCalledTimes(2)
})

test('explicit responses expire and the least recently used response is evicted at capacity', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  await apiCall('get', 'first', { cache: true })
  await apiCall('get', 'first', { cache: true })
  expect(requests.get).toHaveBeenCalledTimes(1)
  vi.setSystemTime(Date.now() + 60_001)
  await apiCall('get', 'first', { cache: true })
  expect(requests.get).toHaveBeenCalledTimes(2)
  for (let index = 0; index < 128; index++)
    await apiCall('get', `item-${index}`, { cache: true })
  await apiCall('get', 'first', { cache: true })
  expect(requests.get).toHaveBeenCalledTimes(131)
})

test.each(['clear', 'delete'])('%s during a pending read prevents a late response from resurrecting cache', async (operation) => {
  let release!: (value: KyResponse<unknown>) => void
  requests.get.mockImplementationOnce(() => new Promise(resolve => release = resolve))
  const first = apiCall('get', 'issues', { cache: true })
  await Promise.resolve()
  if (operation === 'clear')
    clearApiCache()
  else
    deleteApiCache('get', 'issues', {})
  release(response())
  await first
  await apiCall('get', 'issues', { cache: true })
  expect(requests.get).toHaveBeenCalledTimes(2)
})
