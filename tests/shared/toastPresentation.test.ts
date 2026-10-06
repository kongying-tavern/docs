import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveToastTiming } from '../../src/services/telemetry/toastPresentation'

test('mobile errors and actionable notifications remain available until dismissed', () => {
  assert.deepEqual(resolveToastTiming(true, 'error'), { duration: Infinity, closeButton: true })
  assert.deepEqual(resolveToastTiming(true, 'success', { action: {} }), { duration: Infinity, closeButton: true })
  assert.deepEqual(resolveToastTiming(true, 'info'), { duration: undefined, closeButton: undefined })
})

test('explicit timing and dismissal choices win over mobile defaults', () => {
  assert.deepEqual(resolveToastTiming(true, 'error', { duration: 6000 }), { duration: 6000, closeButton: undefined })
  assert.deepEqual(resolveToastTiming(true, 'error', { closeButton: false }), { duration: Infinity, closeButton: false })
})

test('desktop defaults defer to the configured toaster duration', () => {
  assert.deepEqual(resolveToastTiming(false, 'error'), { duration: undefined, closeButton: undefined })
  assert.deepEqual(resolveToastTiming(false, 'info', { action: {} }), { duration: undefined, closeButton: undefined })
  assert.deepEqual(resolveToastTiming(false, 'error', { duration: Infinity }), { duration: Infinity, closeButton: undefined })
})
