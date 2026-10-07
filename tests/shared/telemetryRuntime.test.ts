import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { test } from 'vitest'
import { ref, shallowRef, watch } from 'vue'

const telemetryDir = fileURLToPath(new URL('../../src/services/telemetry/', import.meta.url))
type ModuleAPI = typeof import('../../src/services/telemetry/clarity')
  & typeof import('../../src/services/telemetry/capture')
  & typeof import('../../src/services/telemetry/settings')
  & typeof import('../../src/services/telemetry/session')
  & typeof import('../../src/services/telemetry/ops')
  & typeof import('../../src/services/telemetry/pageAlert')
  & typeof import('../../src/forum/composables/auth/executeWithAuth')

function runtime(options: { loaded?: boolean, storageFails?: boolean } = {}) {
  const calls: unknown[][] = []
  const listeners = new Map<string, () => void>()
  const storage = new Map<string, string>()
  const enabled = ref(true)
  const alerts: { description?: string }[] = []
  const toasts: unknown[] = []
  const document = { documentElement: { dataset: { clarityLoaded: options.loaded === false ? 'false' : 'true' } } }
  const window = {
    clarity: (...args: unknown[]): unknown => {
      calls.push(args)
      return undefined
    },
    addEventListener: (name: string, callback: () => void) => { listeners.set(name, callback) },
  }
  const modules = new Map<string, { exports: object }>()
  function load(name: string): ModuleAPI {
    const filename = resolve(telemetryDir, name)
    const cached = modules.get(filename)
    if (cached)
      return cached.exports as ModuleAPI
    const module = { exports: {} }
    modules.set(filename, module)
    const source = readFileSync(filename, 'utf8')
      .replaceAll('import.meta.env.SSR', 'false')
      .replaceAll('import.meta.env.DEV', 'false')
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    runInNewContext(code, {
      module,
      exports: module.exports,
      require: (dependency: string) => {
        if (dependency === 'vue')
          return { shallowRef, watch }
        if (dependency === '@vueuse/core')
          return { useLocalStorage: () => enabled }
        if (dependency === './logger')
          return { telemetryLog: { info() {}, error() {} }, TelemetryLogGroup: {} }
        if (dependency === './toast')
          return { toast: { error() {} } }
        if (dependency === '~/services/telemetry/toast')
          return { toast: { error: (_message: string, options: unknown) => toasts.push(options) } }
        if (dependency === '~/forum/composables/auth/auth-helpers')
          return { withAuth: { execute: (action: () => Promise<unknown>) => action() } }
        if (dependency === '~/services/apiUtils')
          return { catchError: (promise: Promise<unknown>) => promise.then(value => [null, value], error => [error, undefined]) }
        if (dependency === '@/stores/usePageAlert')
          return { usePageAlertStore: () => ({ hasRegion: true, push: (alert: { description?: string }) => alerts.push(alert) }) }
        if (dependency === '~/utils/formatMessage')
          return { formatMessage: (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match) }
        assert.ok(dependency.startsWith('.'), `Unexpected dependency: ${dependency}`)
        return load(`${resolve(dirname(filename), dependency)}.ts`)
      },
      window,
      document,
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          if (options.storageFails)
            throw new Error('Storage unavailable')
          storage.set(key, value)
        },
      },
    })
    return module.exports as ModuleAPI
  }
  return { load, calls, listeners, enabled, document, window, storage, alerts, toasts }
}

test('clarity isolates synchronous exceptions and rejected identify promises', async () => {
  const env = runtime()
  const clarity = env.load('clarity.ts')
  env.window.clarity = () => {
    throw new Error('SDK failure')
  }
  assert.doesNotThrow(() => clarity.sendClarityEvent('test'))
  env.window.clarity = () => Promise.reject(new Error('Identify failed'))
  clarity.identifyClarityUser('anonymous', 'session')
  await new Promise(resolve => setImmediate(resolve))
})

test('storage failure retains device and support identifiers, including after rotation', () => {
  const env = runtime({ storageFails: true })
  const session = env.load('session.ts')
  const device = session.getInstallId()
  const first = session.ensureSession().code
  assert.equal(session.getInstallId(), device)
  assert.equal(session.ensureSession().code, first)
  const rotated = session.rotateSupportCode()
  assert.notEqual(rotated, first)
  assert.equal(session.ensureSession().code, rotated)
  assert.equal(session.currentSupportCode.value, rotated)
})

test('an expired stored record cannot override the memory fallback when writes fail', () => {
  const env = runtime({ storageFails: true })
  env.storage.set('telemetry:support-code:v1', JSON.stringify({ id: 'expired', expiresAt: 0 }))
  const session = env.load('session.ts')
  const current = session.ensureSession().code
  assert.notEqual(current, 'expired')
  assert.equal(session.ensureSession().code, current)
})

test('handled deletion failure returns false and preserves the original error in its toast', async () => {
  const env = runtime()
  const { executeWithAuth } = env.load('../../forum/composables/auth/executeWithAuth.ts')
  const error = new Error('Permission denied')
  const result = await executeWithAuth(async () => {
    throw error
  }, [], 'Delete failed', ref({
    forum: { auth: { loginTips: 'Sign in' } },
  }) as Parameters<typeof executeWithAuth>[3])
  assert.equal(result, false)
  assert.equal(env.toasts.length, 1)
  assert.equal((env.toasts[0] as { error: unknown }).error, error)
})

test('wrapped errors share an event within a session and report again after re-enabling', () => {
  const env = runtime()
  const capture = env.load('capture.ts')
  const settings = env.load('settings.ts')
  const original = new Error('Request failed')
  const first = capture.reportError({ error: original })
  assert.equal(capture.reportError({ error: new Error('Wrapped', { cause: original }) }), first)
  assert.equal(capture.reportError({ error: { originalError: original } }), first)
  assert.equal(env.calls.filter(call => call[0] === 'event').length, 1)
  settings.disableReporting()
  assert.equal(capture.reportError({ error: original }), null)
  settings.enableReporting()
  const second = capture.reportError({ error: original })
  assert.ok(first && second)
  assert.notEqual(second.sessionId, first.sessionId)
  assert.equal(env.calls.filter(call => call[0] === 'event').length, 2)
})

test('externally synchronized opt-out clears queued events before SDK readiness', () => {
  const env = runtime({ loaded: false })
  const settings = env.load('settings.ts')
  env.load('ops.ts').trackOp('forum_comment_submit')
  env.enabled.value = false
  env.document.documentElement.dataset.clarityLoaded = 'true'
  env.listeners.get('clarity-ready')!()
  assert.equal(settings.reportingEnabled.value, false)
  assert.equal(env.calls.length, 1)
  assert.equal(env.calls[0]![0], 'consentv2')
  assert.equal((env.calls[0]![1] as { analytics_Storage: string }).analytics_Storage, 'denied')
})

test('externally synchronized opt-in reuses the issuing tab support code', () => {
  const env = runtime()
  env.load('settings.ts')
  env.enabled.value = false
  env.storage.set('telemetry:support-code:v1', JSON.stringify({ id: 'other-tab', expiresAt: Date.now() + 60_000 }))
  env.enabled.value = true
  assert.equal(env.load('session.ts').ensureSession().code, 'other-tab')
  assert.ok(env.calls.some(call => call[0] === 'identify' && call[2] === 'other-tab'))
})

test('a support code changed in another tab is identified before the next error event', () => {
  const env = runtime()
  const capture = env.load('capture.ts')
  capture.reportError({ error: new Error('First') })
  env.calls.length = 0
  env.storage.set('telemetry:support-code:v1', JSON.stringify({ id: 'other-tab', expiresAt: Date.now() + 60_000 }))
  const reported = capture.reportError({ error: new Error('Second') })
  assert.equal(reported?.sessionId, 'other-tab')
  assert.equal(env.calls[0]?.[0], 'identify')
  assert.equal(env.calls[0]?.[2], 'other-tab')
  assert.equal(env.calls[1]?.[0], 'event')
})

test('a full event queue still preserves consent and identify commands', () => {
  const env = runtime({ loaded: false })
  const clarity = env.load('clarity.ts')
  for (let i = 0; i < 60; i++)
    clarity.sendClarityEvent(`test_${i}`)
  clarity.grantClarityConsent()
  clarity.identifyClarityUser('anonymous', 'session')
  env.document.documentElement.dataset.clarityLoaded = 'true'
  env.listeners.get('clarity-ready')!()
  assert.equal(env.calls.length, 50)
  assert.equal(env.calls[0]![0], 'consentv2')
  assert.ok(env.calls.some(call => call[0] === 'consentv2'))
  assert.ok(env.calls.some(call => call[0] === 'identify'))
})

test('opt-out page alerts retain the concrete failure without a trace identifier', () => {
  const env = runtime()
  const alerts = env.load('pageAlert.ts')
  env.enabled.value = false
  alerts.showPageAlert('Comment failed', {
    error: new Error('Permission denied'),
    description: 'Permission denied (error ID: {traceId})',
    descriptionFallback: 'Permission denied',
  })
  assert.equal(env.alerts[0]?.description, 'Permission denied')
  assert.equal(env.calls.filter(call => call[0] === 'event').length, 0)
})
