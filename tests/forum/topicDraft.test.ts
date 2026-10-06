import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { readSavedTopicDrafts, readTopicDraft, removeTopicDraft, writeTopicDraft } from '../../src/forum/services/form/topicDraft'
import { STORAGE_KEYS } from '../../src/forum/services/forumConfig'

function withStorage(run: (storage: Map<string, string>) => void): void {
  const storage = new Map<string, string>()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } })
  try {
    run(storage)
  }
  finally {
    if (previous)
      Object.defineProperty(globalThis, 'localStorage', previous)
    else
      Reflect.deleteProperty(globalThis, 'localStorage')
  }
}

test('saved draft lists exclude empty and corrupt slots, retain image-only drafts, and respect allowed types', () => {
  withStorage((storage) => {
    writeTopicDraft('BUG', { type: 'BUG', title: '', tags: [], text: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }) })
    writeTopicDraft('FEAT', { type: 'FEAT', title: '', tags: [], text: '', attachments: [{ src: 'https://assets.example/saved.png', alt: 'saved.png' }] })
    writeTopicDraft('ANN', { type: 'ANN', title: 'Announcement', tags: [], text: 'Announcement body' })
    assert.deepEqual(readSavedTopicDrafts(['BUG', 'FEAT']).map(draft => draft.type), ['FEAT'])
    assert.deepEqual(readSavedTopicDrafts(['BUG', 'FEAT', 'ANN']).map(draft => draft.type), ['FEAT', 'ANN'])
    writeTopicDraft('FEAT', { type: 'FEAT', title: '', tags: [], text: '' })
    assert.deepEqual(readSavedTopicDrafts(['BUG', 'FEAT']), [])
    storage.set(`${STORAGE_KEYS.FORUM_FORM_DATA}-bug`, '{bad json')
    assert.deepEqual(readSavedTopicDrafts(['BUG']), [])
  })
})

test('listing a legacy draft migrates it durably so opening the row can still restore its content', () => {
  withStorage((storage) => {
    const draft = { type: 'FEAT' as const, title: 'Legacy draft', tags: [], text: 'Saved body' }
    storage.set(STORAGE_KEYS.FORUM_FORM_DATA, JSON.stringify(draft))
    assert.deepEqual(readSavedTopicDrafts(['BUG', 'FEAT']), [draft])
    assert.deepEqual(readTopicDraft('FEAT'), draft)
    assert.deepEqual(readSavedTopicDrafts(['BUG', 'FEAT']), [draft])
    assert.equal(storage.has(STORAGE_KEYS.FORUM_FORM_DATA), false)
  })
})

test('deleting one draft removes its storage slot and leaves other types available', () => {
  withStorage((storage) => {
    writeTopicDraft('BUG', { type: 'BUG', title: '', tags: ['CATA-DOCS'], text: 'Bug draft' })
    writeTopicDraft('FEAT', { type: 'FEAT', title: 'Feature draft', tags: [], text: 'Feature body', attachments: [{ src: 'https://assets.example/saved.png' }] })
    removeTopicDraft('FEAT')
    assert.equal(storage.has(`${STORAGE_KEYS.FORUM_FORM_DATA}-feat`), false)
    assert.deepEqual(readSavedTopicDrafts(['BUG', 'FEAT']).map(draft => draft.type), ['BUG'])
    assert.equal(readTopicDraft('FEAT').attachments, undefined)
    assert.equal(readTopicDraft('BUG').text, 'Bug draft')
  })
})
