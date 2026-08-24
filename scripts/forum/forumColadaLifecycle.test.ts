/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia } from 'pinia'
import { createSSRApp, effectScope } from 'vue'

async function waitFor(assertion: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (assertion())
      return
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  assert.fail('Timed out waiting for the query cache to converge')
}

test('installed Colada shares one cache and refreshes stale active queries on focus and reconnect', async () => {
  const originalDocument = globalThis.document
  const originalWindow = globalThis.window
  const documentTarget = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const windowTarget = new EventTarget()

  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentTarget })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: windowTarget })

  const scopes = [effectScope(), effectScope()]

  try {
    const { PiniaColada, useQuery, useQueryCache } = await import('@pinia/colada')
    const app = createSSRApp({ render: () => null })
    const pinia = createPinia()
    app.use(pinia)
    app.use(PiniaColada)

    let fetchCount = 0
    const key = ['forum', 'lifecycle'] as const
    const createConsumer = (scope: (typeof scopes)[number]) => app.runWithContext(() => scope.run(() => useQuery({
      key,
      gcTime: false,
      staleTime: 60_000,
      query: async () => ({ revision: ++fetchCount }),
    })))!

    const first = createConsumer(scopes[0])
    await waitFor(() => first.data.value?.revision === 1)
    const second = createConsumer(scopes[1])

    assert.equal(fetchCount, 1)
    assert.deepEqual(second.data.value, { revision: 1 })

    const queryCache = app.runWithContext(() => useQueryCache())
    queryCache.setQueryData(key, { revision: 7 })
    assert.deepEqual(first.data.value, { revision: 7 })
    assert.deepEqual(second.data.value, { revision: 7 })

    const entry = queryCache.get(key)
    assert.ok(entry)
    queryCache.invalidate(entry)
    documentTarget.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => first.data.value?.revision === 2)
    assert.equal(fetchCount, 2)
    assert.deepEqual(first.data.value, { revision: 2 })
    assert.deepEqual(second.data.value, { revision: 2 })

    queryCache.invalidate(entry)
    windowTarget.dispatchEvent(new Event('online'))
    await waitFor(() => first.data.value?.revision === 3)
    assert.equal(fetchCount, 3)
    assert.deepEqual(first.data.value, { revision: 3 })
    assert.deepEqual(second.data.value, { revision: 3 })
  }
  finally {
    scopes.forEach(scope => scope.stop())
    if (originalDocument === undefined)
      Reflect.deleteProperty(globalThis, 'document')
    else
      Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument })
    if (originalWindow === undefined)
      Reflect.deleteProperty(globalThis, 'window')
    else
      Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
  }
})
