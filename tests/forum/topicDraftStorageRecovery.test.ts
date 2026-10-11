import type { TopicFormData } from '../../src/forum/services/form/validation'
import { beforeEach, expect, test, vi } from 'vitest'
import { createDefaultTopicDraft, readTopicDraft, writeTopicDraft } from '../../src/forum/services/form/topicDraft'
import { STORAGE_KEYS } from '../../src/forum/services/forumConfig'

const legacyKey = STORAGE_KEYS.FORUM_FORM_DATA
const bugKey = `${legacyKey}-bug`
let values: Map<string, string>
let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const draft: TopicFormData = { type: 'BUG', title: 'Unsaved report', text: 'Keep this body', tags: [] }

// Confirmed defects: remove .fails when implementing the corresponding fixes.
// Evidence and staged design: advisor-plans/017-forum-storage-recovery-plan.md.

beforeEach(() => {
  values = new Map()
  storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
  vi.stubGlobal('localStorage', storage)
})

test('a failed per-type overwrite retains the previous saved draft', () => {
  const previous = JSON.stringify(draft)
  values.set(bugKey, previous)
  storage.setItem = () => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  }
  expect(() => writeTopicDraft('BUG', { ...draft, text: 'New body' })).toThrow()
  expect(values.get(bugKey)).toBe(previous)
})

test('failed legacy migration retains the original bytes', () => {
  const original = JSON.stringify(draft)
  values.set(legacyKey, original)
  storage.setItem = () => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  }
  try {
    readTopicDraft('BUG')
  }
  catch {
    // This control checks preservation, independently of read-error handling.
  }
  expect(values.get(legacyKey)).toBe(original)
})

test('failed draft save must retain the legacy copy', () => {
  const original = JSON.stringify(draft)
  values.set(legacyKey, original)
  storage.setItem = () => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  }
  expect(() => writeTopicDraft('BUG', { ...draft, text: 'New body' })).toThrow()
  expect(values.get(legacyKey)).toBe(original)
})

test('saving BUG must not discard an unmigrated FEAT draft', () => {
  const feature = { ...draft, type: 'FEAT' as const, text: 'Independent feature proposal' }
  values.set(legacyKey, JSON.stringify(feature))
  writeTopicDraft('BUG', draft)
  expect(readTopicDraft('FEAT').text).toBe(feature.text)
})

test('an inaccessible storage getter must not prevent draft initialization', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => { throw new DOMException('Storage blocked', 'SecurityError') },
  })
  expect(readTopicDraft('BUG')).toEqual(createDefaultTopicDraft())
})

test('a readable legacy draft remains usable when migration cannot be persisted', () => {
  values.set(legacyKey, JSON.stringify(draft))
  storage.setItem = () => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  }
  expect(readTopicDraft('BUG')).toEqual(draft)
})

test('failed legacy cleanup does not misreport a durable draft save', () => {
  values.set(legacyKey, JSON.stringify(draft))
  storage.removeItem = () => {
    throw new DOMException('Storage blocked', 'SecurityError')
  }
  expect(() => writeTopicDraft('BUG', { ...draft, text: 'New body' })).not.toThrow()
  expect(readTopicDraft('BUG').text).toBe('New body')
  expect(values.has(legacyKey)).toBe(true)
})

test('corrupt JSON survives read fallback, but the next normal save currently destroys its only copy', () => {
  // Characterizes the missing recovery/backup policy without inventing a backup key.
  const corrupt = '{"title":"recoverable original text",'
  values.set(bugKey, corrupt)
  expect(readTopicDraft('BUG')).toEqual(createDefaultTopicDraft())
  expect(values.get(bugKey)).toBe(corrupt)
  writeTopicDraft('BUG', draft)
  expect([...values.values()]).not.toContain(corrupt)
})
